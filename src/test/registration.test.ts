import { afterAll, describe, expect, it } from "vitest";
import {
  buildConfirmationEmailContent,
  buildRawMimeMessage,
  encodeBase64Url,
  sanitizeGmailError,
  sendRegistrationConfirmationEmail,
} from "@/lib/email.server";
import {
  GMAIL_SEND_SCOPE,
  OAUTH_STATE_COOKIE_NAME,
  generateOAuthState,
  handleGoogleOAuthCallback,
  handleGoogleOAuthStart,
  validateOAuthState,
} from "@/lib/gmail-oauth.server";
import { prisma } from "@/lib/prisma";
import { buildTestingUrl, generateQrPngBuffer, generateQrToken } from "@/lib/qr.server";
import { processRegistrationSubmission } from "@/lib/registration.server";

const TEST_EMAIL = `vitest.studyjams.${Date.now()}@gmail.com`;

describe("Study Jams Registration Backend, Gmail API MIME & OAuth System", () => {
  afterAll(async () => {
    await prisma.registration
      .deleteMany({
        where: { collegeEmail: TEST_EMAIL },
      })
      .catch(() => undefined);
    await prisma.$disconnect();
  });

  it("1. generates a cryptographically random QR token and valid in-memory PNG with expected /testing URL", async () => {
    const token = generateQrToken();
    expect(token).toMatch(/^[A-Za-z0-9_-]{32}$/);

    const testingUrl = buildTestingUrl(token);
    expect(testingUrl).toContain(`/testing?ref=${token}`);

    const pngBuffer = await generateQrPngBuffer(testingUrl);
    expect(Buffer.isBuffer(pngBuffer)).toBe(true);
    expect(pngBuffer.byteLength).toBeGreaterThan(200);
    // Verify PNG magic header bytes: 89 50 4E 47 0D 0A 1A 0A
    expect(pngBuffer.subarray(0, 8).toString("hex")).toBe("89504e470d0a1a0a");
  });

  it("2. builds branded HTML and plain-text confirmation email and constructs valid base64url MIME with inline CID + attachment", async () => {
    const token = generateQrToken();
    const testingUrl = buildTestingUrl(token);
    const pngBuffer = await generateQrPngBuffer(testingUrl);

    const emailInput = {
      registrationId: "reg_test_123",
      playerCode: "IARE-9999",
      fullName: "Aarav Sharma",
      rollNumber: "25951A05F3",
      email: TEST_EMAIL,
      collegeName: "Institute of Aeronautical Engineering (IARE)",
      yearOfStudy: "2nd Year",
      branch: "CSE",
      testingUrl,
      qrPngBuffer: pngBuffer,
      attemptNumber: 1,
    };

    const { subject, html, text } = buildConfirmationEmailContent(emailInput);

    expect(subject).toContain("IARE-9999");
    expect(html).toContain("Aarav Sharma");
    expect(html).toContain("25951A05F3");
    expect(html).toContain("GOOGLE CLOUD");
    expect(html).toContain("STUDY JAMS");
    expect(html).toContain("GDG on Campus at IARE");
    expect(html).toContain("cid:studyjams-qr");
    expect(html).toContain(testingUrl);
    expect(html).not.toContain("[Add event date]");
    expect(text).toContain("Aarav Sharma");
    expect(text).toContain("#IARE-9999");
    expect(text).toContain(testingUrl);

    const { rawMime, encodedMessage, attachmentFilename } = buildRawMimeMessage({
      ...emailInput,
      fromEmail: "gdg.iare@gmail.com",
    });

    expect(attachmentFilename).toBe("study-jams-qr-IARE-9999.png");
    expect(rawMime).toContain('Content-Type: multipart/mixed; boundary="mixed_');
    expect(rawMime).toContain(
      'Content-Type: multipart/related; type="multipart/alternative"; boundary="related_',
    );
    expect(rawMime).toContain('Content-Type: multipart/alternative; boundary="alt_');
    expect(rawMime).toContain("Content-ID: <studyjams-qr>");
    expect(rawMime).toContain(
      'Content-Disposition: inline; filename="study-jams-qr-IARE-9999.png"',
    );
    expect(rawMime).toContain(
      'Content-Disposition: attachment; filename="study-jams-qr-IARE-9999.png"',
    );

    // Verify base64url encoding contains no +, /, or = padding and decodes cleanly
    expect(encodedMessage).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(encodeBase64Url(Buffer.from([0xfb, 0xff, 0xfe]))).not.toMatch(/[+/=]/);
    const decodedMime = Buffer.from(encodedMessage, "base64url").toString("utf8");
    expect(decodedMime).toBe(rawMime);
  });

  it("3. validates OAuth CSRF state tokens and enforces safe callback behavior without exposing tokens", async () => {
    const state = generateOAuthState();
    expect(state).toMatch(/^[A-Za-z0-9_-]{43}$/);

    const validCookie = `${OAUTH_STATE_COOKIE_NAME}=${state}`;
    expect(validateOAuthState(state, validCookie)).toBe(true);
    expect(validateOAuthState("wrong_state_value_1234567890", validCookie)).toBe(false);
    expect(validateOAuthState(state, "")).toBe(false);
    expect(validateOAuthState(null, validCookie)).toBe(false);

    // Verify OAuth start route redirects with gmail.send scope and HttpOnly cookie when client credentials exist
    const prevClientId = process.env["GOOGLE_CLIENT_ID"];
    const prevClientSecret = process.env["GOOGLE_CLIENT_SECRET"];
    process.env["GOOGLE_CLIENT_ID"] = "test-client-id.apps.googleusercontent.com";
    process.env["GOOGLE_CLIENT_SECRET"] = "test-client-secret";

    try {
      const startReq = new Request("http://localhost:8080/api/auth/google", {
        method: "GET",
      });
      const startRes = await handleGoogleOAuthStart(startReq);
      expect(startRes.status).toBe(302);
      const location = startRes.headers.get("Location") ?? "";
      expect(location).toContain("accounts.google.com");
      expect(location).toContain(encodeURIComponent(GMAIL_SEND_SCOPE));
      expect(location).toContain("access_type=offline");
      const setCookie = startRes.headers.get("Set-Cookie") ?? "";
      expect(setCookie).toContain(OAUTH_STATE_COOKIE_NAME);
      expect(setCookie).toContain("HttpOnly");
      expect(setCookie).toContain("SameSite=Lax");

      // Verify callback rejects mismatched state
      const badCallbackReq = new Request(
        `http://localhost:8080/api/auth/google/callback?code=auth_code_123&state=invalid_state_token_12345`,
        {
          method: "GET",
          headers: { cookie: validCookie },
        },
      );
      const badCallbackRes = await handleGoogleOAuthCallback(badCallbackReq);
      expect(badCallbackRes.status).toBe(400);

      // Verify callback exchanges code and NEVER leaks refresh_token in HTML response
      const fakeRefreshToken = "1//0g_FAKE_SECRET_REFRESH_TOKEN_DO_NOT_EXPOSE";
      const goodCallbackReq = new Request(
        `http://localhost:8080/api/auth/google/callback?code=valid_code_123&state=${encodeURIComponent(state)}`,
        {
          method: "GET",
          headers: { cookie: validCookie },
        },
      );
      const prevNodeEnv = process.env["NODE_ENV"];
      process.env["NODE_ENV"] = "production";
      try {
        const goodCallbackRes = await handleGoogleOAuthCallback(goodCallbackReq, {
          getToken: async () => ({
            tokens: {
              refresh_token: fakeRefreshToken,
              access_token: "ya29.fake_access_token",
            },
          }),
        });
        expect(goodCallbackRes.status).toBe(200);
        const bodyHtml = await goodCallbackRes.text();
        expect(bodyHtml).toContain("GMAIL OAUTH CONNECTED");
        expect(bodyHtml).not.toContain(fakeRefreshToken);
        expect(bodyHtml).not.toContain("ya29.fake_access_token");
      } finally {
        process.env["NODE_ENV"] = prevNodeEnv;
      }
    } finally {
      if (prevClientId === undefined) delete process.env["GOOGLE_CLIENT_ID"];
      else process.env["GOOGLE_CLIENT_ID"] = prevClientId;
      if (prevClientSecret === undefined) delete process.env["GOOGLE_CLIENT_SECRET"];
      else process.env["GOOGLE_CLIENT_SECRET"] = prevClientSecret;
    }
  });

  it("4. maps Gmail API users.messages.send responses and sanitizes OAuth / quota / API errors", async () => {
    const token = generateQrToken();
    const testingUrl = buildTestingUrl(token);
    const pngBuffer = await generateQrPngBuffer(testingUrl);

    const emailInput = {
      registrationId: "reg_gmail_mock",
      playerCode: "IARE-1234",
      fullName: "Aarav Sharma",
      rollNumber: "25951A05F3",
      email: TEST_EMAIL,
      collegeName: "IARE",
      yearOfStudy: "2nd Year",
      branch: "CSE",
      testingUrl,
      qrPngBuffer: pngBuffer,
      attemptNumber: 1,
    };

    let capturedUserId = "";
    let capturedRaw = "";
    const successResult = await sendRegistrationConfirmationEmail(emailInput, {
      senderEmail: "gdg.iare@gmail.com",
      client: {
        users: {
          messages: {
            send: async (params) => {
              capturedUserId = params.userId;
              capturedRaw = params.requestBody.raw;
              return { data: { id: "gmail_msg_987654321" } };
            },
          },
        },
      },
    });

    expect(successResult.sent).toBe(true);
    expect(successResult.messageId).toBe("gmail_msg_987654321");
    expect(capturedUserId).toBe("me");
    expect(capturedRaw.length).toBeGreaterThan(100);

    // Sanitized error checks
    expect(
      sanitizeGmailError({
        response: {
          status: 400,
          data: {
            error: "invalid_grant",
            error_description: "Token has been expired or revoked.",
          },
        },
      }),
    ).toContain("invalid_grant");

    expect(
      sanitizeGmailError({
        response: {
          status: 401,
          data: { error: "invalid_client" },
        },
      }),
    ).toContain("invalid OAuth client credentials");

    expect(
      sanitizeGmailError({
        response: {
          status: 429,
          data: {
            error: {
              code: 429,
              message: "User-rate limit exceeded.",
              errors: [{ reason: "rateLimitExceeded" }],
            },
          },
        },
      }),
    ).toContain("quota or rate limit exceeded");
  });

  it("5. rejects invalid form data, typo domains, and disposable email domains", async () => {
    const missingName = await processRegistrationSubmission(
      {
        fullName: "",
        collegeEmail: "student@gmail.com",
        collegeName: "IARE",
        yearOfStudy: "2nd Year",
        branch: "CSE",
        consent: true,
      },
      "test-invalid-1",
    );
    expect(missingName.ok).toBe(false);
    expect(missingName.statusCode).toBe(400);

    const typoEmail = await processRegistrationSubmission(
      {
        fullName: "Test Student",
        rollNumber: "25951A05F3",
        collegeEmail: "student@gmial.com",
        collegeName: "IARE",
        yearOfStudy: "2nd Year",
        branch: "CSE",
        consent: true,
      },
      "test-invalid-2",
    );
    expect(typoEmail.ok).toBe(false);
    expect(typoEmail.statusCode).toBe(400);
    expect(typoEmail.message).toContain("@gmail.com");

    const disposableEmail = await processRegistrationSubmission(
      {
        fullName: "Test Student",
        rollNumber: "25951A05F3",
        collegeEmail: "student@mailinator.com",
        collegeName: "IARE",
        yearOfStudy: "2nd Year",
        branch: "CSE",
        consent: true,
      },
      "test-invalid-3",
    );
    expect(disposableEmail.ok).toBe(false);
    expect(disposableEmail.statusCode).toBe(400);
  });

  it("6. saves valid registration to PostgreSQL, preserves it if Gmail API is unconfigured/fails, and rejects duplicates once SENT", async () => {
    const outcome = await processRegistrationSubmission(
      {
        fullName: "Aarav Sharma",
        rollNumber: "25951a05f3",
        collegeEmail: `  ${TEST_EMAIL.toUpperCase()}  `,
        collegeName: "Institute of Aeronautical Engineering (IARE)",
        yearOfStudy: "2nd Year",
        branch: "CSE",
        phone: "+91 9876543210",
        usedGcp: "no",
        experienceLevel: "beginner",
        cloudInterest: "Cloud & AI",
        consent: true,
      },
      "test-valid-submit",
    );

    // Verify record was persisted in PostgreSQL with normalized email and unique qrToken
    const saved = await prisma.registration.findUnique({
      where: { collegeEmail: TEST_EMAIL },
    });
    expect(saved).not.toBeNull();
    expect(saved?.fullName).toBe("Aarav Sharma");
    expect(saved?.rollNumber).toBe("25951A05F3");
    expect(saved?.playerCode).toMatch(/^IARE-\d{4}$/);
    expect(saved?.qrToken).toMatch(/^[A-Za-z0-9_-]{32}$/);
    expect(saved?.status).toBe("REGISTERED");

    const hasFullGmailConfig = Boolean(
      process.env["GOOGLE_CLIENT_ID"] &&
        process.env["GOOGLE_CLIENT_SECRET"] &&
        process.env["GMAIL_REFRESH_TOKEN"] &&
        process.env["GMAIL_SENDER_EMAIL"],
    );

    if (!hasFullGmailConfig) {
      // Without Gmail env vars, emailStatus must be FAILED and registration preserved
      expect(outcome.ok).toBe(false);
      expect(outcome.code).toBe("EMAIL_DELIVERY_FAILED");
      expect(saved?.emailStatus).toBe("FAILED");
      expect(saved?.emailError).toContain("Missing required Gmail environment variables");
    }

    // Mark as SENT to verify duplicate submission protection (409 Conflict)
    await prisma.registration.update({
      where: { collegeEmail: TEST_EMAIL },
      data: { emailStatus: "SENT", emailSentAt: new Date() },
    });

    const duplicateAttempt = await processRegistrationSubmission(
      {
        fullName: "Aarav Sharma",
        rollNumber: "25951A05F3",
        collegeEmail: TEST_EMAIL,
        collegeName: "Institute of Aeronautical Engineering (IARE)",
        yearOfStudy: "2nd Year",
        branch: "CSE",
        consent: true,
      },
      "test-duplicate-submit",
    );

    expect(duplicateAttempt.ok).toBe(false);
    expect(duplicateAttempt.statusCode).toBe(409);
    expect(duplicateAttempt.code).toBe("DUPLICATE_EMAIL");

    // Ensure only 1 row exists for TEST_EMAIL
    const count = await prisma.registration.count({
      where: { collegeEmail: TEST_EMAIL },
    });
    expect(count).toBe(1);
  });
});
