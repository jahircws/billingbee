import { describe, it, expect, vi, beforeEach } from "vitest"

// ── All mocked values must be hoisted so vi.mock factories can reference them

const { mockAuth, mockPrisma, mockCheckInvoiceLimit, mockInvalidatePlanCache } = vi.hoisted(() => {
  const mockAuth = vi.fn()
  const mockPrisma = {
    invoice: {
      count: vi.fn(),
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    organization: { findUnique: vi.fn() },
  }
  const mockCheckInvoiceLimit = vi.fn()
  const mockInvalidatePlanCache = vi.fn()
  return { mockAuth, mockPrisma, mockCheckInvoiceLimit, mockInvalidatePlanCache }
})

vi.mock("@/auth", () => ({ auth: mockAuth }))
vi.mock("@/lib/db", () => ({ default: mockPrisma }))
vi.mock("@/lib/plan", () => ({
  checkInvoiceLimit: mockCheckInvoiceLimit,
  invalidatePlanCache: mockInvalidatePlanCache,
}))
vi.mock("@/app/actions/collections", () => ({ scheduleCollections: vi.fn() }))

// ── Import under test ──────────────────────────────────────────────────────
import {
  createInvoice,
  getInvoices,
  getInvoice,
  updateInvoice,
  deleteInvoice,
  updateInvoiceStatus,
  duplicateInvoice,
} from "@/app/actions/invoices"

// ── Helpers ─────────────────────────────────────────────────────────────────

const ORG_ID = "org-abc"
const CLIENT_ID = "client-123"

function mockSession(orgId = ORG_ID) {
  mockAuth.mockResolvedValue({ user: { orgId, userId: "user-xyz" } })
}
function mockNoSession() {
  mockAuth.mockResolvedValue(null)
}

const INVOICE_STUB = {
  id: "inv-1",
  orgId: ORG_ID,
  clientId: CLIENT_ID,
  invoiceNumber: "INV-001",
  status: "UNPAID",
  total: 1000,
  amountDue: 1000,
  amountPaid: 0,
  dueDate: new Date("2025-12-31"),
  autoFollowUp: false,
}

const VALID_INPUT = {
  clientId: CLIENT_ID,
  items: [{ description: "Dev work", quantity: 1, unitPrice: 1000, taxRate: 0 }],
}

// ── createInvoice ─────────────────────────────────────────────────────────

describe("createInvoice", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSession()
    mockCheckInvoiceLimit.mockResolvedValue({ allowed: true, current: 0, limit: 5 })
    mockPrisma.invoice.count.mockResolvedValue(0)
    mockPrisma.organization.findUnique.mockResolvedValue({ plan: "free" })
    mockPrisma.invoice.create.mockResolvedValue(INVOICE_STUB)
  })

  it("extracts orgId from session, never from client input", async () => {
    await createInvoice(VALID_INPUT)
    const createData = mockPrisma.invoice.create.mock.calls[0][0].data
    expect(createData.orgId).toBe(ORG_ID)
    expect(createData.orgId).not.toBe(VALID_INPUT.clientId)
  })

  it("redirects to /login when session is missing", async () => {
    mockNoSession()
    await expect(createInvoice(VALID_INPUT)).rejects.toThrow("REDIRECT:/login")
  })

  it("returns LIMIT_REACHED when free plan limit hit", async () => {
    mockCheckInvoiceLimit.mockResolvedValue({ allowed: false, current: 5, limit: 5 })
    const result = await createInvoice(VALID_INPUT)
    expect(result).toMatchObject({ error: "LIMIT_REACHED", current: 5, limit: 5 })
    expect(mockPrisma.invoice.create).not.toHaveBeenCalled()
  })

  it("generates sequential invoice number scoped to org", async () => {
    mockPrisma.invoice.count.mockResolvedValue(7)
    await createInvoice(VALID_INPUT)
    const createData = mockPrisma.invoice.create.mock.calls[0][0].data
    expect(createData.invoiceNumber).toBe("INV-008")
  })

  it("includes orgId in the count query for invoice numbering", async () => {
    await createInvoice(VALID_INPUT)
    expect(mockPrisma.invoice.count).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ orgId: ORG_ID }) })
    )
  })

  it("computes subtotal, taxAmount, total correctly", async () => {
    await createInvoice({
      clientId: CLIENT_ID,
      items: [{ description: "Work", quantity: 2, unitPrice: 500, taxRate: 18 }],
    })
    const data = mockPrisma.invoice.create.mock.calls[0][0].data
    expect(Number(data.subtotal)).toBe(1000)
    expect(Number(data.taxAmount)).toBeCloseTo(180)
    expect(Number(data.total)).toBeCloseTo(1180)
    expect(Number(data.amountDue)).toBeCloseTo(1180)
  })

  it("defaults currency to INR", async () => {
    await createInvoice(VALID_INPUT)
    expect(mockPrisma.invoice.create.mock.calls[0][0].data.currency).toBe("INR")
  })

  it("uses provided currency when specified", async () => {
    await createInvoice({ ...VALID_INPUT, currency: "USD" })
    expect(mockPrisma.invoice.create.mock.calls[0][0].data.currency).toBe("USD")
  })

  it("sets autoFollowUp=true for pro orgs by default", async () => {
    mockPrisma.organization.findUnique.mockResolvedValue({ plan: "pro" })
    await createInvoice(VALID_INPUT)
    expect(mockPrisma.invoice.create.mock.calls[0][0].data.autoFollowUp).toBe(true)
  })

  it("sets autoFollowUp=false for free orgs by default", async () => {
    await createInvoice(VALID_INPUT) // plan: "free" in beforeEach
    expect(mockPrisma.invoice.create.mock.calls[0][0].data.autoFollowUp).toBe(false)
  })

  it("respects explicit autoFollowUp=false override for pro orgs", async () => {
    mockPrisma.organization.findUnique.mockResolvedValue({ plan: "pro" })
    await createInvoice({ ...VALID_INPUT, autoFollowUp: false })
    expect(mockPrisma.invoice.create.mock.calls[0][0].data.autoFollowUp).toBe(false)
  })

  it("invalidates plan cache after successful create", async () => {
    await createInvoice(VALID_INPUT)
    expect(mockInvalidatePlanCache).toHaveBeenCalledWith(ORG_ID)
  })

  it("returns invoiceId and invoiceNumber on success", async () => {
    const result = await createInvoice(VALID_INPUT)
    expect(result).toMatchObject({ invoiceId: "inv-1", invoiceNumber: "INV-001" })
  })
})

