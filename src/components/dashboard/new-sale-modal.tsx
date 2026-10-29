"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CATEGORIES } from "@/lib/mock-data";
import { X, PlusCircle, AlertCircle } from "lucide-react";
import { ClaudeMark } from "@/components/ui/claude-mark";

interface NewSaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function NewSaleModal({ isOpen, onClose, onSuccess }: NewSaleModalProps) {
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<string>(CATEGORIES[0]);
  const [customerName, setCustomerName] = useState("");
  const [orderRef, setOrderRef] = useState("");
  const [soldAt, setSoldAt] = useState(() => {
    const now = new Date();
    return now.toISOString().slice(0, 16);
  });
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError("Please enter a valid positive dollar amount.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: parsedAmount,
          category,
          customerName: customerName || "Direct Client",
          orderRef: orderRef || `ORD-${Date.now().toString().slice(-6)}`,
          soldAt: new Date(soldAt).toISOString(),
          notes: notes || undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to log sale.");
      }

      setAmount("");
      setCustomerName("");
      setOrderRef("");
      setNotes("");
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred while logging the sale.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-ink/40 backdrop-blur-sm transition-opacity"
      />

      {/* Modal Dialog Card */}
      <div className="relative z-10 w-full max-w-lg rounded-lg border border-hairline bg-canvas p-7 shadow-card">
        <div className="flex items-center justify-between border-b border-hairline pb-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-surface-card border border-hairline text-primary">
              <ClaudeMark className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-serif text-xl font-normal text-ink">Log Transaction</h3>
              <p className="text-xs text-muted">
                Injects directly into weekly sales velocity calculation
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-muted hover:bg-surface-soft hover:text-ink transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-md border border-rose-200 bg-rose-50 p-3 text-xs text-error">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Amount */}
            <div>
              <label className="block text-body font-medium mb-1.5">
                Amount (USD) <span className="text-primary">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-muted">$</span>
                <Input
                  type="number"
                  step="0.01"
                  required
                  placeholder="2450.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="pl-7 font-mono text-ink"
                />
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="block text-body font-medium mb-1.5">
                Product Category <span className="text-primary">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="h-10 w-full rounded-md border border-hairline bg-canvas px-3 text-xs text-ink focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Customer / Client Name */}
            <div>
              <label className="block text-body font-medium mb-1.5">
                Customer Name / Account
              </label>
              <Input
                placeholder="e.g. Stripe Labs"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
              />
            </div>

            {/* Order Ref / ID */}
            <div>
              <label className="block text-body font-medium mb-1.5">
                Order / Invoice Reference
              </label>
              <Input
                placeholder="e.g. ORD-9842"
                value={orderRef}
                onChange={(e) => setOrderRef(e.target.value)}
                className="font-mono"
              />
            </div>
          </div>

          {/* Date & Time */}
          <div>
            <label className="block text-body font-medium mb-1.5">
              Transaction Date & Time
            </label>
            <Input
              type="datetime-local"
              value={soldAt}
              onChange={(e) => setSoldAt(e.target.value)}
              className="text-body"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-body font-medium mb-1.5">
              Internal Notes (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Q4 expansion upsell, closed via enterprise pipeline"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-md border border-hairline bg-canvas p-3 text-xs text-ink focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-hairline">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-primary hover:bg-primary-active text-on-primary font-medium"
            >
              {isSubmitting ? "Recording..." : "Record Transaction"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
