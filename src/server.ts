import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";
import { processRegistrationSubmission } from "./lib/registration.server";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as ServerEntry,
    );
  }
  return serverEntryPromise;
}

const MAX_REGISTER_BODY_BYTES = 16 * 1024;

function extractClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return `ip:${first}`;
  }
  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) return `ip:${realIp}`;
  return "ip:unknown";
}

async function handleRegisterApiRequest(request: Request): Promise<Response> {
  if (request.method !== "POST") {
    return Response.json(
      { ok: false, code: "METHOD_NOT_ALLOWED", message: "Method not allowed. Use POST." },
      { status: 405, headers: { Allow: "POST" } },
    );
  }

  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (contentLength > MAX_REGISTER_BODY_BYTES) {
    return Response.json(
      { ok: false, code: "PAYLOAD_TOO_LARGE", message: "Request payload is too large." },
      { status: 413 },
    );
  }

  let rawBodyText: string;
  try {
    rawBodyText = await request.text();
  } catch {
    return Response.json(
      { ok: false, code: "BAD_REQUEST", message: "Unable to read request body." },
      { status: 400 },
    );
  }

  if (Buffer.byteLength(rawBodyText, "utf8") > MAX_REGISTER_BODY_BYTES) {
    return Response.json(
      { ok: false, code: "PAYLOAD_TOO_LARGE", message: "Request payload is too large." },
      { status: 413 },
    );
  }

  let parsedBody: unknown;
  try {
    parsedBody = JSON.parse(rawBodyText);
  } catch {
    return Response.json(
      { ok: false, code: "INVALID_JSON", message: "Request body must be valid JSON." },
      { status: 400 },
    );
  }

  const clientKey = extractClientIp(request);
  const outcome = await processRegistrationSubmission(parsedBody, clientKey);

  return Response.json(outcome, { status: outcome.statusCode });
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!isH3SwallowedErrorBody(body)) return response;

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function isH3SwallowedErrorBody(body: string): boolean {
  try {
    const payload = JSON.parse(body) as { unhandled?: unknown; message?: unknown };
    return payload.unhandled === true && payload.message === "HTTPError";
  } catch {
    return false;
  }
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    try {
      const url = new URL(request.url);
      if (url.pathname === "/api/register") {
        return await handleRegisterApiRequest(request);
      }

      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      return await normalizeCatastrophicSsrResponse(response);
    } catch (error) {
      console.error(error);
      return new Response(renderErrorPage(), {
        status: 500,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
  },
};
