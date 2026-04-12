// Centralized date formatting utilities

import { format, parse, isValid } from "date-fns";

/**
 * Format a raw date string into a readable format like "Mar 13, 2026".
 * Handles ISO dates, various string formats, and gracefully returns "—" for empty/invalid.
 */
export function formatDisplayDate(raw: string | undefined | null): string {
  if (!raw || raw === "—" || raw.trim() === "") return "—";
  const s = raw.trim();

  // Try ISO / YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
    const iso = new Date(s);
    if (isValid(iso)) return format(iso, "MMM d, yyyy");
  }

  // Try common formats
  const fmts = ["MMM d, yyyy", "MMM dd, yyyy", "MM/dd/yyyy", "M/d/yyyy", "dd/MM/yyyy"];
  for (const f of fmts) {
    try {
      const d = parse(s, f, new Date());
      if (isValid(d)) return format(d, "MMM d, yyyy");
    } catch {
      // continue
    }
  }

  return s; // fallback: return as-is
}

/**
 * Check if a status string indicates a completed/finished state.
 * Handles various formats: "Yes", "Completed", "Ended", "Finished", etc.
 */
export function isCompletedStatus(status: string | undefined | null): boolean {
  if (!status) return false;
  const s = status.trim().toLowerCase();
  return s === "yes" || s === "completed" || s === "ended" || s === "finished";
}

/**
 * Get a normalized status label and styling from raw status values.
 */
export function getStatusInfo(status: string): { label: string; className: string } {
  const s = (status || "").trim().toLowerCase();
  if (isCompletedStatus(status))
    return { label: "Completed", className: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" };
  if (/no\(\d{4}\)/.test(s)) {
    const year = s.match(/\d{4}/)?.[0] || "";
    return { label: `Upcoming ${year}`, className: "bg-blue-500/15 text-blue-400 border-blue-500/30" };
  }
  if (s === "no" || s === "in progress" || s === "returning series" || s === "ongoing")
    return { label: "In Progress", className: "bg-amber-500/15 text-amber-400 border-amber-500/30" };
  if (s === "canceled" || s === "cancelled")
    return { label: "Canceled", className: "bg-red-500/15 text-red-400 border-red-500/30" };
  return { label: status || "—", className: "bg-secondary text-muted-foreground" };
}
