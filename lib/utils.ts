import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const currencyToLocale: Record<string, string> = {
  INR: "en-IN",
  USD: "en-US",
  GBP: "en-GB",
  EUR: "de-DE",
  AUD: "en-AU",
  CAD: "en-CA",
  SGD: "en-SG",
  AED: "ar-AE",
}

export function getCurrencyLocale(currency: string): string | undefined {
  return currencyToLocale[currency]
}

export function formatCurrency(amount: number, currency = "INR"): string {
  return new Intl.NumberFormat(getCurrencyLocale(currency), {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function getTaxLabel(currency: string): string {
  return currency === "INR" ? "GST" : "Tax"
}

export function isGstCurrency(currency: string): boolean {
  return currency === "INR"
}

export function getGstType(
  orgState: string | null | undefined,
  clientState: string | null | undefined
): "CGST+SGST" | "IGST" | "GST" {
  if (!orgState || !clientState) return "GST"
  if (orgState.trim().toLowerCase() === clientState.trim().toLowerCase()) return "CGST+SGST"
  return "IGST"
}

export function formatDate(date: Date | string, currency?: string): string {
  const d = new Date(date)
  if (currency === "INR") {
    return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
  }
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

export function generateInvoiceNumber(count: number): string {
  return `INV-${String(count).padStart(4, "0")}`
}

export function generateQuoteNumber(count: number): string {
  return `QUO-${String(count).padStart(4, "0")}`
}

export function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
}

export function isOverdue(dueDate: Date | string, status: string): boolean {
  if (status === "PAID" || status === "CANCELLED") return false
  return new Date(dueDate) < new Date()
}
