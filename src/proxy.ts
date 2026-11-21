import { NextResponse, type NextRequest } from "next/server";

/**
 * Runs before every page and server action:
 * 1. Blocks cross-site form posts (CSRF) by checking Origin and Sec-Fetch-Site.
 * 2. Sets a strict Content-Security-Policy with a fresh nonce per request, so that
 *    injected <script> tags cannot run even if some text ever slipped through unescaped.
 * Other security headers (HSTS, frame blocking, …) are set in next.config.ts.
 */
export function proxy(request: NextRequest) {
  const method = request.method.toUpperCase();
  if (method !== "GET" && method !== "HEAD" && method !== "OPTIONS") {
    const origin = request.headers.get("origin");
    const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
    const site = request.headers.get("sec-fetch-site");
    let sameOrigin = false;
    try {
      sameOrigin = !!origin && !!host && new URL(origin).host === host;
    } catch {
      sameOrigin = false;
    }
    if (!sameOrigin || (site && site !== "same-origin" && site !== "none")) {
      return new NextResponse("Forbidden", { status: 403 });
    }
  }

  const nonce = btoa(crypto.randomUUID());
  const dev = process.env.NODE_ENV === "development";
  const csp = [
    `default-src 'self'`,
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${dev ? " 'unsafe-eval'" : ""}`,
    // Inline style attributes are used for chart bar sizes; styles cannot run code.
    `style-src 'self' 'unsafe-inline'`,
    `img-src 'self' data: blob:`,
    `font-src 'self'`,
    `connect-src 'self'${dev ? " ws:" : ""}`,
    `object-src 'none'`,
    `base-uri 'none'`,
    `form-action 'self'`,
    `frame-ancestors 'none'`,
    `manifest-src 'self'`,
    ...(dev ? [] : ["upgrade-insecure-requests"]),
  ].join("; ");

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);
  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", csp);
  return response;
}

export const config = {
  matcher: [
    {
      source: "/((?!_next/static|_next/image|favicon.ico|icon.svg|robots.txt).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
