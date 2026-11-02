"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CATEGORIES } from "@/lib/mock-data";
import { X, Plus, AlertCircle } from "lucide-react";
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
        className="fixed inset-0 bg-[#191816]/40 backdrop-blur-sm transition-opacity"
      />

      {/* Modal Dialog Card */}
      <div className="relative z-10 w-full max-w-lg rounded-xl border border-[#e5e1d8] bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between border-b border-[#f0ede6] pb-3.5 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#faf9f5] border border-[#e5e1d8]">
              <ClaudeMark className="h-4 w-4 text-[#c26a50]" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-normal text-[#191816]">Record sale</h3>
              <p className="text-[11px] text-[#7b7266]">
                Add an individual transaction to your live database
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-[#7b7266] hover:bg-[#faf9f5] hover:text-[#191816] transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-md bg-[#dc2626]/5 border border-[#dc2626]/10 p-2.5 text-xs text-[#dc2626]">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-[#5e554a] mb-1">
                Amount (USD) <span className="text-[#c26a50]">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-2.5 top-2 font-mono text-[#7b7266]">$</span>
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  placeholder="2400.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="h-8 pl-6 font-mono text-xs border-[#e5e1d8] bg-[#faf9f5]"
                />
              </div>
            </div>

            <div>
              <label className="block font-medium text-[#5e554a] mb-1">
                Category <span className="text-[#c26a50]">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="h-8 w-full rounded-md border border-[#e5e1d8] bg-[#faf9f5] px-2 text-xs text-[#191816] focus:outline-none focus:border-[#c26a50]"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-[#5e554a] mb-1">
                Customer Name
              </label>
              <Input
                type="text"
                placeholder="Acme Corp"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="h-8 text-xs border-[#e5e1d8] bg-[#faf9f5]"
              />
            </div>

            <div>
              <label className="block font-medium text-[#5e554a] mb-1">
                Order Reference
              </label>
              <Input
                type="text"
                placeholder="INV-2026-001"
                value={orderRef}
                onChange={(e) => setOrderRef(e.target.value)}
                className="h-8 font-mono text-xs border-[#e5e1d8] bg-[#faf9f5]"
              />
            </div>
          </div>

          <div>
            <label className="block font-medium text-[#5e554a] mb-1">
              Transaction Date & Time
            </label>
            <Input
              type="datetime-local"
              value={soldAt}
              onChange={(e) => setSoldAt(e.target.value)}
              className="h-8 text-xs font-mono text-[#5e554a] border-[#e5e1d8] bg-[#faf9f5]"
            />
          </div>

          <div>
            <label className="block font-medium text-[#5e554a] mb-1">
              Notes (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="Contract notes, billing cycle, or plan details…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-md border border-[#e5e1d8] bg-[#faf9f5] p-2 text-xs text-[#191816] focus:outline-none focus:border-[#c26a50]"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#f0ede6]">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isSubmitting}
              className="h-8 text-xs border-[#e5e1d8] bg-white text-[#5e554a]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting}
              className="h-8 text-xs font-medium bg-[#c26a50] hover:bg-[#a85840] text-white"
            >
              {isSubmitting ? "Recording…" : "Record transaction"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
