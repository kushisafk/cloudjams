import { auth, gmail } from "@googleapis/gmail";
import { EVENT } from "@/config/event";
import { ensureEnvLoaded, resolveGoogleRedirectUri } from "./gmail-oauth.server";

export interface SendConfirmationEmailInput {
  registrationId: string;
  playerCode: string;
  fullName: string;
  rollNumber: string;
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

export interface GmailMessageSendClient {
  users: {
    messages: {
      send: (params: {
        userId: string;
        requestBody: {
          raw: string;
        };
      }) => Promise<{
        data?: {
          id?: string | null;
        };
      }>;
    };
  };
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

/**
 * Encodes a string or Buffer in RFC 4648 base64url format (no +, /, or = padding)
 * as required by the Gmail API `users.messages.send` raw field.
 */
export function encodeBase64Url(input: Buffer | string): string {
  const buf = typeof input === "string" ? Buffer.from(input, "utf8") : input;
  return buf
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

/**
 * Formats a Buffer or UTF-8 string as 76-character wrapped base64 for MIME bodies.
 */
function toMimeBase64Block(input: Buffer | string): string {
  const buf = typeof input === "string" ? Buffer.from(input, "utf8") : input;
  const b64 = buf.toString("base64");
  return b64.replace(/(.{76})/g, "$1\r\n").trim();
}

/**
 * Encodes a UTF-8 header value using RFC 2047 Base64 encoded-word syntax when non-ASCII chars exist.
 */
function encodeMimeHeaderText(value: string): string {
  const sanitized = value.replace(/[\r\n]+/g, " ").trim();
  if (/^[\x20-\x7E]*$/.test(sanitized)) {
    return sanitized;
  }
  return `=?UTF-8?B?${Buffer.from(sanitized, "utf8").toString("base64")}?=`;
}

/**
 * Formats the From header using GMAIL_SENDER_EMAIL and optional GMAIL_SENDER_NAME.
 * Supports either:
 * - Plain email ("organizer@gmail.com") -> defaults to "(FAKE) GDG on Campus at IARE <organizer@gmail.com>"
 * - Formatted email ("Custom Name <organizer@gmail.com>")
 * - Custom GMAIL_SENDER_NAME env variable
 */
function formatFromHeader(senderEmail: string): string {
  const cleaned = senderEmail.replace(/[\r\n]+/g, " ").trim();
  if (cleaned.includes("<") && cleaned.includes(">")) {
    return cleaned;
  }
  const customName = process.env["GMAIL_SENDER_NAME"]?.trim() || "(FAKE) GDG on Campus at IARE";
  return `"${customName.replace(/"/g, "")}" <${cleaned}>`;
}

export function buildConfirmationEmailContent(input: SendConfirmationEmailInput): {
  subject: string;
  html: string;
  text: string;
} {
  const safeName = escapeHtml(input.fullName);
  const safeRollNumber = escapeHtml(input.rollNumber);
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
                    <td style="padding: 6px 0; color: #9ca3af; font-size: 13px;">Roll Number</td>
                    <td style="padding: 6px 0; color: #00e5ff; font-size: 13px; text-align: right; font-family: monospace; font-weight: 600;">${safeRollNumber}</td>
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
    `- Roll Number: ${input.rollNumber}`,
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
 * Builds a complete RFC 2822 / MIME message containing:
 * - multipart/mixed (outer container)
 *   - multipart/related (HTML + inline QR image with Content-ID: <studyjams-qr>)
 *     - multipart/alternative (plain-text fallback + HTML body)
 *     - image/png inline part (cid:studyjams-qr)
 *   - image/png downloadable attachment (study-jams-qr-${playerCode}.png)
 * And encodes the entire message in base64url format for Gmail API.
 */
export function buildRawMimeMessage(
  input: SendConfirmationEmailInput & { fromEmail: string },
): {
  rawMime: string;
  encodedMessage: string;
  attachmentFilename: string;
} {
  const { subject, html, text } = buildConfirmationEmailContent(input);
  const safeIdToken = input.registrationId.replace(/[^A-Za-z0-9]/g, "") || "studyjams";
  const mixedBoundary = `mixed_${safeIdToken}_${input.attemptNumber}`;
  const relatedBoundary = `related_${safeIdToken}_${input.attemptNumber}`;
  const altBoundary = `alt_${safeIdToken}_${input.attemptNumber}`;

  const attachmentFilename = `study-jams-qr-${input.playerCode.replace(/[^A-Za-z0-9_-]/g, "")}.png`;
  const qrBase64Block = toMimeBase64Block(input.qrPngBuffer);
  const textBase64Block = toMimeBase64Block(text);
  const htmlBase64Block = toMimeBase64Block(html);

  const recipientEmail = input.email.replace(/[\r\n]+/g, "").trim();
  const currentDate = new Date().toUTCString();
  const messageIdHeader = `<studyjams.${safeIdToken}.${Date.now()}@gmail.com>`;

  const lines: string[] = [
    `From: ${formatFromHeader(input.fromEmail)}`,
    `To: ${recipientEmail}`,
    `Subject: ${encodeMimeHeaderText(subject)}`,
    `Date: ${currentDate}`,
    `Message-ID: ${messageIdHeader}`,
    `Auto-Submitted: auto-generated`,
    `X-Auto-Response-Suppress: All`,
    `MIME-Version: 1.0`,
    `Content-Type: multipart/mixed; boundary="${mixedBoundary}"`,
    ``,
    `--${mixedBoundary}`,
    `Content-Type: multipart/related; type="multipart/alternative"; boundary="${relatedBoundary}"`,
    ``,
    `--${relatedBoundary}`,
    `Content-Type: multipart/alternative; boundary="${altBoundary}"`,
    ``,
    `--${altBoundary}`,
    `Content-Type: text/plain; charset="UTF-8"`,
    `Content-Transfer-Encoding: base64`,
    ``,
    textBase64Block,
    ``,
    `--${altBoundary}`,
    `Content-Type: text/html; charset="UTF-8"`,
    `Content-Transfer-Encoding: base64`,
    ``,
    htmlBase64Block,
    ``,
    `--${altBoundary}--`,
    ``,
    `--${relatedBoundary}`,
    `Content-Type: image/png; name="${attachmentFilename}"`,
    `Content-Transfer-Encoding: base64`,
    `Content-ID: <studyjams-qr>`,
    `Content-Disposition: inline; filename="${attachmentFilename}"`,
    ``,
    qrBase64Block,
    ``,
    `--${relatedBoundary}--`,
    ``,
    `--${mixedBoundary}`,
    `Content-Type: image/png; name="${attachmentFilename}"`,
    `Content-Transfer-Encoding: base64`,
    `Content-Disposition: attachment; filename="${attachmentFilename}"`,
    ``,
    qrBase64Block,
    ``,
    `--${mixedBoundary}--`,
    ``,
  ];

  const rawMime = lines.join("\r\n");
  const encodedMessage = encodeBase64Url(rawMime);

  return {
    rawMime,
    encodedMessage,
    attachmentFilename,
  };
}

/**
 * Sanitizes errors thrown by googleapis / OAuth2 so secrets, tokens, or raw MIME payloads
 * are never exposed in logs or database error columns.
 */
export function sanitizeGmailError(err: unknown): string {
  if (!err) {
    return "Unknown Gmail delivery failure.";
  }

  const anyErr = err as {
    code?: number | string;
    status?: number;
    message?: string;
    response?: {
      status?: number;
      data?: {
        error?:
          | string
          | {
              code?: number;
              message?: string;
              status?: string;
              errors?: Array<{ reason?: string; message?: string }>;
            };
        error_description?: string;
      };
    };
  };

  const httpStatus =
    typeof anyErr.status === "number"
      ? anyErr.status
      : typeof anyErr.response?.status === "number"
        ? anyErr.response.status
        : typeof anyErr.code === "number"
          ? anyErr.code
          : undefined;

  const rawDataError = anyErr.response?.data?.error;
  const oauthErrorCode = typeof rawDataError === "string" ? rawDataError : undefined;
  const apiReasons =
    typeof rawDataError === "object" && rawDataError !== null && Array.isArray(rawDataError.errors)
      ? rawDataError.errors.map((e) => e.reason || "").filter(Boolean)
      : [];

  const combinedText = [
    anyErr.message ?? "",
    oauthErrorCode ?? "",
    anyErr.response?.data?.error_description ?? "",
    typeof rawDataError === "object" && rawDataError !== null ? (rawDataError.message ?? "") : "",
    ...apiReasons,
  ]
    .join(" ")
    .toLowerCase();

  if (
    oauthErrorCode === "invalid_grant" ||
    combinedText.includes("invalid_grant") ||
    combinedText.includes("token has been expired or revoked")
  ) {
    return "Gmail OAuth refresh token is expired or revoked (invalid_grant). Please re-authorize Gmail OAuth.";
  }

  if (
    oauthErrorCode === "invalid_client" ||
    oauthErrorCode === "unauthorized_client" ||
    combinedText.includes("invalid_client") ||
    combinedText.includes("unauthorized_client") ||
    httpStatus === 401
  ) {
    return "Gmail authentication failed: invalid OAuth client credentials or unauthorized token.";
  }

  if (
    httpStatus === 429 ||
    combinedText.includes("ratelimitexceeded") ||
    combinedText.includes("userratelimitexceeded") ||
    combinedText.includes("quotaexceeded") ||
    combinedText.includes("dailylimitexceeded") ||
    combinedText.includes("quota exceeded") ||
    combinedText.includes("rate limit")
  ) {
    return "Gmail API quota or rate limit exceeded. Please retry after a short wait.";
  }

  if (httpStatus === 403) {
    return "Gmail API access forbidden (HTTP 403): ensure Gmail API is enabled and the gmail.send scope is granted.";
  }

  if (httpStatus) {
    return `Gmail API request failed with HTTP ${httpStatus}.`;
  }

  return "Gmail transport error occurred while sending confirmation email.";
}

function createGmailClientFromEnv(): {
  client?: GmailMessageSendClient;
  senderEmail?: string;
  error?: string;
} {
  ensureEnvLoaded();

  const clientId = process.env["GOOGLE_CLIENT_ID"]?.trim();
  const clientSecret = process.env["GOOGLE_CLIENT_SECRET"]?.trim();
  const refreshToken = process.env["GMAIL_REFRESH_TOKEN"]?.trim();
  const senderEmail = process.env["GMAIL_SENDER_EMAIL"]?.trim();
  const redirectUri = resolveGoogleRedirectUri();

  const missing: string[] = [];
  if (!clientId) missing.push("GOOGLE_CLIENT_ID");
  if (!clientSecret) missing.push("GOOGLE_CLIENT_SECRET");
  if (!refreshToken) missing.push("GMAIL_REFRESH_TOKEN");
  if (!senderEmail) missing.push("GMAIL_SENDER_EMAIL");

  if (!clientId || !clientSecret || !refreshToken || !senderEmail) {
    return {
      error: `Missing required Gmail environment variables: ${missing.join(", ")}.`,
    };
  }

  const oauth2Client = new auth.OAuth2(clientId, clientSecret, redirectUri);
  oauth2Client.setCredentials({ refresh_token: refreshToken });

  const gmailClient = gmail({ version: "v1", auth: oauth2Client });
  return {
    client: gmailClient,
    senderEmail,
  };
}

/**
 * Sends the confirmation email via the official Gmail API (`users.messages.send` with `userId: "me"`),
 * including both the inline QR image (`cid:studyjams-qr`) and downloadable PNG attachment.
 * Never throws unhandled exceptions or logs/exposes secret values.
 */
export async function sendRegistrationConfirmationEmail(
  input: SendConfirmationEmailInput,
  customGmailClient?: { client: GmailMessageSendClient; senderEmail: string },
): Promise<SendConfirmationEmailResult> {
  let gmailClient: GmailMessageSendClient;
  let senderEmail: string;

  if (customGmailClient) {
    gmailClient = customGmailClient.client;
    senderEmail = customGmailClient.senderEmail;
  } else {
    const resolved = createGmailClientFromEnv();
    if (!resolved.client || !resolved.senderEmail) {
      return {
        sent: false,
        error: resolved.error ?? "Gmail API is not configured on the server.",
      };
    }
    gmailClient = resolved.client;
    senderEmail = resolved.senderEmail;
  }

  try {
    const { encodedMessage } = buildRawMimeMessage({
      ...input,
      fromEmail: senderEmail,
    });

    const response = await gmailClient.users.messages.send({
      userId: "me",
      requestBody: {
        raw: encodedMessage,
      },
    });

    const messageId = response?.data?.id?.trim();
    if (!messageId) {
      return {
        sent: false,
        error: "Gmail API did not return a message ID.",
      };
    }

    return {
      sent: true,
      messageId,
    };
  } catch (err) {
    return {
      sent: false,
      error: sanitizeGmailError(err),
    };
  }
}
