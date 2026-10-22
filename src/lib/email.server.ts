import { Resend } from "resend";
import { EVENT } from "@/config/event";

export interface SendConfirmationEmailInput {
  registrationId: string;
  playerCode: string;
  fullName: string;
  email: string;
  collegeName: string;
  yearOfStudy: string;
  branch: string;
  testingUrl: string;
  qrPngBuffer: Buffer;
  attemptNumber: number;
}

export interface SendConfirmationEmailResult {
  sent: boolean;
  messageId?: string;
  error?: string;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function isConfirmedDetail(value: string | undefined): value is string {
  if (!value) return false;
  const trimmed = value.trim();
  return Boolean(trimmed && !trimmed.startsWith("["));
}

export function buildConfirmationEmailContent(input: SendConfirmationEmailInput): {
  subject: string;
  html: string;
  text: string;
} {
  const safeName = escapeHtml(input.fullName);
  const safePlayerCode = escapeHtml(input.playerCode);
  const safeCollege = escapeHtml(input.collegeName);
  const safeBranch = escapeHtml(input.branch);
  const safeYear = escapeHtml(input.yearOfStudy);
  const safeUrl = escapeHtml(input.testingUrl);

  const confirmedDetails: Array<{ label: string; value: string }> = [];
  if (isConfirmedDetail(EVENT.date)) {
    confirmedDetails.push({ label: "Date", value: EVENT.date });
  }
  if (isConfirmedDetail(EVENT.venue)) {
    confirmedDetails.push({ label: "Venue / Mode", value: EVENT.venue });
  }

  const confirmedHtmlRows = confirmedDetails
    .map(
      (d) => `
      <tr>
        <td style="padding: 6px 0; color: #9ca3af; font-size: 13px;">${escapeHtml(d.label)}</td>
        <td style="padding: 6px 0; color: #f3f4f6; font-size: 13px; text-align: right; font-weight: 600;">${escapeHtml(d.value)}</td>
      </tr>`,
    )
    .join("");

  const confirmedTextLines = confirmedDetails
    .map((d) => `- ${d.label}: ${d.value}`)
    .join("\n");

  const subject = `Registration Confirmed (${input.playerCode}) — Google Cloud Study Jams · GDG on Campus IARE`;

  const html = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(subject)}</title>
  </head>
  <body style="margin: 0; padding: 0; background-color: #0b0d19; color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #0b0d19; padding: 32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 560px; background-color: #13172b; border: 1px solid #00e5ff; border-radius: 4px; overflow: hidden;">
            <!-- Header -->
            <tr>
              <td style="padding: 28px 28px 20px 28px; border-bottom: 1px solid rgba(0, 229, 255, 0.2); text-align: center;">
                <div style="font-size: 11px; letter-spacing: 2px; text-transform: uppercase; color: #ff2a85; font-weight: 700;">
                  Hosted by GDG on Campus at IARE
                </div>
                <h1 style="margin: 8px 0 4px 0; font-size: 24px; letter-spacing: 0.5px; color: #ffffff;">
                  GOOGLE CLOUD <span style="color: #00e5ff;">STUDY JAMS</span>
                </h1>
                <div style="font-size: 13px; color: #9ca3af;">
                  Registration Confirmed
                </div>
              </td>
            </tr>

            <!-- Body -->
            <tr>
              <td style="padding: 28px;">
                <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 1.5; color: #f3f4f6;">
                  Hi <strong>${safeName}</strong>,
                </p>
                <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.6; color: #d1d5db;">
                  Your registration for <strong>Google Cloud Study Jams</strong> hosted by <strong>GDG on Campus at IARE</strong> has been recorded. Keep this email handy—your participant pass and QR code are attached below.
                </p>

                <!-- Pass Card -->
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #0b0d19; border: 1px solid rgba(0, 229, 255, 0.35); padding: 18px; margin-bottom: 24px;">
                  <tr>
                    <td style="padding-bottom: 10px; border-bottom: 1px solid rgba(255,255,255,0.1); font-size: 12px; letter-spacing: 1.5px; text-transform: uppercase; color: #00e5ff; font-weight: 700;">
                      Player Pass
                    </td>
                    <td style="padding-bottom: 10px; border-bottom: 1px solid rgba(255,255,255,0.1); font-size: 13px; text-align: right; color: #ff2a85; font-family: monospace; font-weight: 700;">
                      #${safePlayerCode}
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 0 6px 0; color: #9ca3af; font-size: 13px;">Participant</td>
                    <td style="padding: 10px 0 6px 0; color: #f3f4f6; font-size: 13px; text-align: right; font-weight: 600;">${safeName}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; color: #9ca3af; font-size: 13px;">College</td>
                    <td style="padding: 6px 0; color: #f3f4f6; font-size: 13px; text-align: right;">${safeCollege}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; color: #9ca3af; font-size: 13px;">Branch &amp; Year</td>
                    <td style="padding: 6px 0; color: #f3f4f6; font-size: 13px; text-align: right;">${safeBranch} &middot; ${safeYear}</td>
                  </tr>
                  ${confirmedHtmlRows}
                </table>

