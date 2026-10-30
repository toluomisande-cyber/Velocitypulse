"use client";

import React, { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
        // Register new account
        const regRes = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, businessName }),
        });

        const regData = await regRes.json();
        if (!regRes.ok) {
          throw new Error(regData.error || "Failed to create account.");
        }

        // Auto sign-in after successful registration
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
        // Sign in existing user
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
    <div className="flex min-h-screen w-full items-center justify-center bg-canvas p-4 text-ink font-sans">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-surface-card border border-hairline shadow-subtle">
            <VelocityMark className="h-7 w-7 text-primary" />
          </div>
          <div>
            <h1 className="font-serif text-3xl font-normal tracking-tight text-ink">VelocityPulse</h1>
            <p className="text-xs text-muted mt-1 font-sans">
              Executive Sales & Velocity Intelligence Platform
            </p>
          </div>
        </div>

        {/* Auth Card */}
        <Card variant="card" className="border-hairline bg-surface-card shadow-card">
          <CardHeader className="space-y-1.5 pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="font-serif text-2xl font-normal text-ink">
                {isSignUp ? "Create Account" : "Sign In"}
              </CardTitle>
              <Badge variant="coral" className="text-[10px]">
                MULTI-TENANT
              </Badge>
            </div>
            <CardDescription className="text-xs text-muted">
              {isSignUp
                ? "Start your isolated enterprise analytics workspace"
                : "Access your executive sales velocity and real-time ledgers"}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 rounded-md border border-rose-200 bg-rose-50 p-3 text-xs text-error">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                <span>{success}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {isSignUp && (
                <div>
                  <label className="block text-xs font-medium text-body mb-1.5">
                    Organization / Company Name
                  </label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-3 h-4 w-4 text-muted" />
                    <Input
                      type="text"
                      required
                      placeholder="Acme Commerce Inc."
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      className="pl-9.5 text-xs bg-canvas"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-body mb-1.5">
                  Corporate Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted" />
                  <Input
                    type="email"
                    required
                    placeholder="executive@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9.5 text-xs bg-canvas"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-body mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted" />
                  <Input
                    type="password"
                    required
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-9.5 text-xs bg-canvas"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-primary hover:bg-primary-active text-on-primary font-medium text-xs mt-3 h-10 shadow-sm"
              >
                {loading
                  ? isSignUp
                    ? "Creating Account..."
                    : "Authenticating..."
                  : isSignUp
                  ? "Register Organization"
                  : "Sign In to Workspace"}
                <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
              </Button>
            </form>

            {/* Toggle Sign Up / Sign In */}
            <div className="pt-2 text-center border-t border-hairline/80">
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setError(null);
                  setSuccess(null);
                }}
                className="text-xs text-primary hover:underline font-medium"
              >
                {isSignUp
                  ? "Already have an account? Sign In"
                  : "Don't have an account? Create an Account"}
              </button>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-[11px] text-muted">
          Isolated Multi-Tenant Security · End-to-End Encrypted
        </p>
      </div>
    </div>
  );
}
