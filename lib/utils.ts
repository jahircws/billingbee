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

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date))
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