                <!-- QR Code Box -->
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #0b0d19; border: 1px solid rgba(168, 85, 247, 0.4); padding: 20px; text-align: center; margin-bottom: 24px;">
                  <tr>
                    <td>
                      <div style="font-size: 11px; letter-spacing: 1.5px; text-transform: uppercase; color: #00e5ff; margin-bottom: 12px; font-weight: 700;">
                        Your Event QR Code
                      </div>
                      <img
                        src="cid:studyjams-qr"
                        alt="Study Jams Registration QR Code"
                        width="200"
                        height="200"
                        style="display: block; margin: 0 auto 12px auto; border: 4px solid #ffffff; border-radius: 2px;"
                      />
                      <div style="font-size: 12px; color: #9ca3af; margin-bottom: 12px;">
                        The QR code PNG is also attached to this email.
                      </div>
                      <a
                        href="${safeUrl}"
                        style="display: inline-block; padding: 10px 18px; background-color: #00e5ff; color: #0b0d19; text-decoration: none; font-size: 12px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase;"
                      >
                        Open QR Verification Link
                      </a>
                    </td>
                  </tr>
                </table>

                <p style="margin: 0; font-size: 12px; line-height: 1.6; color: #9ca3af;">
                  Verification link: <a href="${safeUrl}" style="color: #00e5ff; word-break: break-all;">${safeUrl}</a>
                </p>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="padding: 16px 28px; background-color: #090b14; border-top: 1px solid rgba(255,255,255,0.08); text-align: center; font-size: 11px; color: #6b7280;">
                Google Cloud Study Jams &middot; Hosted by GDG on Campus at IARE
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  const text = [
    `Google Cloud Study Jams — Hosted by GDG on Campus at IARE`,
    ``,
    `Hi ${input.fullName},`,
    ``,
    `Your registration for Google Cloud Study Jams has been recorded!`,
    ``,
    `PLAYER PASS DETAILS`,
    `- Registration ID: #${input.playerCode}`,
    `- Name: ${input.fullName}`,
    `- College: ${input.collegeName}`,
    `- Branch & Year: ${input.branch} · ${input.yearOfStudy}`,
    ...(confirmedTextLines ? [confirmedTextLines] : []),
    ``,
    `QR VERIFICATION LINK`,
    `${input.testingUrl}`,
    ``,
    `Your QR code PNG is attached to this email.`,
    ``,
    `— GDG on Campus at IARE`,
  ].join("\n");

  return { subject, html, text };
}

/**
 * Sends the confirmation email via Resend with the QR PNG attached.
 * Never throws unhandled exceptions or exposes secret keys.
 */
export async function sendRegistrationConfirmationEmail(
  input: SendConfirmationEmailInput,
): Promise<SendConfirmationEmailResult> {
  const apiKey = process.env["RESEND_API_KEY"]?.trim();
  const emailFrom = process.env["EMAIL_FROM"]?.trim();

  if (!apiKey) {
    return {
      sent: false,
      error: "RESEND_API_KEY is not configured on the server.",
    };
  }

  if (!emailFrom) {
    return {
      sent: false,
      error: "EMAIL_FROM is not configured on the server.",
    };
  }

  const { subject, html, text } = buildConfirmationEmailContent(input);
  const resend = new Resend(apiKey);
  const idempotencyKey = `studyjams-reg-${input.registrationId}-attempt-${input.attemptNumber}`;

  try {
    const response = await resend.emails.send(
      {
        from: emailFrom,
        to: [input.email],
        subject,
        html,
        text,
        attachments: [
          {
            filename: `study-jams-qr-${input.playerCode}.png`,
            content: input.qrPngBuffer,
            contentType: "image/png",
            contentId: "studyjams-qr",
          },
        ],
      },
      {
        idempotencyKey,
      },
    );

    if (response.error) {
      return {
        sent: false,
        error: `Resend API error (${response.error.name ?? "unknown"}): ${response.error.message}`,
      };
    }

    if (!response.data?.id) {
      return {
        sent: false,
        error: "Resend did not return a message ID.",
      };
    }

    return {
      sent: true,
      messageId: response.data.id,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown email transport error";
    return {
      sent: false,
      error: `Email delivery exception: ${message}`,
    };
  }
}
