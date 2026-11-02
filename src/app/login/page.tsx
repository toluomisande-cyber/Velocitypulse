"use client";

import React, { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { VelocityMark } from "@/components/ui/claude-mark";
import { Lock, Mail, ArrowRight, AlertCircle, Building2, CheckCircle2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      if (isSignUp) {
        const regRes = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, businessName }),
        });

        const regData = await regRes.json();
        if (!regRes.ok) {
          throw new Error(regData.error || "Failed to create account.");
        }

        const signInRes = await signIn("credentials", {
          email,
          password,
          redirect: false,
        });

        if (signInRes?.error) {
          setSuccess("Account created successfully. Please sign in with your credentials.");
          setIsSignUp(false);
        } else {
          router.push("/");
          router.refresh();
        }
      } else {
        const res = await signIn("credentials", {
          email,
          password,
          redirect: false,
        });

        if (res?.error) {
          setError(res.error);
        } else {
          router.push("/");
          router.refresh();
        }
      }
    } catch (err: unknown) {
      setError((err as Error)?.message || "An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-[#f7f5f0] p-4 text-[#191816] font-sans">
      <div className="w-full max-w-sm space-y-6">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center space-y-2.5">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white border border-[#e5e1d8] shadow-xs">
            <VelocityMark className="h-6 w-6 text-[#c26a50]" />
          </div>
          <div>
            <h1 className="font-serif text-2xl font-normal tracking-tight text-[#191816]">VelocityPulse</h1>
            <p className="text-xs text-[#7b7266] mt-0.5">
              Sales velocity and revenue analytics
            </p>
          </div>
        </div>

        {/* Auth Card */}
        <Card className="rounded-xl border border-[#e5e1d8] bg-white shadow-sm p-6">
          <CardHeader className="p-0 pb-4 space-y-1">
            <div className="flex items-center justify-between">
              <CardTitle className="font-serif text-xl font-normal text-[#191816]">
                {isSignUp ? "Create account" : "Sign in"}
              </CardTitle>
              <span className="text-[10px] font-mono text-[#7b7266] bg-[#f0ede6] px-1.5 py-0.5 rounded">
                Multi-tenant
              </span>
            </div>
            <CardDescription className="text-xs text-[#7b7266]">
              {isSignUp
                ? "Start your isolated analytics workspace"
                : "Access your weekly velocity and sales ledger"}
            </CardDescription>
          </CardHeader>

          <CardContent className="p-0 space-y-3.5">
            {error && (
              <div className="flex items-center gap-2 rounded-md border border-[#dc2626]/20 bg-[#dc2626]/5 p-2.5 text-xs text-[#dc2626]">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="flex items-center gap-2 rounded-md border border-[#16a34a]/20 bg-[#16a34a]/5 p-2.5 text-xs text-[#16a34a]">
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                <span>{success}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
              {isSignUp && (
                <div>
                  <label className="block text-xs font-medium text-[#5e554a] mb-1">
                    Company name
                  </label>
                  <div className="relative">
                    <Building2 className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-[#7b7266]" />
                    <Input
                      type="text"
                      required
                      placeholder="Acme Analytics Inc."
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      className="h-8 pl-8 text-xs border-[#e5e1d8] bg-[#faf9f5]"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-[#5e554a] mb-1">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-[#7b7266]" />
                  <Input
                    type="email"
                    required
                    placeholder="executive@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-8 pl-8 text-xs border-[#e5e1d8] bg-[#faf9f5]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#5e554a] mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-[#7b7266]" />
                  <Input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-8 pl-8 text-xs border-[#e5e1d8] bg-[#faf9f5]"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-8 text-xs font-medium bg-[#c26a50] hover:bg-[#a85840] text-white mt-2"
              >
                {loading ? (
                  "Processing…"
                ) : (
                  <>
                    <span>{isSignUp ? "Register workspace" : "Sign in"}</span>
                    <ArrowRight className="h-3.5 w-3.5 ml-1" />
                  </>
                )}
              </Button>
            </form>

            <div className="pt-2 text-center border-t border-[#f0ede6]">
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setError(null);
                  setSuccess(null);
                }}
                className="text-xs text-[#7b7266] hover:text-[#191816] transition-colors"
              >
                {isSignUp ? (
                  <>Already have an account? <span className="text-[#c26a50] font-medium">Sign in</span></>
                ) : (
                  <>Need a new workspace? <span className="text-[#c26a50] font-medium">Create account</span></>
                )}
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Footer info */}
        <p className="text-center text-[11px] font-mono text-[#7b7266]">
          Postgres tenant isolation active
        </p>
      </div>
    </div>
  );
}
