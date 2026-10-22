import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { auth } from "@googleapis/gmail";
import { resolveAppBaseUrl } from "./qr.server";

export const GMAIL_SEND_SCOPE = "https://www.googleapis.com/auth/gmail.send";
export const OAUTH_STATE_COOKIE_NAME = "studyjams_gmail_oauth_state";
const OAUTH_STATE_TTL_SECONDS = 600; // 10 minutes
const LOCAL_TOKEN_FILE = ".env.oauth.local";

export function ensureEnvLoaded(): void {
  if (
    typeof window !== "undefined" ||
    typeof process === "undefined" ||
    typeof process.cwd !== "function"
  ) {
    return;
  }

  const isProdOrVercelOrTest =
    process.env["NODE_ENV"] === "production" ||
    process.env["NODE_ENV"] === "test" ||
    Boolean(process.env["VITEST"]) ||
    Boolean(process.env["VERCEL"]);

  if (!isProdOrVercelOrTest) {
    // In local development, re-read .env and .env.oauth.local so edits take effect without restarting Vite
    for (const filename of [".env", LOCAL_TOKEN_FILE]) {
      try {
        const envPath = path.resolve(process.cwd(), filename);
        if (!fs.existsSync(envPath)) continue;
        const raw = fs.readFileSync(envPath, "utf8");
        for (const line of raw.split(/\r?\n/)) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith("#")) continue;
          const eqIdx = trimmed.indexOf("=");
          if (eqIdx === -1) continue;
          const key = trimmed.slice(0, eqIdx).trim();
          const val = trimmed
            .slice(eqIdx + 1)
            .trim()
            .replace(/^["']|["']$/g, "")
            .trim();
          if (key && val) {
            process.env[key] = val;
          }
        }
      } catch {
        // Ignore file read errors
      }
    }
    return;
  }

  if (
    !process.env["GOOGLE_CLIENT_ID"] &&
    typeof process.loadEnvFile === "function"
  ) {
    try {
      process.loadEnvFile();
    } catch {
      // Ignore when .env is absent in serverless production
    }
  }
}

/**
 * Resolves the exact Google OAuth redirect URI.
 * Priority:
 * 1. GOOGLE_REDIRECT_URI environment variable
 * 2. `${resolveAppBaseUrl()}/api/auth/google/callback`
 */
export function resolveGoogleRedirectUri(): string {
  ensureEnvLoaded();
  const explicit = process.env["GOOGLE_REDIRECT_URI"]?.trim();
  if (explicit) {
    return explicit;
  }
  return `${resolveAppBaseUrl()}/api/auth/google/callback`;
}

/**
 * Generates a cryptographically random 256-bit base64url OAuth state token.
 */
export function generateOAuthState(): string {
  return crypto.randomBytes(32).toString("base64url");
}

/**
 * Parses cookies from a raw Cookie request header.
 */
export function parseCookies(cookieHeader: string | null | undefined): Record<string, string> {
  if (!cookieHeader) return {};
  const result: Record<string, string> = {};
  for (const part of cookieHeader.split(";")) {
    const eqIdx = part.indexOf("=");
    if (eqIdx === -1) continue;
    const key = part.slice(0, eqIdx).trim();
    const val = part.slice(eqIdx + 1).trim();
    if (key) {
      try {
        result[key] = decodeURIComponent(val);
      } catch {
        result[key] = val;
      }
    }
  }
  return result;
}

/**
 * Constant-time validation of OAuth state parameter against the HTTP-only state cookie.
 */
export function validateOAuthState(
  queryState: string | null | undefined,
  cookieHeader: string | null | undefined,
): boolean {
  if (!queryState || typeof queryState !== "string") return false;
  const trimmedQuery = queryState.trim();
  if (trimmedQuery.length < 16 || trimmedQuery.length > 128) return false;

  const cookies = parseCookies(cookieHeader);
  const cookieState = cookies[OAUTH_STATE_COOKIE_NAME]?.trim();
  if (!cookieState) return false;

  const queryBuf = Buffer.from(trimmedQuery, "utf8");
  const cookieBuf = Buffer.from(cookieState, "utf8");
  if (queryBuf.byteLength !== cookieBuf.byteLength) return false;

  return crypto.timingSafeEqual(queryBuf, cookieBuf);
}

