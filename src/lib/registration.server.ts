import dns from "node:dns/promises";
import { Prisma } from "@prisma/client";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { sendRegistrationConfirmationEmail } from "./email.server";
import { prisma } from "./prisma";
import { buildTestingUrl, generateQrPngBuffer, generateQrToken } from "./qr.server";

const ALLOWED_YEARS = ["1st Year", "2nd Year", "3rd Year", "4th Year"] as const;
const ALLOWED_USED_GCP = ["", "yes", "no"] as const;
const ALLOWED_EXPERIENCE = ["", "beginner", "some", "experienced"] as const;

const DISPOSABLE_OR_FAKE_DOMAINS = new Set([
  "example.com",
  "example.org",
  "example.net",
  "test.com",
  "mailinator.com",
  "yopmail.com",
  "tempmail.com",
  "temp-mail.org",
  "10minutemail.com",
  "guerrillamail.com",
  "sharklasers.com",
  "trashmail.com",
  "fakeinbox.com",
  "getnada.com",
  "maildrop.cc",
  "dispostable.com",
]);

const COMMON_DOMAIN_TYPOS: Record<string, string> = {
  "gmial.com": "gmail.com",
  "gamil.com": "gmail.com",
  "gmai.com": "gmail.com",
  "gmail.co": "gmail.com",
  "gmail.con": "gmail.com",
  "yaho.com": "yahoo.com",
  "yahooo.com": "yahoo.com",
  "outlok.com": "outlook.com",
  "hotmial.com": "hotmail.com",
};

// In-memory sliding window rate limiter for serverless / Node runtime
const rateLimitBuckets = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 10;
const MAX_EMAIL_ATTEMPTS_PER_REGISTRATION = 5;
const EMAIL_RETRY_COOLDOWN_MS = 5_000;

export function checkRateLimit(key: string): boolean {
  const now = Date.now();
  const timestamps = rateLimitBuckets.get(key) ?? [];
  const recent = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  if (recent.length >= RATE_LIMIT_MAX_REQUESTS) {
    rateLimitBuckets.set(key, recent);
    return false;
  }
  recent.push(now);
  rateLimitBuckets.set(key, recent);
  return true;
}

export function normalizeEmailAddress(rawEmail: string): string {
  return rawEmail.trim().toLowerCase();
}

export const registrationSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Full name must be at least 2 characters")
    .max(120, "Full name cannot exceed 120 characters"),
  rollNumber: z
    .string()
    .trim()
    .toUpperCase()
    .min(4, "Please enter your roll number (e.g. 25951A05F3)")
    .max(24, "Roll number cannot exceed 24 characters")
    .regex(
      /^[A-Z0-9-]+$/,
      "Roll number can only contain letters, numbers, and hyphens (e.g. 25951A05F3)",
    ),
  collegeEmail: z
    .string()
    .trim()
    .toLowerCase()
    .min(5, "Please enter your email address")
    .max(254, "Email address is too long")
    .email("Enter a valid email address"),
  collegeName: z
    .string()
    .trim()
    .min(2, "Please enter your college name")
    .max(160, "College name cannot exceed 160 characters"),
  yearOfStudy: z.enum(ALLOWED_YEARS, {
    errorMap: () => ({ message: "Please select a valid year of study" }),
  }),
  branch: z
    .string()
    .trim()
    .min(1, "Please enter your branch or department")
    .max(80, "Branch cannot exceed 80 characters"),
  phone: z
    .string()
    .trim()
    .max(25, "Phone number cannot exceed 25 characters")
    .refine((v) => !v || /^[+\d\s()-]{7,25}$/.test(v), {
      message: "Enter a valid phone number",
    })
    .optional()
    .default(""),
  usedGcp: z
    .enum(ALLOWED_USED_GCP)
    .optional()
    .default(""),
  experienceLevel: z
    .enum(ALLOWED_EXPERIENCE)
    .optional()
    .default(""),
  cloudInterest: z
    .string()
    .trim()
    .max(500, "Interest note cannot exceed 500 characters")
    .optional()
    .default(""),
  consent: z.boolean().refine((v) => v === true, {
    message: "Please agree to receive event updates to continue",
  }),
});

export type RegistrationInput = z.infer<typeof registrationSchema>;