// ── getInvoices ───────────────────────────────────────────────────────────

describe("getInvoices", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSession()
    mockPrisma.invoice.findMany.mockResolvedValue([])
    mockPrisma.invoice.count.mockResolvedValue(0)
  })

  it("always scopes findMany with orgId from session", async () => {
    await getInvoices()
    expect(mockPrisma.invoice.findMany.mock.calls[0][0].where.orgId).toBe(ORG_ID)
  })

  it("always scopes count with orgId from session", async () => {
    await getInvoices()
    expect(mockPrisma.invoice.count.mock.calls[0][0].where.orgId).toBe(ORG_ID)
  })

  it("redirects to /login when no session", async () => {
    mockNoSession()
    await expect(getInvoices()).rejects.toThrow("REDIRECT:/login")
  })

  it("applies status filter alongside orgId", async () => {
    await getInvoices({ status: "PAID" })
    const where = mockPrisma.invoice.findMany.mock.calls[0][0].where
    expect(where.orgId).toBe(ORG_ID)
    expect(where.status).toBe("PAID")
  })

  it("status filter cannot override orgId", async () => {
    await getInvoices({ status: "PAID", clientId: "any" })
    expect(mockPrisma.invoice.findMany.mock.calls[0][0].where.orgId).toBe(ORG_ID)
  })

  it("returns pagination metadata", async () => {
    mockPrisma.invoice.count.mockResolvedValue(25)
    const result = await getInvoices({ page: 2, limit: 10 })
    expect(result).toMatchObject({ page: 2, limit: 10, total: 25 })
  })
})

// ── getInvoice ────────────────────────────────────────────────────────────

describe("getInvoice", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSession()
    mockPrisma.invoice.findUnique.mockResolvedValue(INVOICE_STUB)
  })

  it("queries with both id AND orgId from session", async () => {
    await getInvoice("inv-1")
    const where = mockPrisma.invoice.findUnique.mock.calls[0][0].where
    expect(where.id).toBe("inv-1")
    expect(where.orgId).toBe(ORG_ID)
  })

  it("redirects to /login when no session", async () => {
    mockNoSession()
    await expect(getInvoice("inv-1")).rejects.toThrow("REDIRECT:/login")
  })

  it("returns null when invoice not found in org", async () => {
    mockPrisma.invoice.findUnique.mockResolvedValue(null)
    expect(await getInvoice("inv-999")).toBeNull()
  })
})

// ── updateInvoice ─────────────────────────────────────────────────────────

describe("updateInvoice", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSession()
    mockPrisma.invoice.findUnique.mockResolvedValue(INVOICE_STUB)
    mockPrisma.invoice.update.mockResolvedValue(INVOICE_STUB)
  })

  it("checks ownership before updating — findUnique includes orgId", async () => {
    await updateInvoice("inv-1", { notes: "hello" })
    const where = mockPrisma.invoice.findUnique.mock.calls[0][0].where
    expect(where.orgId).toBe(ORG_ID)
    expect(where.id).toBe("inv-1")
  })

  it("returns { error: 'Not found' } when invoice belongs to another org", async () => {
    mockPrisma.invoice.findUnique.mockResolvedValue(null)
    const result = await updateInvoice("inv-other", { notes: "hack" })
    expect(result).toMatchObject({ error: "Not found" })
    expect(mockPrisma.invoice.update).not.toHaveBeenCalled()
  })

  it("redirects to /login when no session", async () => {
    mockNoSession()
    await expect(updateInvoice("inv-1", {})).rejects.toThrow("REDIRECT:/login")
  })

  it("returns updated invoice on success", async () => {
    const result = await updateInvoice("inv-1", { notes: "updated" })
    expect(result).toHaveProperty("invoice")
  })
})

