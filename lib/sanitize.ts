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

// Common/weak passwords rejected regardless of length.
const COMMON_PASSWORDS = new Set([
  "12345678", "123456789", "1234567890", "password", "password1", "password123",
  "qwerty", "qwertyui", "qwerty123", "11111111", "00000000", "abc12345",
  "iloveyou", "admin123", "letmein1", "welcome1", "1q2w3e4r", "asdfghjk",
])

/**
 * Validates a password: at least 8 chars, contains a letter and a number,
 * and is not a well-known weak/sequential password.
 * Returns an error message string, or null if valid.
 */
export function validatePassword(password: string): string | null {
  if (password.length < 8) return "Password must be at least 8 characters"
  if (COMMON_PASSWORDS.has(password.toLowerCase())) {
    return "This password is too common. Please choose a stronger one."
  }
  if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
    return "Password must include at least one letter and one number"
  }
  return null
}