export interface RegistrationOutcome {
  ok: boolean;
  statusCode: 201 | 200 | 400 | 409 | 429 | 502 | 500;
  code:
    | "REGISTERED"
    | "EMAIL_RETRIED_AND_SENT"
    | "VALIDATION_ERROR"
    | "EMAIL_INVALID"
    | "DUPLICATE_EMAIL"
    | "RATE_LIMITED"
    | "EMAIL_DELIVERY_FAILED"
    | "SERVER_ERROR";
  playerCode?: string;
  emailStatus?: "PENDING" | "SENT" | "FAILED";
  message: string;
  fieldErrors?: Partial<Record<keyof RegistrationInput, string>>;
}

async function verifyEmailDomainCanReceiveMail(
  email: string,
): Promise<{ valid: true } | { valid: false; message: string }> {
  const domain = email.split("@")[1]?.toLowerCase().trim();
  if (!domain || !domain.includes(".")) {
    return { valid: false, message: "Please enter a valid email address." };
  }

  if (process.env["GMAIL_ONLY_REGISTRATION"] === "true") {
    if (domain !== "gmail.com" && domain !== "googlemail.com") {
      return {
        valid: false,
        message: "Only @gmail.com email addresses are permitted for registration.",
      };
    }
  }

  const suggested = COMMON_DOMAIN_TYPOS[domain];
  if (suggested) {
    return {
      valid: false,
      message: `Did you mean @${suggested}? Please check your email address.`,
    };
  }

  if (DISPOSABLE_OR_FAKE_DOMAINS.has(domain)) {
    return {
      valid: false,
      message:
        "Please use a real personal or college email address (disposable/test emails are not allowed).",
    };
  }

  try {
    const mxRecords = await dns.resolveMx(domain);
    const hasValidMx =
      Array.isArray(mxRecords) &&
      mxRecords.length > 0 &&
      mxRecords.some((r) => Boolean(r.exchange && r.exchange.trim() && r.exchange !== "."));

    if (!hasValidMx) {
      return {
        valid: false,
        message: `The domain "${domain}" cannot receive emails. Please check your email address.`,
      };
    }
    return { valid: true };
  } catch {
    return {
      valid: false,
      message: `Could not verify mail server for "${domain}". Please enter a real email address.`,
    };
  }
}

async function generateUniquePlayerCode(): Promise<string> {
  for (let attempt = 0; attempt < 8; attempt++) {
    const num = Math.floor(1000 + Math.random() * 9000);
    const code = `IARE-${num}`;
    const existing = await prisma.registration.findUnique({
      where: { playerCode: code },
      select: { id: true },
    });
    if (!existing) return code;
  }
  return `IARE-${Date.now().toString().slice(-4)}`;
}

async function generateUniqueQrToken(): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const token = generateQrToken();
    const existing = await prisma.registration.findUnique({
      where: { qrToken: token },
      select: { id: true },
    });
    if (!existing) return token;
  }
  return generateQrToken();
}

/**
 * Core server-side registration processor used by both the TanStack Start server function
 * and the HTTP API route (/api/register).
 */
