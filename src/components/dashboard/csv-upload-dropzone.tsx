"use client";

import React, { useState, useRef } from "react";
import Papa from "papaparse";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { ClaudeMark } from "@/components/ui/claude-mark";
import {
  UploadCloud,
  FileSpreadsheet,
  X,
  CheckCircle2,
  AlertTriangle,
  Download,
  ArrowRight,
  RefreshCw,
} from "lucide-react";

interface CsvUploadDropzoneProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface ParsedPreviewRow {
  amount: number;
  category: string;
  customerName: string;
  orderRef: string;
  soldAt: string;
  notes?: string;
}

export function CsvUploadDropzone({ isOpen, onClose, onSuccess }: CsvUploadDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [previewRows, setPreviewRows] = useState<ParsedPreviewRow[]>([]);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccessMessage, setUploadSuccessMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (selectedFile: File) => {
    if (!selectedFile.name.endsWith(".csv")) {
      setParseErrors(["Please select a valid .csv file."]);
      return;
    }

    setFile(selectedFile);
    setParseErrors([]);
    setUploadSuccessMessage(null);

    Papa.parse(selectedFile, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const rows: ParsedPreviewRow[] = [];
        const errs: string[] = [];

        results.data.forEach((rawRow: any, idx) => {
          const rowNum = idx + 2;
          const amt = parseFloat(rawRow.Amount || rawRow.amount || rawRow.price || rawRow.Price || 0);

          if (isNaN(amt) || amt <= 0) {
            errs.push(`Row ${rowNum}: Invalid amount "${rawRow.Amount || rawRow.amount || ""}"`);
            return;
          }

          rows.push({
            amount: amt,
            category: rawRow.Category || rawRow.category || "Enterprise Plan",
            customerName: rawRow.Customer || rawRow.customer || rawRow.customerName || "CSV Customer",
            orderRef: rawRow.OrderRef || rawRow.orderRef || `CSV-${idx + 1}`,
            soldAt: rawRow.Date || rawRow.date || rawRow.soldAt || new Date().toISOString(),
            notes: rawRow.Notes || rawRow.notes || "Bulk import",
          });
        });

        setPreviewRows(rows);
        setParseErrors(errs);
      },
      error: (error) => {
        setParseErrors([`Failed to parse CSV: ${error.message}`]);
      },
    });
  };

  const handleCommitUpload = async () => {
    if (previewRows.length === 0) return;

    setIsUploading(true);
    try {
      const res = await fetch("/api/sales/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: previewRows }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Bulk upload failed.");
      }

      setUploadSuccessMessage(json.message || `Imported ${previewRows.length} transactions.`);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch (err: any) {
      setParseErrors([err.message || "Failed to commit upload."]);
    } finally {
      setIsUploading(false);
    }
  };

  const reset = () => {
    setFile(null);
    setPreviewRows([]);
    setParseErrors([]);
    setUploadSuccessMessage(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-ink/40 backdrop-blur-sm transition-opacity"
      />

      {/* Modal Dialog Card */}
      <div className="relative z-10 w-full max-w-2xl rounded-lg border border-hairline bg-canvas p-7 shadow-card max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between border-b border-hairline pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-surface-card border border-hairline text-primary">
              <ClaudeMark className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-serif text-xl font-normal text-ink">
                Bulk CSV Transaction Ingestion
              </h3>
              <p className="text-xs text-muted">
                Import sales history to calculate weekly velocity & revenue analytics
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

        {uploadSuccessMessage ? (
          <div className="py-12 text-center space-y-3">
            <CheckCircle2 className="h-12 w-12 text-emerald-600 mx-auto animate-bounce" />
            <h4 className="font-serif text-2xl font-normal text-ink">Import Complete</h4>
            <p className="text-xs text-muted">{uploadSuccessMessage}</p>
            <p className="text-[11px] text-primary">Updating dashboard metrics...</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto space-y-4 pr-1">
            {/* Template download helper pill */}
            <div className="flex items-center justify-between rounded-md border border-hairline bg-surface-soft p-3 text-xs">
              <span className="text-muted">Need the standard column schema?</span>
              <a
                href="/sample_sales_template.csv"
                download="sample_sales_template.csv"
                className="inline-flex items-center gap-1.5 font-medium text-primary hover:underline"
              >
                <Download className="h-3.5 w-3.5" />
                Download Sample CSV
              </a>
            </div>

            {/* Dropzone */}
            {!file ? (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 text-center cursor-pointer transition-all ${
                  isDragging
                    ? "border-primary bg-primary/5"
                    : "border-hairline bg-surface-card/40 hover:border-primary/50 hover:bg-surface-card"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-soft border border-hairline text-ink mb-3 shadow-subtle">
                  <UploadCloud className="h-6 w-6 text-primary" />
                </div>
                <p className="font-serif text-lg font-normal text-ink">
                  Drop your CSV file here or click to browse
                </p>
                <p className="text-xs text-muted mt-1 font-sans">
                  Supported columns: Amount, Category, Customer, OrderRef, Date, Notes
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between rounded-md border border-hairline bg-surface-card p-3 text-xs">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="h-4 w-4 text-primary" />
                    <span className="font-medium text-ink">{file.name}</span>
                    <Badge variant="secondary" className="font-mono text-[10px]">
                      {previewRows.length} valid rows
                    </Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={reset}
                    className="h-7 text-xs text-muted hover:text-ink"
                  >
                    Change File
                  </Button>
                </div>

                {/* Warnings */}
                {parseErrors.length > 0 && (
                  <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 space-y-1">
                    <div className="flex items-center gap-1.5 font-semibold">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      Parsing Warnings ({parseErrors.length})
                    </div>
                    {parseErrors.slice(0, 3).map((err, i) => (
                      <p key={i} className="text-[11px] text-amber-900/90 pl-5">
                        • {err}
                      </p>
                    ))}
                  </div>
                )}

                {/* Preview Table */}
                <div>
                  <div className="flex items-center justify-between pb-2 text-xs text-muted">
                    <span>Parsed Preview (First 5 rows):</span>
                    <span className="font-mono text-ink font-medium">
                      Total: {formatCurrency(previewRows.reduce((s, r) => s + r.amount, 0))}
                    </span>
                  </div>

                  <div className="max-h-48 overflow-x-auto overflow-y-auto rounded-md border border-hairline">
                    <table className="w-full text-left text-[11px]">
                      <thead className="bg-surface-soft text-body-strong font-mono border-b border-hairline">
                        <tr>
                          <th className="p-2">Order Ref</th>
                          <th className="p-2">Customer</th>
                          <th className="p-2">Category</th>
                          <th className="p-2 text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-hairline">
                        {previewRows.slice(0, 5).map((row, idx) => (
                          <tr key={idx} className="hover:bg-surface-soft/60 text-body">
                            <td className="p-2 font-mono text-muted">{row.orderRef}</td>
                            <td className="p-2 font-medium text-ink">{row.customerName}</td>
                            <td className="p-2">{row.category}</td>
                            <td className="p-2 text-right font-mono font-medium text-primary">
                              {formatCurrency(row.amount)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {!uploadSuccessMessage && (
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-hairline mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isUploading}
            >
              Cancel
            </Button>

            <Button
              type="button"
              onClick={handleCommitUpload}
              disabled={!file || previewRows.length === 0 || isUploading}
              className="bg-primary hover:bg-primary-active text-on-primary font-medium"
            >
              {isUploading ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin mr-1.5" />
                  Importing...
                </>
              ) : (
                <>
                  Import {previewRows.length} Rows
                  <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