function buildStateCookie(state: string, isSecure: boolean, maxAgeSeconds: number): string {
  const parts = [
    `${OAUTH_STATE_COOKIE_NAME}=${encodeURIComponent(state)}`,
    "HttpOnly",
    "SameSite=Lax",
    "Path=/api/auth/google",
    `Max-Age=${maxAgeSeconds}`,
  ];
  if (isSecure) {
    parts.push("Secure");
  }
  return parts.join("; ");
}

function isSecureRequest(request: Request): boolean {
  try {
    const url = new URL(request.url);
    if (url.protocol === "https:") return true;
  } catch {
    // ignore
  }
  const proto = request.headers.get("x-forwarded-proto");
  if (proto && proto.split(",")[0]?.trim().toLowerCase() === "https") {
    return true;
  }
  return process.env["NODE_ENV"] === "production";
}

function createOAuthClient() {
  ensureEnvLoaded();
  const clientId = process.env["GOOGLE_CLIENT_ID"]?.trim();
  const clientSecret = process.env["GOOGLE_CLIENT_SECRET"]?.trim();
  const redirectUri = resolveGoogleRedirectUri();

  if (!clientId || !clientSecret) {
    return null;
  }

  return new auth.OAuth2(clientId, clientSecret, redirectUri);
}

/**
 * GET /api/auth/google
 * Initiates the one-time OAuth 2.0 authorization flow for the Gmail send scope.
 */
export async function handleGoogleOAuthStart(request: Request): Promise<Response> {
  if (request.method !== "GET") {
    return Response.json(
      { ok: false, code: "METHOD_NOT_ALLOWED", message: "Method not allowed. Use GET." },
      { status: 405, headers: { Allow: "GET" } },
    );
  }

  const oauth2Client = createOAuthClient();
  if (!oauth2Client) {
    return Response.json(
      {
        ok: false,
        code: "OAUTH_NOT_CONFIGURED",
        message:
          "Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET environment variables.",
      },
      { status: 500 },
    );
  }

  const state = generateOAuthState();
  const secure = isSecureRequest(request);
  const redirectUri = resolveGoogleRedirectUri();

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: [GMAIL_SEND_SCOPE],
    state,
    redirect_uri: redirectUri,
    include_granted_scopes: false,
  });

  return new Response(null, {
    status: 302,
    headers: {
      Location: authUrl,
      "Set-Cookie": buildStateCookie(state, secure, OAUTH_STATE_TTL_SECONDS),
      "Cache-Control": "no-store, no-cache, must-revalidate",
    },
  });
}

export interface TokenExchangeHandler {
  getToken: (code: string) => Promise<{
    tokens: {
      refresh_token?: string | null;
      access_token?: string | null;
      scope?: string;
    };
  }>;
}

/**
 * Persists the refresh token to a gitignored local file (.env.oauth.local) ONLY in local development.
 * Never logs or displays the token in the browser or writes to tracked source files.
 */
function persistRefreshTokenLocallyIfDev(refreshToken: string): boolean {
  const isProdOrVercel =
    process.env["NODE_ENV"] === "production" || Boolean(process.env["VERCEL"]);
  if (isProdOrVercel) {
    return false;
  }

  try {
    const filePath = path.resolve(process.cwd(), LOCAL_TOKEN_FILE);
    const content = [
      "# Temporary local OAuth output (gitignored via *.local and .env.*).",
      "# Copy GMAIL_REFRESH_TOKEN into your .env and Vercel Environment Variables, then delete this file.",
      `GMAIL_REFRESH_TOKEN="${refreshToken}"`,
      "",
    ].join("\n");
    fs.writeFileSync(filePath, content, { encoding: "utf8", mode: 0o600 });
    return true;
  } catch {
    return false;
  }
}

/**
 * GET /api/auth/google/callback
 * Validates CSRF state, exchanges authorization code, and stores refresh token locally (in dev)
 * without logging or exposing any credentials in the HTTP response.
 */