export async function processRegistrationSubmission(
  rawInput: unknown,
  clientKey = "global",
): Promise<RegistrationOutcome> {
  if (!checkRateLimit(clientKey)) {
    return {
      ok: false,
      statusCode: 429,
      code: "RATE_LIMITED",
      message: "Too many registration attempts. Please wait a minute and try again.",
    };
  }

  const parsed = registrationSchema.safeParse(rawInput);
  if (!parsed.success) {
    const fieldErrors: Partial<Record<keyof RegistrationInput, string>> = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0] as keyof RegistrationInput | undefined;
      if (field && !fieldErrors[field]) {
        fieldErrors[field] = issue.message;
      }
    }
    const firstMessage = parsed.error.issues[0]?.message ?? "Invalid registration data.";
    return {
      ok: false,
      statusCode: 400,
      code: "VALIDATION_ERROR",
      message: firstMessage,
      fieldErrors,
    };
  }

  const data = {
    ...parsed.data,
    collegeEmail: normalizeEmailAddress(parsed.data.collegeEmail),
  };

  if (!checkRateLimit(`email:${data.collegeEmail}`)) {
    return {
      ok: false,
      statusCode: 429,
      code: "RATE_LIMITED",
      message: "Too many requests for this email address. Please wait a moment and try again.",
    };
  }

  const mxCheck = await verifyEmailDomainCanReceiveMail(data.collegeEmail);
  if (!mxCheck.valid) {
    return {
      ok: false,
      statusCode: 400,
      code: "EMAIL_INVALID",
      message: mxCheck.message,
      fieldErrors: { collegeEmail: mxCheck.message },
    };
  }

  let registration: Awaited<ReturnType<typeof prisma.registration.findUnique>>;
  let isNewRegistration = false;

  try {
    const existing = await prisma.registration.findUnique({
      where: { collegeEmail: data.collegeEmail },
    });

    if (existing) {
      if (existing.emailStatus === "SENT") {
        return {
          ok: false,
          statusCode: 409,
          code: "DUPLICATE_EMAIL",
          playerCode: existing.playerCode,
          emailStatus: "SENT",
          message: `This email address is already registered for Google Cloud Study Jams (Pass #${existing.playerCode}).`,
          fieldErrors: {
            collegeEmail: `This email address is already registered (Pass #${existing.playerCode}).`,
          },
        };
      }

      if (existing.emailAttempts >= MAX_EMAIL_ATTEMPTS_PER_REGISTRATION) {
        return {
          ok: false,
          statusCode: 429,
          code: "RATE_LIMITED",
          playerCode: existing.playerCode,
          emailStatus: existing.emailStatus,
          message: `Your registration (Pass #${existing.playerCode}) is saved, but maximum email retry attempts were reached. Please contact the organizers.`,
        };
      }

      if (
        existing.lastEmailAttemptAt &&
        Date.now() - existing.lastEmailAttemptAt.getTime() < EMAIL_RETRY_COOLDOWN_MS
      ) {
        return {
          ok: false,
          statusCode: 429,
          code: "RATE_LIMITED",
          playerCode: existing.playerCode,
          emailStatus: existing.emailStatus,
          message: "Please wait a few seconds before retrying email delivery.",
        };
      }

      registration = existing;
    } else {
      const [playerCode, qrToken] = await Promise.all([
        generateUniquePlayerCode(),
        generateUniqueQrToken(),
      ]);

      try {
        registration = await prisma.registration.create({
          data: {
            playerCode,
            qrToken,
            fullName: data.fullName,
            rollNumber: data.rollNumber,
            collegeEmail: data.collegeEmail,
            collegeName: data.collegeName,
            yearOfStudy: data.yearOfStudy,
            branch: data.branch,
            phone: data.phone || null,
            usedGcp: data.usedGcp || null,
            experienceLevel: data.experienceLevel || null,
            cloudInterest: data.cloudInterest || null,
            consent: data.consent,
            status: "REGISTERED",
            emailStatus: "PENDING",
          },
        });
        isNewRegistration = true;
      } catch (createErr) {
        // Handle concurrent duplicate submission hitting PostgreSQL @unique constraint
        if (
          createErr instanceof Prisma.PrismaClientKnownRequestError &&
          createErr.code === "P2002"
        ) {
          const concurrentRecord = await prisma.registration.findUnique({
            where: { collegeEmail: data.collegeEmail },
          });
          if (concurrentRecord) {
            return {
              ok: false,
              statusCode: 409,
              code: "DUPLICATE_EMAIL",
              playerCode: concurrentRecord.playerCode,
              emailStatus: concurrentRecord.emailStatus,
              message: `This email address is already registered for Google Cloud Study Jams (Pass #${concurrentRecord.playerCode}).`,
              fieldErrors: {
                collegeEmail: `This email address is already registered (Pass #${concurrentRecord.playerCode}).`,
              },
            };
          }
        }
        throw createErr;
      }
    }
  } catch (dbErr) {
    console.error("[registration] Database error:", dbErr instanceof Error ? dbErr.message : dbErr);
    return {
      ok: false,
      statusCode: 500,
      code: "SERVER_ERROR",
      message: "Unable to save your registration at this moment. Please try again shortly.",
    };
  }

  if (!registration) {
    return {
      ok: false,
      statusCode: 500,
      code: "SERVER_ERROR",
      message: "Registration record could not be initialized.",
    };
  }

  // Step 2: Generate QR code in memory and send confirmation email via Resend
  const attemptNumber = registration.emailAttempts + 1;
  const testingUrl = buildTestingUrl(registration.qrToken);

  let qrPngBuffer: Buffer;
  try {
    qrPngBuffer = await generateQrPngBuffer(testingUrl);
  } catch (qrErr) {
    const errText = qrErr instanceof Error ? qrErr.message : "QR generation failed";
    await prisma.registration
      .update({
        where: { id: registration.id },
        data: {
          emailStatus: "FAILED",
          emailError: `QR generation error: ${errText}`,
          emailAttempts: attemptNumber,
          lastEmailAttemptAt: new Date(),
        },
      })
      .catch(() => undefined);

    return {
      ok: false,
      statusCode: 502,
      code: "EMAIL_DELIVERY_FAILED",
      playerCode: registration.playerCode,
      emailStatus: "FAILED",
      message: `Your registration (Pass #${registration.playerCode}) is saved, but QR ticket generation encountered an error. Submit again with the same email to retry.`,
    };
  }

  const emailResult = await sendRegistrationConfirmationEmail({
    registrationId: registration.id,
    playerCode: registration.playerCode,
    fullName: registration.fullName,
    rollNumber: registration.rollNumber,
    email: registration.collegeEmail,
    collegeName: registration.collegeName,
    yearOfStudy: registration.yearOfStudy,
    branch: registration.branch,
    testingUrl,
    qrPngBuffer,
    attemptNumber,
  });

  if (!emailResult.sent) {
    await prisma.registration
      .update({
        where: { id: registration.id },
        data: {
          emailStatus: "FAILED",
          emailError: emailResult.error ?? "Unknown email delivery failure",
          emailAttempts: attemptNumber,
          lastEmailAttemptAt: new Date(),
        },
      })
      .catch(() => undefined);

    return {
      ok: false,
      statusCode: 502,
      code: "EMAIL_DELIVERY_FAILED",
      playerCode: registration.playerCode,
      emailStatus: "FAILED",
      message: `Your registration (Pass #${registration.playerCode}) has been saved, but confirmation email delivery failed. You can submit again with the same email to retry sending your QR pass.`,
    };
  }

  await prisma.registration
    .update({
      where: { id: registration.id },
      data: {
        emailStatus: "SENT",
        emailSentAt: new Date(),
        emailMessageId: emailResult.messageId ?? null,
        emailError: null,
        emailAttempts: attemptNumber,
        lastEmailAttemptAt: new Date(),
      },
    })
    .catch(() => undefined);

  return {
    ok: true,
    statusCode: isNewRegistration ? 201 : 200,
    code: isNewRegistration ? "REGISTERED" : "EMAIL_RETRIED_AND_SENT",
    playerCode: registration.playerCode,
    emailStatus: "SENT",
    message:
      "Registration confirmed! Your participant pass and QR code have been sent to your email.",
  };
}

