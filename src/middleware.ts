import { NextRequest, NextResponse } from "next/server";

const SESSION_COOKIE = "ax_sid";

/**
 * Sets an anonymous analytics session cookie (random id, no personal data).
 * Auth-protected areas (/admin, /panel) do their role checks server-side in
 * their layouts – middleware only handles the lightweight cookie.
 */
export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  if (!request.cookies.get(SESSION_COOKIE)) {
    response.cookies.set(SESSION_COOKIE, crypto.randomUUID(), {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
    });
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|svg|ico|webp)).*)"],
};
