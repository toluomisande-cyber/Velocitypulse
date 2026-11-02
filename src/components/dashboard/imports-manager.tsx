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
    <div className="rounded-xl border border-hairline bg-canvas overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-hairline bg-surface-soft">
        <div>
          <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted mb-0.5">
            Data Ingestion History
          </p>
          <h3 className="font-serif text-lg font-normal text-ink">
            CSV Import Library
          </h3>
        </div>
        <div className="flex items-center gap-2">
          {imports.length > 0 && (
            <span className="text-xs font-mono text-muted">
              {imports.length} import{imports.length !== 1 ? "s" : ""} · {totalRows.toLocaleString()} active rows
            </span>
          )}
          <button
            onClick={fetchImports}
            disabled={loading}
            className="p-1.5 rounded-md text-muted hover:text-ink hover:bg-surface-card transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="flex items-center gap-2 px-5 py-3 bg-red-50 border-b border-red-100 text-red-700 text-xs">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          {error}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="divide-y divide-hairline">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between px-5 py-4 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-md bg-surface-soft" />
                <div className="space-y-1.5">
                  <div className="h-3 w-40 rounded bg-surface-soft" />
                  <div className="h-2.5 w-24 rounded bg-surface-soft" />
                </div>
              </div>
              <div className="h-7 w-16 rounded-md bg-surface-soft" />
            </div>
          ))}
        </div>
      ) : imports.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center px-6 space-y-4">
          <div className="h-12 w-12 rounded-xl bg-surface-soft border border-hairline flex items-center justify-center text-muted">
            <FileSpreadsheet className="h-5 w-5" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-ink">No CSV imports yet</p>
            <p className="text-xs text-muted max-w-xs">
              Upload your first CSV file to start tracking imports here. Each file is stored as a separate batch you can view or delete independently.
            </p>
          </div>
          {onOpenUpload && (
            <button
              onClick={onOpenUpload}
              className="inline-flex items-center gap-2 bg-primary hover:bg-primary-active text-on-primary text-xs font-medium px-4 py-2 rounded-lg transition-colors"
            >
              <UploadCloud className="h-3.5 w-3.5" />
              Import First CSV
            </button>
          )}
        </div>
      ) : (
        <div className="divide-y divide-hairline">
          {imports.map((imp) => (
            <div
              key={imp.id}
              className="flex items-center justify-between px-5 py-4 hover:bg-surface-soft/40 transition-colors group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-8 w-8 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                  <FileSpreadsheet className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-ink truncate max-w-[220px] sm:max-w-xs">
                    {imp.filename}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <span className="text-[11px] font-mono text-primary font-medium">
                      {imp._count.sales.toLocaleString()} records
                    </span>
                    <span className="text-[11px] text-muted">·</span>
                    <span className="text-[11px] text-muted">
                      {formatRelativeTime(imp.importedAt)}
                    </span>
                    <span className="text-[11px] text-muted">·</span>
                    <span className="text-[11px] text-muted font-mono">
                      {new Date(imp.importedAt).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Delete controls */}
              <div className="flex items-center gap-2 shrink-0 ml-4">
                {confirmDeleteId === imp.id ? (
                  <>
                    <span className="text-[11px] text-amber-700 font-medium">Delete all {imp._count.sales} records?</span>
                    <button
                      onClick={() => handleDelete(imp.id)}
                      disabled={deletingId === imp.id}
                      className="text-[11px] bg-red-600 hover:bg-red-700 text-white px-2.5 py-1 rounded font-medium transition-colors disabled:opacity-60"
                    >
                      {deletingId === imp.id ? "Deleting…" : "Confirm"}
                    </button>
                    <button
                      onClick={() => setConfirmDeleteId(null)}
                      className="text-[11px] text-muted hover:text-ink px-2 py-1 rounded transition-colors"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setConfirmDeleteId(imp.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-md text-muted hover:text-red-600 hover:bg-red-50"
                    title={`Delete "${imp.filename}" and its ${imp._count.sales} records`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Footer CTA when has imports */}
      {imports.length > 0 && onOpenUpload && (
        <div className="px-5 py-3 border-t border-hairline bg-surface-soft flex items-center justify-between">
          <span className="text-xs text-muted">
            Deleting a batch permanently removes all its transaction records.
          </span>
          <button
            onClick={onOpenUpload}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
          >
            <UploadCloud className="h-3.5 w-3.5" />
            Upload Another
          </button>
        </div>
      )}
    </div>
  );
}