export interface VerifiedParticipantDetails {
  found: boolean;
  playerCode?: string;
  fullName?: string;
  rollNumber?: string;
  collegeEmail?: string;
  collegeName?: string;
  yearOfStudy?: string;
  branch?: string;
  experienceLevel?: string | null;
  status?: string;
  registeredAt?: string;
}

export const getRegistrationByQrToken = createServerFn({ method: "GET" })
  .validator((token: string | undefined) => (typeof token === "string" ? token.trim() : ""))
  .handler(async ({ data: token }): Promise<VerifiedParticipantDetails> => {
    if (!token || !/^[A-Za-z0-9_-]{8,64}$/.test(token)) {
      return { found: false };
    }

    try {
      const record = await prisma.registration.findUnique({
        where: { qrToken: token },
        select: {
          playerCode: true,
          fullName: true,
          rollNumber: true,
          collegeEmail: true,
          collegeName: true,
          yearOfStudy: true,
          branch: true,
          experienceLevel: true,
          status: true,
          createdAt: true,
        },
      });

      if (!record) {
        return { found: false };
      }

      return {
        found: true,
        playerCode: record.playerCode,
        fullName: record.fullName,
        rollNumber: record.rollNumber || "—",
        collegeEmail: record.collegeEmail,
        collegeName: record.collegeName,
        yearOfStudy: record.yearOfStudy,
        branch: record.branch,
        experienceLevel: record.experienceLevel,
        status: record.status,
        registeredAt: record.createdAt.toISOString(),
      };
    } catch (err) {
      console.error("[qr-lookup] Error fetching participant by qrToken:", err);
      return { found: false };
    }
  });

export const submitRegistration = createServerFn({ method: "POST" })
  .validator((input: unknown) => input)
  .handler(async ({ data }): Promise<RegistrationOutcome> => {
    return await processRegistrationSubmission(data, "server-fn");
  });
