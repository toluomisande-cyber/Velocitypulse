"use client";

import React, { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { VelocityMark } from "@/components/ui/claude-mark";
import { Lock, Mail, ArrowRight, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
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
    } catch {
      setError("An unexpected error occurred during sign in.");
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
              Executive Sales & Velocity Intelligence
            </p>
          </div>
        </div>

        {/* Login Card */}
        <Card variant="card" className="border-hairline bg-surface-card shadow-card">
          <CardHeader className="space-y-1.5 pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="font-serif text-2xl font-normal text-ink">Sign In</CardTitle>
              <Badge variant="coral" className="text-[10px]">
                ENTERPRISE
              </Badge>
            </div>
            <CardDescription className="text-xs text-muted">
              Access your executive sales velocity, run rates, and transactional ledgers
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 rounded-md border border-rose-200 bg-rose-50 p-3 text-xs text-error">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
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
                {loading ? "Authenticating..." : "Sign In to Dashboard"}
                <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-[11px] text-muted">
          Enterprise Data Platform · End-to-End Encrypted
        </p>
      </div>
    </div>
  );
}
