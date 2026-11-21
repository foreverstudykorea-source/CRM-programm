import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { proxy } from "@/proxy";

const req = (method: string, headers: Record<string, string>) =>
  new NextRequest("https://crm.example.uz/admin", { method, headers: { host: "crm.example.uz", ...headers } });

describe("proxy", () => {
  it("blocks cross-site form posts (CSRF)", () => {
    expect(proxy(req("POST", { origin: "https://evil.example" })).status).toBe(403);
    expect(proxy(req("POST", {})).status).toBe(403);
    expect(proxy(req("POST", { origin: "https://crm.example.uz", "sec-fetch-site": "cross-site" })).status).toBe(403);
  });

  it("lets same-origin posts through", () => {
    expect(proxy(req("POST", { origin: "https://crm.example.uz", "sec-fetch-site": "same-origin" })).status).toBe(200);
  });

  it("sets a strict CSP with a fresh nonce", () => {
    const a = proxy(req("GET", {})).headers.get("content-security-policy")!;
    const b = proxy(req("GET", {})).headers.get("content-security-policy")!;
    expect(a).toMatch(/script-src 'self' 'nonce-[^']+' 'strict-dynamic'/);
    expect(a).toContain("frame-ancestors 'none'");
    expect(a).toContain("object-src 'none'");
    expect(a).not.toBe(b);
  });
});
