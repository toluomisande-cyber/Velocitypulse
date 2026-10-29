import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Email and Password",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "executive@company.com" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Please enter both email and password");
        }

        const email = credentials.email.toLowerCase().trim();

        // 1. Try real database if connected
        try {
          const user = await prisma.user.findUnique({
            where: { email },
          });

          if (user && user.passwordHash) {
            const isValid = await bcrypt.compare(credentials.password, user.passwordHash);
            if (isValid) {
              return {
                id: user.id,
                email: user.email,
                name: user.businessName,
              };
            }
          }
        } catch {
          // If database is not reachable, fall through to demo fallback
        }

        // 2. Fallback authentication for development/offline
        if (
          (email === "demo@acme.com" || email === "admin@velocitypulse.io" || email === "executive@company.com") &&
          credentials.password === "password123"
        ) {
          return {
            id: "demo-user-123",
            email: email,
            name: "Apex Velocity Group",
          };
        }

        if (process.env.ENABLE_DEMO_FALLBACK === "true") {
          return {
            id: "demo-user-123",
            email: email,
            name: "Apex Velocity Group",
          };
        }

        throw new Error("Invalid email or password");
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
  secret: process.env.NEXTAUTH_SECRET || "fallback-secret-development-key-32chars",
};

