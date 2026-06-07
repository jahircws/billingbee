import { describe, it, expect } from "vitest"
import {
  formatCurrency,
  formatDate,
  generateInvoiceNumber,
  generateQuoteNumber,
  getInitials,
  isOverdue,
} from "@/lib/utils"
import { sanitizeInput, isValidEmail, isValidGSTIN } from "@/lib/sanitize"

// ── formatCurrency ─────────────────────────────────────────────────────────

describe("formatCurrency", () => {
  it("formats INR with ₹ symbol and Indian number grouping", () => {
    const result = formatCurrency(1234.5, "INR")
    expect(result).toContain("1,234.50")
    // Intl may use ₹ or variant — check it contains the rupee symbol
    expect(result).toMatch(/₹|INR/)
  })

  it("formats USD with $ symbol", () => {
    const result = formatCurrency(1234.5, "USD")
    expect(result).toContain("1,234.50")
    expect(result).toMatch(/\$|USD/)
  })

  it("formats zero correctly", () => {
    const result = formatCurrency(0, "INR")
    expect(result).toContain("0.00")
  })

  it("formats large amounts with correct grouping for INR", () => {
    const result = formatCurrency(100000, "INR")
    // 1,00,000 in Indian system
    expect(result).toMatch(/1,00,000|100,000/)
  })

  it("always produces exactly 2 decimal places", () => {
    const result = formatCurrency(10, "USD")
    expect(result).toMatch(/10\.00/)
  })

  it("rounds to 2 decimal places", () => {
    const result = formatCurrency(9.999, "USD")
    expect(result).toMatch(/10\.00/)
  })

  it("defaults to INR when currency not provided", () => {
    const withDefault = formatCurrency(100)
    const withExplicit = formatCurrency(100, "INR")
    expect(withDefault).toBe(withExplicit)
  })
})

// ── generateInvoiceNumber ──────────────────────────────────────────────────

describe("generateInvoiceNumber", () => {
  it("generates INV-0001 for count 1", () => {
    expect(generateInvoiceNumber(1)).toBe("INV-0001")
  })

  it("zero-pads to 4 digits", () => {
    expect(generateInvoiceNumber(5)).toBe("INV-0005")
  })

  it("handles counts above 9999 without truncating", () => {
    expect(generateInvoiceNumber(10000)).toBe("INV-10000")
  })

  it("increments correctly for sequential calls", () => {
    const nums = [1, 2, 3].map(generateInvoiceNumber)
    expect(nums).toEqual(["INV-0001", "INV-0002", "INV-0003"])
  })
})

describe("generateQuoteNumber", () => {
  it("generates QUO-0001 for count 1", () => {
    expect(generateQuoteNumber(1)).toBe("QUO-0001")
  })

  it("is distinct from invoice numbers", () => {
    expect(generateQuoteNumber(1)).not.toBe(generateInvoiceNumber(1))
    expect(generateQuoteNumber(1)).toMatch(/^QUO-/)
  })
})

// ── formatDate ─────────────────────────────────────────────────────────────

describe("formatDate", () => {
  it("formats a Date object to readable string", () => {
    const result = formatDate(new Date("2025-06-15"))
    expect(result).toMatch(/Jun/)
    expect(result).toMatch(/2025/)
    expect(result).toMatch(/15/)
  })

  it("accepts ISO string input", () => {
    const result = formatDate("2025-01-01")
    expect(result).toMatch(/Jan/)
    expect(result).toMatch(/2025/)
  })

  it("does not throw for valid date strings", () => {
    expect(() => formatDate("2024-12-31")).not.toThrow()
  })

  it("formats different months correctly", () => {
    const months = [
      { input: "2025-01-15", match: /Jan/ },
      { input: "2025-06-15", match: /Jun/ },
      { input: "2025-12-25", match: /Dec/ },
    ]
    for (const { input, match } of months) {
      expect(formatDate(input)).toMatch(match)
    }
  })
})

// ── getInitials ────────────────────────────────────────────────────────────

