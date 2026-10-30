import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Corporate Credentials",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "executive@company.com" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Please enter both email and password");
        }

        const email = credentials.email.toLowerCase().trim();

        // Verify against real database
        try {
          const user = await prisma.user.findUnique({
            where: { email },
          });

          if (!user || !user.passwordHash) {
            throw new Error("No account found with this email address. Please create an account.");
          }

          const isValid = await bcrypt.compare(credentials.password, user.passwordHash);
          if (!isValid) {
            throw new Error("Invalid password. Please check your credentials.");
          }

          return {
            id: user.id,
            email: user.email,
            name: user.businessName,
          };
        } catch (err: unknown) {
          const msg = (err as Error)?.message;
          if (msg && (msg.includes("No account") || msg.includes("Invalid password") || msg.includes("Please enter"))) {
            throw err;
          }
          console.error("[Auth] Database verification error:", err);
          throw new Error("Authentication service is temporarily unavailable. Please try again.");
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { id?: string; name?: string | null; email?: string | null }).id = token.id as string;
        session.user.name = token.name as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET || "velocitypulse-production-secret-key-32chars",
};
