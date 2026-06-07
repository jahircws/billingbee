import { describe, it, expect, vi, beforeEach } from "vitest"

// ── Mock auth before importing session ────────────────────────────────────

const { mockAuth } = vi.hoisted(() => ({ mockAuth: vi.fn() }))
vi.mock("@/auth", () => ({ auth: mockAuth }))

import { getSession, getOrgId, getClientSession } from "@/lib/session"

// ── Helpers ────────────────────────────────────────────────────────────────

const STAFF_SESSION = {
  user: {
    userId: "user-1",
    orgId: "org-abc",
    orgName: "Acme Inc",
    role: "OWNER",
    userType: "STAFF" as const,
  },
  expires: "2099-01-01",
}

const CLIENT_SESSION = {
  user: {
    clientId: "client-1",
    orgId: "org-abc",
    userType: "CLIENT" as const,
  },
  expires: "2099-01-01",
}

// ── getSession ─────────────────────────────────────────────────────────────

describe("getSession", () => {
  beforeEach(() => vi.clearAllMocks())

  it("returns the full session object", async () => {
    mockAuth.mockResolvedValue(STAFF_SESSION)
    const session = await getSession()
    expect(session).toEqual(STAFF_SESSION)
  })

  it("returns null when no session exists", async () => {
    mockAuth.mockResolvedValue(null)
    const session = await getSession()
    expect(session).toBeNull()
  })

  it("passes through the session without modification", async () => {
    mockAuth.mockResolvedValue(STAFF_SESSION)
    const session = await getSession()
    expect(session?.user?.orgId).toBe("org-abc")
    expect(session?.user?.userType).toBe("STAFF")
  })
})

// ── getOrgId ───────────────────────────────────────────────────────────────

describe("getOrgId", () => {
  beforeEach(() => vi.clearAllMocks())

  it("returns orgId from staff session", async () => {
    mockAuth.mockResolvedValue(STAFF_SESSION)
    const orgId = await getOrgId()
    expect(orgId).toBe("org-abc")
  })

  it("returns orgId from client session", async () => {
    mockAuth.mockResolvedValue(CLIENT_SESSION)
    const orgId = await getOrgId()
    expect(orgId).toBe("org-abc")
  })

  it("throws a clear error when session is null", async () => {
    mockAuth.mockResolvedValue(null)
    await expect(getOrgId()).rejects.toThrow("No orgId in session")
  })

  it("throws a clear error when session has no orgId", async () => {
    mockAuth.mockResolvedValue({ user: { userId: "user-1" }, expires: "2099" })
    await expect(getOrgId()).rejects.toThrow("No orgId in session")
  })

  it("throws Error instance (not string), so callers can instanceof-check", async () => {
    mockAuth.mockResolvedValue(null)
    const err = await getOrgId().catch((e) => e)
    expect(err).toBeInstanceOf(Error)
  })
})

// ── getClientSession ───────────────────────────────────────────────────────

describe("getClientSession", () => {
  beforeEach(() => vi.clearAllMocks())

  it("returns clientId and orgId for a valid client session", async () => {
    mockAuth.mockResolvedValue(CLIENT_SESSION)
    const result = await getClientSession()
    expect(result).toEqual({ clientId: "client-1", orgId: "org-abc" })
  })

  it("throws clear error when session is null", async () => {
    mockAuth.mockResolvedValue(null)
    await expect(getClientSession()).rejects.toThrow("No client session")
  })

  it("throws clear error when clientId is missing", async () => {
    mockAuth.mockResolvedValue({
      user: { orgId: "org-abc", userType: "CLIENT" },
      expires: "2099",
    })
    await expect(getClientSession()).rejects.toThrow("No client session")
  })

  it("throws clear error when orgId is missing", async () => {
    mockAuth.mockResolvedValue({
      user: { clientId: "client-1", userType: "CLIENT" },
      expires: "2099",
    })
    await expect(getClientSession()).rejects.toThrow("No client session")
  })

  it("rejects staff session — staff has no clientId", async () => {
    mockAuth.mockResolvedValue(STAFF_SESSION)
    await expect(getClientSession()).rejects.toThrow("No client session")
  })
})

// ── Security: session isolation ────────────────────────────────────────────

describe("session isolation invariants", () => {
  it("getOrgId never returns orgId from a different concurrent session", async () => {
    // Simulate two concurrent calls with different sessions
    let callCount = 0
    mockAuth.mockImplementation(async () => {
      callCount++
      if (callCount === 1) return { user: { orgId: "org-A" }, expires: "2099" }
      return { user: { orgId: "org-B" }, expires: "2099" }
    })

    const [orgA, orgB] = await Promise.all([getOrgId(), getOrgId()])
    expect(orgA).toBe("org-A")
    expect(orgB).toBe("org-B")
    expect(orgA).not.toBe(orgB)
  })
})
