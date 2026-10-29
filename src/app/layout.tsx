import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";

export const metadata: Metadata = {
  title: "VelocityPulse | Executive Sales & Velocity Intelligence",
  description:
    "Weekly sales velocity, predictive revenue growth modeling, and executive analytics powered by Next.js 15 and Neon Postgres.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-canvas font-sans text-ink selection:bg-primary/20 selection:text-primary-active">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
