import { afterAll, describe, expect, it } from "vitest";
import { buildConfirmationEmailContent } from "@/lib/email.server";
import { prisma } from "@/lib/prisma";
import { buildTestingUrl, generateQrPngBuffer, generateQrToken } from "@/lib/qr.server";
import { processRegistrationSubmission } from "@/lib/registration.server";

const TEST_EMAIL = `vitest.studyjams.${Date.now()}@gmail.com`;

describe("Study Jams Registration Backend & QR System", () => {
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

  it("2. builds branded HTML and plain-text confirmation email without inventing unconfirmed details", async () => {
    const token = generateQrToken();
    const testingUrl = buildTestingUrl(token);
    const pngBuffer = await generateQrPngBuffer(testingUrl);

    const { subject, html, text } = buildConfirmationEmailContent({
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
    });

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
  });

  it("3. rejects invalid form data, typo domains, and disposable email domains", async () => {
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

  it("4. saves valid registration to PostgreSQL, preserves it if email is unconfigured/fails, and rejects duplicates once SENT", async () => {
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

    if (!process.env["RESEND_API_KEY"]) {
      // Without RESEND_API_KEY, emailStatus must be FAILED and registration preserved
      expect(outcome.ok).toBe(false);
      expect(outcome.code).toBe("EMAIL_DELIVERY_FAILED");
      expect(saved?.emailStatus).toBe("FAILED");
      expect(saved?.emailError).toContain("RESEND_API_KEY");
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
