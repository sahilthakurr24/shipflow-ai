import { NextResponse, type NextRequest } from "next/server";

import { SIGN_IN_PATH } from "./utils/index";

const SESSION_COOKIE = "better-auth.session_token";
const SECURE_SESSION_COOKIE = "__Secure-better-auth.session_token";

export function proxy(request: NextRequest) {
  const hasSession =
    request.cookies.has(SESSION_COOKIE) || request.cookies.has(SECURE_SESSION_COOKIE);

  if (!hasSession) {
    const url = request.nextUrl.clone();
    url.pathname = SIGN_IN_PATH;
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard", "/dashboard/:path*"],
};