// ── deleteInvoice ─────────────────────────────────────────────────────────

describe("deleteInvoice", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSession()
    mockPrisma.invoice.findUnique.mockResolvedValue(INVOICE_STUB)
    mockPrisma.invoice.delete.mockResolvedValue(INVOICE_STUB)
  })

  it("checks ownership before deleting", async () => {
    await deleteInvoice("inv-1")
    expect(mockPrisma.invoice.findUnique.mock.calls[0][0].where.orgId).toBe(ORG_ID)
  })

  it("returns { error: 'Not found' } when invoice belongs to another org", async () => {
    mockPrisma.invoice.findUnique.mockResolvedValue(null)
    const result = await deleteInvoice("inv-other")
    expect(result).toMatchObject({ error: "Not found" })
    expect(mockPrisma.invoice.delete).not.toHaveBeenCalled()
  })

  it("returns { success: true } on successful delete", async () => {
    expect(await deleteInvoice("inv-1")).toMatchObject({ success: true })
  })
})

// ── updateInvoiceStatus ───────────────────────────────────────────────────

describe("updateInvoiceStatus", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSession()
    mockPrisma.invoice.findUnique.mockResolvedValue(INVOICE_STUB)
    mockPrisma.invoice.update.mockResolvedValue({ ...INVOICE_STUB, status: "PAID" })
  })

  it("sets amountPaid=total and amountDue=0 when marking PAID", async () => {
    await updateInvoiceStatus("inv-1", "PAID")
    const data = mockPrisma.invoice.update.mock.calls[0][0].data
    expect(data.amountPaid).toEqual(INVOICE_STUB.total)
    expect(data.amountDue).toBe(0)
  })

  it("does not touch payment amounts for non-PAID status changes", async () => {
    await updateInvoiceStatus("inv-1", "OVERDUE")
    const data = mockPrisma.invoice.update.mock.calls[0][0].data
    expect(data.amountPaid).toBeUndefined()
    expect(data.amountDue).toBeUndefined()
  })

  it("checks ownership before updating status", async () => {
    mockPrisma.invoice.findUnique.mockResolvedValue(null)
    const result = await updateInvoiceStatus("inv-other", "PAID")
    expect(result).toMatchObject({ error: "Not found" })
    expect(mockPrisma.invoice.update).not.toHaveBeenCalled()
  })
})

// ── duplicateInvoice ──────────────────────────────────────────────────────

describe("duplicateInvoice", () => {
  const SOURCE = {
    ...INVOICE_STUB,
    items: [{ description: "Item", quantity: 1, unitPrice: 1000, taxRate: 0, taxAmount: 0, discount: 0, total: 1000, sortOrder: 0 }],
    currency: "INR",
    subtotal: 1000,
    taxAmount: 0,
    discountAmount: 0,
    notes: null,
    terms: null,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockSession()
    mockPrisma.invoice.findUnique.mockResolvedValue(SOURCE)
    mockPrisma.invoice.count.mockResolvedValue(5)
    mockPrisma.invoice.create.mockResolvedValue({ ...SOURCE, id: "inv-2", invoiceNumber: "INV-006", status: "DRAFT" })
  })

  it("creates duplicate with DRAFT status", async () => {
    await duplicateInvoice("inv-1")
    expect(mockPrisma.invoice.create.mock.calls[0][0].data.status).toBe("DRAFT")
  })

  it("assigns a new invoice number to the duplicate", async () => {
    await duplicateInvoice("inv-1")
    const data = mockPrisma.invoice.create.mock.calls[0][0].data
    expect(data.invoiceNumber).toBe("INV-006")
    expect(data.invoiceNumber).not.toBe(SOURCE.invoiceNumber)
  })

  it("scopes source lookup to session orgId", async () => {
    await duplicateInvoice("inv-1")
    expect(mockPrisma.invoice.findUnique.mock.calls[0][0].where.orgId).toBe(ORG_ID)
  })

  it("returns { error: 'Not found' } when source not in org", async () => {
    mockPrisma.invoice.findUnique.mockResolvedValue(null)
    expect(await duplicateInvoice("inv-other")).toMatchObject({ error: "Not found" })
  })

  it("sets amountPaid=0 on the duplicate", async () => {
    await duplicateInvoice("inv-1")
    expect(Number(mockPrisma.invoice.create.mock.calls[0][0].data.amountPaid)).toBe(0)
  })
})
