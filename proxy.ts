import { NextRequest, NextResponse } from "next/server";
import { getSecurityHeaders } from "./scripts/security-headers.mjs";

export function proxy(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const rules = getSecurityHeaders({ nonce });
  const csp = rules[0].headers.find(({ key }) => key.toLowerCase() === "content-security-policy")?.value;

  // Fail closed if configuration ever stops producing the request-bound policy.
  if (!csp) {
    return new NextResponse("Security policy unavailable.", { status: 500 });
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", csp);
  return response;
}

export const config = {
  matcher: [
    "/((?!api/|api$|_next/static/|_next/static$|_next/image/|_next/image$|favicon\\.ico$|robots\\.txt$|sitemap\\.xml$).*)"
  ]
};
