import crypto from "node:crypto";
import QRCode from "qrcode";

/**
 * Generates a cryptographically secure, URL-safe random QR token (32 chars, 192 bits of entropy).
 */
export function generateQrToken(): string {
  return crypto.randomBytes(24).toString("base64url");
}

/**
 * Resolves the public application base URL for QR code destinations.
 * Priority:
 * 1. APP_BASE_URL environment variable
 * 2. VERCEL_PROJECT_PRODUCTION_URL (on Vercel production deployments)
 * 3. VERCEL_URL (on Vercel preview deployments)
 * 4. http://localhost:8080 (local development fallback)
 */
export function resolveAppBaseUrl(): string {
  const configured = process.env["APP_BASE_URL"]?.trim();
  if (configured) {
    return configured.replace(/\/+$/, "");
  }

  const vercelProdHost = process.env["VERCEL_PROJECT_PRODUCTION_URL"]?.trim();
  if (vercelProdHost) {
    const withProtocol = vercelProdHost.startsWith("http")
      ? vercelProdHost
      : `https://${vercelProdHost}`;
    return withProtocol.replace(/\/+$/, "");
  }

  const vercelHost = process.env["VERCEL_URL"]?.trim();
  if (vercelHost) {
    const withProtocol = vercelHost.startsWith("http")
      ? vercelHost
      : `https://${vercelHost}`;
    return withProtocol.replace(/\/+$/, "");
  }

  return "http://localhost:8080";
}

/**
 * Builds the testing verification URL encoded inside the participant's QR code.
 */
export function buildTestingUrl(qrToken: string): string {
  const baseUrl = resolveAppBaseUrl();
  return `${baseUrl}/testing?ref=${encodeURIComponent(qrToken)}`;
}

/**
 * Generates a PNG image Buffer in memory for the given QR payload URL.
 * Does not touch the local filesystem (serverless-safe).
 */
export async function generateQrPngBuffer(targetUrl: string): Promise<Buffer> {
  return await QRCode.toBuffer(targetUrl, {
    type: "png",
    width: 360,
    margin: 2,
    errorCorrectionLevel: "M",
    color: {
      dark: "#0B0D19",
      light: "#FFFFFF",
    },
  });
}