export async function handleGoogleOAuthCallback(
  request: Request,
  customOAuthClient?: TokenExchangeHandler | null,
): Promise<Response> {
  if (request.method !== "GET") {
    return Response.json(
      { ok: false, code: "METHOD_NOT_ALLOWED", message: "Method not allowed. Use GET." },
      { status: 405, headers: { Allow: "GET" } },
    );
  }

  const secure = isSecureRequest(request);
  const clearCookieHeader = buildStateCookie("", secure, 0);
  const responseHeaders = {
    "Set-Cookie": clearCookieHeader,
    "Cache-Control": "no-store, no-cache, must-revalidate",
    "Content-Type": "text/html; charset=utf-8",
  };

  const url = new URL(request.url);
  const oauthError = url.searchParams.get("error");
  if (oauthError) {
    return new Response(
      renderOAuthResultHtml(
        false,
        "Google OAuth authorization was denied or cancelled.",
      ),
      { status: 400, headers: responseHeaders },
    );
  }

  const queryState = url.searchParams.get("state");
  const cookieHeader = request.headers.get("cookie");
  if (!validateOAuthState(queryState, cookieHeader)) {
    return new Response(
      renderOAuthResultHtml(
        false,
        "Invalid or expired OAuth state parameter (CSRF check failed). Please start again from /api/auth/google.",
      ),
      { status: 400, headers: responseHeaders },
    );
  }

  const code = url.searchParams.get("code")?.trim();
  if (!code) {
    return new Response(
      renderOAuthResultHtml(
        false,
        "Missing authorization code from Google OAuth callback.",
      ),
      { status: 400, headers: responseHeaders },
    );
  }

  const oauth2Client = customOAuthClient !== undefined ? customOAuthClient : createOAuthClient();
  if (!oauth2Client) {
    return new Response(
      renderOAuthResultHtml(
        false,
        "Server OAuth configuration is incomplete (missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET).",
      ),
      { status: 500, headers: responseHeaders },
    );
  }

  try {
    const { tokens } = await oauth2Client.getToken(code);

    if (!tokens.refresh_token) {
      return new Response(
        renderOAuthResultHtml(
          false,
          "Google did not return a refresh token. Revoke previous app access at myaccount.google.com/permissions and retry /api/auth/google.",
        ),
        { status: 400, headers: responseHeaders },
      );
    }

    const savedLocally = persistRefreshTokenLocallyIfDev(tokens.refresh_token);
    const detailMessage = savedLocally
      ? "Refresh token obtained and written to gitignored .env.oauth.local in your project root. Copy GMAIL_REFRESH_TOKEN into your .env and Vercel Environment Variables, then delete .env.oauth.local."
      : "Refresh token obtained. Note: file writing is disabled in production/Vercel; run the one-time OAuth flow locally to save .env.oauth.local and copy GMAIL_REFRESH_TOKEN to Vercel.";

    return new Response(renderOAuthResultHtml(true, detailMessage), {
      status: 200,
      headers: responseHeaders,
    });
  } catch {
    return new Response(
      renderOAuthResultHtml(
        false,
        "Failed to exchange authorization code with Google OAuth. Verify GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REDIRECT_URI.",
      ),
      { status: 502, headers: responseHeaders },
    );
  }
}

function renderOAuthResultHtml(success: boolean, message: string): string {
  const safeMessage = message
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
  const statusTitle = success ? "GMAIL OAUTH CONNECTED" : "GMAIL OAUTH ERROR";
  const accentColor = success ? "#00e5ff" : "#ff2a85";

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${statusTitle} · Cloud Quest</title>
  </head>
  <body style="margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#0b0d19;color:#f3f4f6;font-family:system-ui,-apple-system,sans-serif;padding:24px;">
    <main style="max-width:520px;width:100%;background:#13172b;border:1px solid ${accentColor};padding:28px;text-align:center;">
      <div style="font-size:12px;letter-spacing:2px;text-transform:uppercase;color:${accentColor};font-weight:700;">
        ${statusTitle}
      </div>
      <p style="margin:16px 0 0 0;font-size:14px;line-height:1.6;color:#d1d5db;">
        ${safeMessage}
      </p>
    </main>
  </body>
</html>`;
}
