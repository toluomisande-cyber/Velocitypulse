"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
    <Card variant="cream" className="border-hairline bg-canvas shadow-subtle">
      <CardHeader className="flex flex-col space-y-3 pb-3 lg:flex-row lg:items-center lg:justify-between lg:space-y-0 border-b border-hairline/60">
        <div>
          <div className="flex items-center gap-2">
            <CardTitle className="font-serif text-xl font-normal flex items-center gap-2 text-ink">
              <Receipt className="h-4 w-4 text-primary" />
              Transactions & Sales Velocity Log
            </CardTitle>
            <Badge variant="secondary" className="font-mono text-xs">
              {totalCount.toLocaleString()} total entries
            </Badge>
          </div>
          <CardDescription className="mt-1">
            Real-time filterable transaction ledger with multi-column sorting and date range selection
          </CardDescription>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={exportFilteredCSV}
            disabled={sales.length === 0}
            className="text-body text-xs"
          >
            <Download className="h-3.5 w-3.5 mr-1 text-muted" />
            Export CSV
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-5">
        {/* Filter Controls Bar */}
        <div className="mb-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5">
          {/* Search Box */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted" />
            <Input
              placeholder="Search customer, order #..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-9 text-xs"
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
              className="h-10 w-full rounded-md border border-hairline bg-canvas px-3 text-xs text-ink focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            >
              <option value="all">All Categories</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Start Date */}
          <div className="relative">
            <Input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPage(1);
              }}
              className="text-xs text-body"
              title="Start Date"
            />
          </div>

          {/* End Date */}
          <div className="relative">
            <Input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setPage(1);
              }}
              className="text-xs text-body"
              title="End Date"
            />
          </div>

          {/* Reset Filters */}
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="w-full text-xs text-muted hover:text-ink"
            >
              Reset Filters
            </Button>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="overflow-x-auto rounded-md border border-hairline bg-canvas">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-soft text-body-strong border-b border-hairline uppercase font-medium tracking-wider text-[11px]">
              <tr>
                <th
                  onClick={() => handleSort("orderRef")}
                  className="p-3.5 cursor-pointer hover:text-ink transition-colors"
                >
                  <div className="flex items-center gap-1 font-mono">
                    Order Ref
                    <ArrowUpDown className="h-3 w-3 text-muted" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort("customerName")}
                  className="p-3.5 cursor-pointer hover:text-ink transition-colors"
                >
                  <div className="flex items-center gap-1">
                    Customer / Account
                    <ArrowUpDown className="h-3 w-3 text-muted" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort("category")}
                  className="p-3.5 cursor-pointer hover:text-ink transition-colors"
                >
                  <div className="flex items-center gap-1">
                    Category
                    <ArrowUpDown className="h-3 w-3 text-muted" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort("soldAt")}
                  className="p-3.5 cursor-pointer hover:text-ink transition-colors"
                >
                  <div className="flex items-center gap-1">
                    Sold At
                    {sortBy === "soldAt" ? (
                      sortOrder === "asc" ? (
                        <ArrowUp className="h-3 w-3 text-primary" />
                      ) : (
                        <ArrowDown className="h-3 w-3 text-primary" />
                      )
                    ) : (
                      <ArrowUpDown className="h-3 w-3 text-muted" />
                    )}
                  </div>
                </th>
                <th
                  onClick={() => handleSort("amount")}
                  className="p-3.5 text-right cursor-pointer hover:text-ink transition-colors"
                >
                  <div className="flex items-center justify-end gap-1 font-mono">
                    Amount
                    {sortBy === "amount" ? (
                      sortOrder === "asc" ? (
                        <ArrowUp className="h-3 w-3 text-primary" />
                      ) : (
                        <ArrowDown className="h-3 w-3 text-primary" />
                      )
                    ) : (
                      <ArrowUpDown className="h-3 w-3 text-muted" />
                    )}
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline-soft">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-muted">
                    <div className="flex items-center justify-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                      Loading transactions...
                    </div>
                  </td>
                </tr>
              ) : sales.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-muted">
                    No matching sales records found. Try adjusting your search or filters.
                  </td>
                </tr>
              ) : (
                sales.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-surface-soft/60 transition-colors text-body"
                  >
                    <td className="p-3.5 font-mono text-muted">
                      {item.orderRef || "—"}
                    </td>
                    <td className="p-3.5 font-medium text-ink">
                      {item.customerName || "Direct Checkout"}
                    </td>
                    <td className="p-3.5">
                      <span className="inline-block rounded-pill border border-hairline bg-surface-card px-2.5 py-0.5 text-[11px] text-body">
                        {item.category}
                      </span>
                    </td>
                    <td className="p-3.5 font-mono text-muted">
                      {format(new Date(item.soldAt), "MMM d, yyyy HH:mm")}
                    </td>
                    <td className="p-3.5 text-right font-mono font-medium text-primary">
                      {formatCurrency(item.amount, item.currency)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="mt-4 flex flex-col items-center justify-between gap-3 sm:flex-row text-xs text-muted">
          <div>
            Showing <span className="font-mono text-ink font-medium">{sales.length}</span> of{" "}
            <span className="font-mono text-ink font-medium">{totalCount}</span> entries
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="h-8 px-2.5"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Prev
            </Button>

            <span className="font-mono px-2 text-ink">
              Page {page} of {Math.max(1, totalPages)}
            </span>

            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
              className="h-8 px-2.5"
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
