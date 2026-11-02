"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Trash2, FileSpreadsheet, UploadCloud, RefreshCw, AlertTriangle } from "lucide-react";

interface CsvImportRecord {
  id: string;
  filename: string;
  rowCount: number;
  importedAt: string;
  _count: { sales: number };
}

interface ImportsManagerProps {
  onImportDeleted?: () => void;
  onOpenUpload?: () => void;
  refreshTrigger?: number;
}

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function ImportsManager({ onImportDeleted, onOpenUpload, refreshTrigger }: ImportsManagerProps) {
  const [imports, setImports] = useState<CsvImportRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchImports = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/imports");
      const json = await res.json();
      if (json.success) {
        setImports(json.imports);
      } else {
        setError("Failed to load import history.");
      }
    } catch {
      setError("Network error loading imports.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchImports();
  }, [fetchImports, refreshTrigger]);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    setError(null);
    try {
      const res = await fetch(`/api/imports/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        setImports((prev) => prev.filter((i) => i.id !== id));
        onImportDeleted?.();
      } else {
        setError(json.error || "Failed to delete import.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setDeletingId(null);
      setConfirmDeleteId(null);
    }
  };

  const totalRows = imports.reduce((sum, i) => sum + i._count.sales, 0);

  return (
    <div className="rounded-xl border border-[#e5e1d8] bg-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-[#f0ede6] bg-[#faf9f5]">
        <div>
          <p className="text-[11px] font-medium text-[#7b7266] mb-0.5">
            Batch ingestion
          </p>
          <h3 className="font-serif text-lg font-normal text-[#1f1b16]">
            CSV import history
          </h3>
        </div>
        <div className="flex items-center gap-3">
          {imports.length > 0 && (
            <span className="text-xs font-mono text-[#7b7266]">
              {imports.length} batch{imports.length !== 1 ? "es" : ""} · {totalRows.toLocaleString()} rows
            </span>
          )}
          <button
            onClick={fetchImports}
            disabled={loading}
            className="p-1.5 rounded-md text-[#7b7266] hover:text-[#1f1b16] hover:bg-white transition-colors"
            title="Refresh list"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="flex items-center gap-2 px-5 py-2.5 bg-[#dc2626]/5 border-b border-[#dc2626]/10 text-[#dc2626] text-xs">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          {error}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="divide-y divide-[#f0ede6]">
          {[1, 2].map((i) => (
            <div key={i} className="flex items-center justify-between px-5 py-3.5 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="h-7 w-7 rounded bg-[#efe9df]" />
                <div className="space-y-1">
                  <div className="h-3 w-32 rounded bg-[#efe9df]" />
                  <div className="h-2.5 w-20 rounded bg-[#efe9df]" />
                </div>
              </div>
              <div className="h-6 w-14 rounded bg-[#efe9df]" />
            </div>
          ))}
        </div>
      ) : imports.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center px-6 space-y-3">
          <div className="h-10 w-10 rounded-lg bg-[#faf9f5] border border-[#e5e1d8] flex items-center justify-center text-[#7b7266]">
            <FileSpreadsheet className="h-4 w-4" />
          </div>
          <div className="space-y-0.5">
            <p className="text-xs font-medium text-[#1f1b16]">No import batches recorded</p>
            <p className="text-[11px] text-[#7b7266] max-w-xs">
              Upload your sales CSV to initialize batch history. Each batch can be reviewed or deleted independently.
            </p>
          </div>
          {onOpenUpload && (
            <button
              onClick={onOpenUpload}
              className="inline-flex items-center gap-1.5 bg-[#c26a50] hover:bg-[#a85840] text-white text-xs font-medium px-3.5 py-2 rounded-lg transition-colors"
            >
              <UploadCloud className="h-3.5 w-3.5" />
              Upload first CSV
            </button>
          )}
        </div>
      ) : (
        <div className="divide-y divide-[#f0ede6]">
          {imports.map((imp) => (
            <div
              key={imp.id}
              className="flex items-center justify-between px-5 py-3.5 hover:bg-[#faf9f5] transition-colors group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-7 w-7 rounded-md bg-[#faf9f5] border border-[#e5e1d8] flex items-center justify-center text-[#7b7266] shrink-0">
                  <FileSpreadsheet className="h-3.5 w-3.5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-[#1f1b16] truncate max-w-[220px] sm:max-w-xs">
                    {imp.filename}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <span className="text-[11px] font-mono text-[#c26a50] font-medium">
                      {imp._count.sales.toLocaleString()} records
                    </span>
                    <span className="text-[11px] text-[#7b7266]">·</span>
                    <span className="text-[11px] text-[#7b7266]">
                      {formatRelativeTime(imp.importedAt)}
                    </span>
                    <span className="text-[11px] text-[#7b7266] hidden sm:inline">·</span>
                    <span className="text-[11px] text-[#7b7266] font-mono hidden sm:inline">
                      {new Date(imp.importedAt).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Delete controls */}
              <div className="flex items-center gap-2 shrink-0 ml-4">
                {confirmDeleteId === imp.id ? (
                  <>
                    <span className="text-[11px] text-[#b45309]">Delete {imp._count.sales} records?</span>
                    <button
                      onClick={() => handleDelete(imp.id)}
                      disabled={deletingId === imp.id}
                      className="text-[11px] bg-[#dc2626] hover:bg-[#b91c1c] text-white px-2 py-0.5 rounded font-medium transition-colors disabled:opacity-60"
                    >
                      {deletingId === imp.id ? "Deleting…" : "Confirm"}
                    </button>
                    <button
                      onClick={() => setConfirmDeleteId(null)}
                      className="text-[11px] text-[#7b7266] hover:text-[#1f1b16] px-1.5 py-0.5 rounded"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setConfirmDeleteId(imp.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-md text-[#7b7266] hover:text-[#dc2626] hover:bg-[#dc2626]/5"
                    title={`Delete "${imp.filename}"`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Footer */}
      {imports.length > 0 && onOpenUpload && (
        <div className="px-5 py-3 border-t border-[#f0ede6] bg-[#faf9f5] flex items-center justify-between text-xs text-[#7b7266]">
          <span>Deleting a batch permanently removes its transactions from velocity calculations.</span>
          <button
            onClick={onOpenUpload}
            className="inline-flex items-center gap-1 font-medium text-[#c26a50] hover:underline"
          >
            <UploadCloud className="h-3.5 w-3.5" />
            Upload batch
          </button>
        </div>
      )}
    </div>
  );
}
