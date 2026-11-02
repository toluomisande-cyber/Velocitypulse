import { withAuth } from "next-auth/middleware";

const NEXTAUTH_SECRET =
  process.env.NEXTAUTH_SECRET || "sales-velocity-dashboard-secret-jwt-key-2026-production";

export default withAuth({
  pages: {
    signIn: "/login",
  },
  secret: NEXTAUTH_SECRET,
});

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - api/auth (auth endpoints including register)
     * - login (auth page)
     * - icon.svg, favicon.ico, public assets
     */
    "/((?!api/auth|login|_next/static|_next/image|favicon.ico|icon.svg|sample_sales_template.csv).*)",
  ],
};
