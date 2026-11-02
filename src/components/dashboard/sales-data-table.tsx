"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SaleItem } from "@/lib/analytics";
import { CATEGORIES } from "@/lib/mock-data";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import {
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Download,
  ChevronLeft,
  ChevronRight,
  Receipt,
} from "lucide-react";

interface SalesDataTableProps {
  onRefreshNeeded?: () => void;
  refreshTrigger?: number;
}

export function SalesDataTable({ refreshTrigger }: SalesDataTableProps) {
  const [sales, setSales] = useState<SaleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [sortBy, setSortBy] = useState<string>("soldAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const fetchSales = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (category !== "all") params.set("category", category);
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);
      params.set("sortBy", sortBy);
      params.set("sortOrder", sortOrder);
      params.set("page", page.toString());
      params.set("limit", limit.toString());

      const res = await fetch(`/api/sales?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setSales(json.data);
        setTotalPages(json.pagination.totalPages);
        setTotalCount(json.pagination.totalCount);
      }
    } catch (err) {
      console.error("Failed to load sales log:", err);
    } finally {
      setLoading(false);
    }
  }, [search, category, startDate, endDate, sortBy, sortOrder, page, limit]);

  useEffect(() => {
    fetchSales();
  }, [fetchSales, refreshTrigger]);

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
    setPage(1);
  };

  const exportFilteredCSV = () => {
    if (sales.length === 0) return;
    const headers = ["OrderRef", "Customer", "Category", "Amount", "Currency", "Date", "Notes"];
    const rows = sales.map((s) => [
      s.orderRef || "",
      `"${(s.customerName || "").replace(/"/g, '""')}"`,
      `"${s.category}"`,
      s.amount,
      s.currency,
      format(new Date(s.soldAt), "yyyy-MM-dd HH:mm"),
      `"${(s.notes || "").replace(/"/g, '""')}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `sales_export_${format(new Date(), "yyyy-MM-dd")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const clearFilters = () => {
    setSearch("");
    setCategory("all");
    setStartDate("");
    setEndDate("");
    setPage(1);
  };

  return (
    <div className="rounded-xl border border-[#e5e1d8] bg-white p-5 flex flex-col justify-between">
      {/* Header */}
      <div className="flex flex-col space-y-3 pb-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0 border-b border-[#f0ede6]">
        <div>
          <div className="flex items-center gap-2">
            <Receipt className="h-4 w-4 text-[#c26a50]" />
            <h3 className="font-serif text-lg font-normal text-[#1f1b16]">
              Transaction ledger
            </h3>
            <span className="text-[10px] font-mono text-[#7b7266] bg-[#f0ede6] px-1.5 py-0.5 rounded">
              {totalCount.toLocaleString()} records
            </span>
          </div>
          <p className="text-xs text-[#5e554a] mt-0.5">
            Filterable sales history with multi-column sorting and direct CSV export
          </p>
        </div>

        <div>
          <Button
            variant="outline"
            size="sm"
            onClick={exportFilteredCSV}
            disabled={sales.length === 0}
            className="h-8 text-xs font-normal border-[#e5e1d8] bg-white text-[#5a5751] hover:text-[#191816]"
          >
            <Download className="h-3.5 w-3.5 mr-1.5 text-[#7b7266]" />
            Export CSV
          </Button>
        </div>
      </div>

      <div className="pt-4">
        {/* Filter Controls Bar */}
        <div className="mb-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5">
          {/* Search Box */}
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-[#7b7266]" />
            <Input
              placeholder="Search customer, order #…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="h-8 pl-8 text-xs border-[#e5e1d8] bg-[#faf9f5] focus-visible:ring-1 focus-visible:ring-[#c26a50]"
            />
          </div>

          {/* Category Dropdown */}
          <div className="relative">
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setPage(1);
              }}
              className="h-8 w-full rounded-md border border-[#e5e1d8] bg-[#faf9f5] px-2.5 text-xs text-[#1f1b16] focus:outline-none focus:border-[#c26a50]"
            >
              <option value="all">All categories</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Start Date */}
          <div>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPage(1);
              }}
              className="h-8 text-xs text-[#5e554a] border-[#e5e1d8] bg-[#faf9f5]"
              title="Start date"
            />
          </div>

          {/* End Date */}
          <div>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setPage(1);
              }}
              className="h-8 text-xs text-[#5e554a] border-[#e5e1d8] bg-[#faf9f5]"
              title="End date"
            />
          </div>

          {/* Reset Filters */}
          <div>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="h-8 w-full text-xs text-[#7b7266] hover:text-[#1f1b16] hover:bg-[#faf9f5]"
            >
              Reset filters
            </Button>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="overflow-x-auto rounded-lg border border-[#e5e1d8]">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#faf9f5] text-[#5e554a] border-b border-[#e5e1d8] font-normal text-[11px]">
              <tr>
                <th
                  onClick={() => handleSort("orderRef")}
                  className="p-3 cursor-pointer hover:text-[#1f1b16] transition-colors"
                >
                  <div className="flex items-center gap-1 font-mono">
                    Order ref
                    <ArrowUpDown className="h-3 w-3 text-[#7b7266]" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort("customerName")}
                  className="p-3 cursor-pointer hover:text-[#1f1b16] transition-colors"
                >
                  <div className="flex items-center gap-1">
                    Customer
                    <ArrowUpDown className="h-3 w-3 text-[#7b7266]" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort("category")}
                  className="p-3 cursor-pointer hover:text-[#1f1b16] transition-colors"
                >
                  <div className="flex items-center gap-1">
                    Category
                    <ArrowUpDown className="h-3 w-3 text-[#7b7266]" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort("soldAt")}
                  className="p-3 cursor-pointer hover:text-[#1f1b16] transition-colors"
                >
                  <div className="flex items-center gap-1 font-mono">
                    Date
                    {sortBy === "soldAt" ? (
                      sortOrder === "asc" ? (
                        <ArrowUp className="h-3 w-3 text-[#c26a50]" />
                      ) : (
                        <ArrowDown className="h-3 w-3 text-[#c26a50]" />
                      )
                    ) : (
                      <ArrowUpDown className="h-3 w-3 text-[#7b7266]" />
                    )}
                  </div>
                </th>
                <th
                  onClick={() => handleSort("amount")}
                  className="p-3 text-right cursor-pointer hover:text-[#1f1b16] transition-colors"
                >
                  <div className="flex items-center justify-end gap-1 font-mono">
                    Amount
                    {sortBy === "amount" ? (
                      sortOrder === "asc" ? (
                        <ArrowUp className="h-3 w-3 text-[#c26a50]" />
                      ) : (
                        <ArrowDown className="h-3 w-3 text-[#c26a50]" />
                      )
                    ) : (
                      <ArrowUpDown className="h-3 w-3 text-[#7b7266]" />
                    )}
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0ede6]">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-[#7b7266]">
                    <div className="flex items-center justify-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#c26a50] border-t-transparent" />
                      Loading records…
                    </div>
                  </td>
                </tr>
              ) : sales.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-[#7b7266]">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <div className="h-9 w-9 rounded-lg bg-[#faf9f5] flex items-center justify-center text-[#7b7266] border border-[#e5e1d8]">
                        <Receipt className="h-4 w-4" />
                      </div>
                      <p className="text-xs font-medium text-[#1f1b16]">No transactions in ledger</p>
                      <p className="text-[11px] text-[#7b7266] max-w-sm">
                        Import a sales CSV file or record a sale to populate your ledger.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                sales.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-[#faf9f5] transition-colors text-[#1f1b16]"
                  >
                    <td className="p-3 font-mono text-[#7b7266]">
                      {item.orderRef || "—"}
                    </td>
                    <td className="p-3 font-medium text-[#1f1b16]">
                      {item.customerName || "Direct sale"}
                    </td>
                    <td className="p-3">
                      <span className="inline-block rounded px-2 py-0.5 text-[10px] font-mono bg-[#f0ede6] text-[#5e554a]">
                        {item.category}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-[#7b7266]">
                      {format(new Date(item.soldAt), "MMM d, yyyy")}
                    </td>
                    <td className="p-3 text-right font-mono font-medium text-[#1f1b16] tabular-nums">
                      {formatCurrency(item.amount, item.currency)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="mt-4 flex flex-col items-center justify-between gap-3 sm:flex-row text-xs text-[#7b7266]">
          <div>
            Showing <span className="font-mono text-[#1f1b16] font-medium">{sales.length}</span> of{" "}
            <span className="font-mono text-[#1f1b16] font-medium">{totalCount}</span> records
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="h-7 text-xs border-[#e5e1d8] bg-white text-[#5e554a] hover:text-[#1f1b16]"
            >
              <ChevronLeft className="h-3.5 w-3.5 mr-0.5" />
              Prev
            </Button>

            <span className="font-mono px-2 text-[#1f1b16]">
              {page} / {Math.max(1, totalPages)}
            </span>

            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
              className="h-7 text-xs border-[#e5e1d8] bg-white text-[#5e554a] hover:text-[#1f1b16]"
            >
              Next
              <ChevronRight className="h-3.5 w-3.5 ml-0.5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