describe("getInitials", () => {
  it("returns first letters of first and last name", () => {
    expect(getInitials("Alice Bob")).toBe("AB")
  })

  it("uppercases initials", () => {
    expect(getInitials("alice bob")).toBe("AB")
  })

  it("returns single initial for single-word name", () => {
    expect(getInitials("Alice")).toBe("A")
  })

  it("only uses first two words", () => {
    expect(getInitials("Alice Bob Charlie")).toBe("AB")
  })

  it("handles extra whitespace", () => {
    expect(getInitials("  Alice   Bob  ")).toBe("AB")
  })
})

// ── isOverdue ──────────────────────────────────────────────────────────────

describe("isOverdue", () => {
  const pastDate = new Date(Date.now() - 86_400_000).toISOString() // yesterday
  const futureDate = new Date(Date.now() + 86_400_000).toISOString() // tomorrow

  it("returns true for unpaid invoice past due date", () => {
    expect(isOverdue(pastDate, "UNPAID")).toBe(true)
  })

  it("returns false for unpaid invoice with future due date", () => {
    expect(isOverdue(futureDate, "UNPAID")).toBe(false)
  })

  it("returns false for PAID invoice regardless of date", () => {
    expect(isOverdue(pastDate, "PAID")).toBe(false)
  })

  it("returns false for CANCELLED invoice regardless of date", () => {
    expect(isOverdue(pastDate, "CANCELLED")).toBe(false)
  })
})

// ── sanitizeInput ──────────────────────────────────────────────────────────

describe("sanitizeInput", () => {
  it("returns empty string for non-string input", () => {
    expect(sanitizeInput(null)).toBe("")
    expect(sanitizeInput(undefined)).toBe("")
    expect(sanitizeInput(123)).toBe("")
    expect(sanitizeInput({})).toBe("")
  })

  it("trims whitespace", () => {
    expect(sanitizeInput("  hello  ")).toBe("hello")
  })

  it("strips script tags", () => {
    const result = sanitizeInput("<script>alert('xss')</script>hello")
    expect(result).not.toContain("<script>")
    expect(result).not.toContain("alert")
  })

  it("strips onclick and event handlers", () => {
    const result = sanitizeInput('<img src="x" onerror="alert(1)">')
    expect(result).not.toContain("onerror")
    expect(result).not.toContain("alert")
  })

  it("strips javascript: protocol", () => {
    const result = sanitizeInput('<a href="javascript:void(0)">click</a>')
    expect(result).not.toContain("javascript:")
  })

  it("preserves safe plain text", () => {
    expect(sanitizeInput("Invoice for website redesign")).toBe("Invoice for website redesign")
  })

  it("preserves numbers and special chars used in business data", () => {
    expect(sanitizeInput("₹1,23,456.78")).toBe("₹1,23,456.78")
    expect(sanitizeInput("GST: 27AABCU9603R1ZX")).toBe("GST: 27AABCU9603R1ZX")
  })
})

// ── isValidEmail ───────────────────────────────────────────────────────────

describe("isValidEmail", () => {
  it("accepts valid emails", () => {
    expect(isValidEmail("user@example.com")).toBe(true)
    expect(isValidEmail("user+tag@sub.domain.co.in")).toBe(true)
  })

  it("rejects emails without @", () => {
    expect(isValidEmail("notanemail")).toBe(false)
  })

  it("rejects emails without domain", () => {
    expect(isValidEmail("user@")).toBe(false)
  })

  it("rejects emails with space", () => {
    expect(isValidEmail("user @domain.com")).toBe(false)
  })
})

// ── isValidGSTIN ───────────────────────────────────────────────────────────

describe("isValidGSTIN", () => {
  it("accepts a valid GSTIN", () => {
    expect(isValidGSTIN("27AABCU9603R1ZX")).toBe(true)
  })

  it("rejects GSTIN with wrong length", () => {
    expect(isValidGSTIN("27AABCU9603R1Z")).toBe(false)
  })

  it("rejects GSTIN with lowercase letters", () => {
    expect(isValidGSTIN("27aabcu9603r1zx")).toBe(false)
  })

  it("rejects empty string", () => {
    expect(isValidGSTIN("")).toBe(false)
  })
})
