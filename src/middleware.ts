export { default } from "next-auth/middleware";

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - api/auth (auth endpoints including register)
     * - login (auth page)
     * - icon.svg, favicon.ico, public assets
     */
    "/((?!api/auth|login|_next/static|_next/image|favicon.ico|icon.svg).*)",
  ],
};

