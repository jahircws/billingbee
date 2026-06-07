import DOMPurify from "isomorphic-dompurify"

export function sanitizeInput(str: unknown): string {
  if (typeof str !== "string") return ""
  return DOMPurify.sanitize(str).trim()
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)
}

export function isValidGSTIN(gstin: string): boolean {
  return /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(gstin)
}
