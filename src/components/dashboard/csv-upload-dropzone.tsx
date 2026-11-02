"use client";

import React, { useState, useRef } from "react";
import Papa from "papaparse";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { ClaudeMark } from "@/components/ui/claude-mark";
import {
  UploadCloud,
  FileSpreadsheet,
  X,
  CheckCircle2,
  AlertTriangle,
  Download,
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
            customerName: rawRow.Customer || rawRow.customer || rawRow.customerName || "Direct Sale",
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
        body: JSON.stringify({ rows: previewRows, filename: file?.name || "upload.csv" }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Bulk upload failed.");
      }

      setUploadSuccessMessage(json.message || `Imported ${previewRows.length} transactions.`);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1200);
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
        className="fixed inset-0 bg-[#191816]/40 backdrop-blur-sm transition-opacity"
      />

      {/* Modal Dialog Card */}
      <div className="relative z-10 w-full max-w-xl rounded-xl border border-[#e5e1d8] bg-white p-6 shadow-xl max-h-[88vh] flex flex-col">
        <div className="flex items-center justify-between border-b border-[#f0ede6] pb-3.5 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#faf9f5] border border-[#e5e1d8]">
              <ClaudeMark className="h-4 w-4 text-[#c26a50]" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-normal text-[#191816]">
                CSV batch ingestion
              </h3>
              <p className="text-[11px] text-[#7b7266]">
                Import sales history to calculate weekly velocity & revenue analytics
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

        {uploadSuccessMessage ? (
          <div className="py-12 text-center space-y-2">
            <CheckCircle2 className="h-10 w-10 text-[#16a34a] mx-auto" />
            <h4 className="font-serif text-xl font-normal text-[#191816]">Import complete</h4>
            <p className="text-xs text-[#5e554a]">{uploadSuccessMessage}</p>
            <p className="text-[11px] font-mono text-[#c26a50]">Refreshing dashboard metrics…</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 text-xs">
            {/* Template link */}
            <div className="flex items-center justify-between rounded-lg border border-[#e5e1d8] bg-[#faf9f5] p-2.5">
              <span className="text-[#5e554a]">Standard schema: Amount, Category, Customer, OrderRef, Date, Notes</span>
              <a
                href="/sample_sales_template.csv"
                download="sample_sales_template.csv"
                className="inline-flex items-center gap-1 font-medium text-[#c26a50] hover:underline"
              >
                <Download className="h-3 w-3" />
                Template ↓
              </a>
            </div>

            {/* Dropzone */}
            {!file ? (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 text-center cursor-pointer transition-colors ${
                  isDragging
                    ? "border-[#c26a50] bg-[#c26a50]/5"
                    : "border-[#e5e1d8] bg-[#faf9f5] hover:border-[#c26a50]/60"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white border border-[#e5e1d8] mb-2.5">
                  <UploadCloud className="h-5 w-5 text-[#c26a50]" />
                </div>
                <p className="font-serif text-base font-normal text-[#191816]">
                  Drop sales CSV file here or click to browse
                </p>
                <p className="text-[11px] text-[#7b7266] mt-0.5 font-mono">
                  Rows will be validated and stamped to your account
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-lg border border-[#e5e1d8] bg-[#faf9f5] p-2.5">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="h-4 w-4 text-[#c26a50]" />
                    <span className="font-medium text-[#191816] truncate max-w-[200px] sm:max-w-xs">{file.name}</span>
                    <span className="font-mono text-[10px] text-[#7b7266]">
                      ({previewRows.length} rows)
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={reset}
                    className="h-7 text-xs text-[#7b7266] hover:text-[#191816]"
                  >
                    Change
                  </Button>
                </div>

                {parseErrors.length > 0 && (
                  <div className="rounded-lg border border-[#dc2626]/20 bg-[#dc2626]/5 p-2.5 text-xs text-[#dc2626] space-y-1">
                    <div className="flex items-center gap-1.5 font-medium">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      Parsing warnings ({parseErrors.length})
                    </div>
                    {parseErrors.slice(0, 2).map((err, i) => (
                      <p key={i} className="text-[11px] pl-4">• {err}</p>
                    ))}
                  </div>
                )}

                {/* Preview Table */}
                <div>
                  <div className="flex items-center justify-between pb-1.5 text-[11px] text-[#7b7266]">
                    <span>Sample parsed rows:</span>
                    <span className="font-mono text-[#191816]">
                      Sum: {formatCurrency(previewRows.reduce((s, r) => s + r.amount, 0))}
                    </span>
                  </div>

                  <div className="max-h-40 overflow-y-auto rounded-lg border border-[#e5e1d8]">
                    <table className="w-full text-left text-[11px]">
                      <thead className="bg-[#faf9f5] text-[#5e554a] border-b border-[#e5e1d8] font-mono">
                        <tr>
                          <th className="p-2">Order ref</th>
                          <th className="p-2">Customer</th>
                          <th className="p-2">Category</th>
                          <th className="p-2 text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#f0ede6]">
                        {previewRows.slice(0, 5).map((row, idx) => (
                          <tr key={idx} className="hover:bg-[#faf9f5] text-[#191816]">
                            <td className="p-2 font-mono text-[#7b7266]">{row.orderRef}</td>
                            <td className="p-2">{row.customerName}</td>
                            <td className="p-2">{row.category}</td>
                            <td className="p-2 text-right font-mono text-[#191816] tabular-nums">
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
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#f0ede6] mt-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isUploading}
              className="h-8 text-xs border-[#e5e1d8] bg-white text-[#5e554a]"
            >
              Cancel
            </Button>

            <Button
              type="button"
              onClick={handleCommitUpload}
              disabled={!file || previewRows.length === 0 || isUploading}
              className="h-8 text-xs font-medium bg-[#c26a50] hover:bg-[#a85840] text-white"
            >
              {isUploading ? (
                <>
                  <RefreshCw className="h-3 w-3 animate-spin mr-1.5" />
                  Importing…
                </>
              ) : (
                `Import ${previewRows.length} rows`
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
