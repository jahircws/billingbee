import { describe, it, expect, vi, beforeEach } from "vitest"

// next-auth must be mocked before anything that imports it
vi.mock("next-auth", () => ({
  default: vi.fn(),
  AuthError: class AuthError extends Error {
    constructor(msg?: string) { super(msg ?? "AuthError"); this.name = "AuthError" }
  },
}))

// ── Hoist all mocked values ────────────────────────────────────────────────

const { mockSignIn, mockSignOut, mockPrisma, mockHash } = vi.hoisted(() => {
  const mockSignIn = vi.fn()
  const mockSignOut = vi.fn()
  const mockPrisma = {
    user: { findUnique: vi.fn(), create: vi.fn() },
    organization: { findUnique: vi.fn(), create: vi.fn() },
    orgUser: { create: vi.fn() },
    $transaction: vi.fn(),
  }
  const mockHash = vi.fn().mockResolvedValue("hashed-password")
  return { mockSignIn, mockSignOut, mockPrisma, mockHash }
})

vi.mock("@/auth", () => ({ signIn: mockSignIn, signOut: mockSignOut }))
vi.mock("@/lib/db", () => ({ default: mockPrisma }))
vi.mock("bcryptjs", () => ({ hash: mockHash, compare: vi.fn() }))
vi.mock("isomorphic-dompurify", () => ({ default: { sanitize: (s: string) => s } }))

// ── Import under test ──────────────────────────────────────────────────────
import { registerOrg, loginStaff, loginClient, logout } from "@/app/actions/auth"
import { AuthError } from "next-auth"

// ── Helpers ────────────────────────────────────────────────────────────────

function makeFormData(data: Record<string, string>): FormData {
  const fd = new FormData()
  for (const [k, v] of Object.entries(data)) fd.append(k, v)
  return fd
}

const VALID = {
  orgName: "Acme Inc",
  email: "admin@acme.com",
  password: "secret123",
  confirmPassword: "secret123",
  name: "Alice",
}

// ── registerOrg ────────────────────────────────────────────────────────────

describe("registerOrg", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockPrisma.user.findUnique.mockResolvedValue(null)
    mockPrisma.organization.findUnique.mockResolvedValue(null)
    mockPrisma.$transaction.mockImplementation(async (fn: (tx: typeof mockPrisma) => Promise<void>) => fn(mockPrisma))
    mockPrisma.organization.create.mockResolvedValue({ id: "org-1", name: "Acme Inc", slug: "acme-inc" })
    mockPrisma.user.create.mockResolvedValue({ id: "user-1" })
    mockPrisma.orgUser.create.mockResolvedValue({})
  })

  it("returns error when required fields are missing", async () => {
    const result = await registerOrg(null, makeFormData({ ...VALID, orgName: "" }))
    expect(result).toMatchObject({ error: "Missing required fields" })
  })

  it("returns error when password < 8 characters", async () => {
    const result = await registerOrg(null, makeFormData({ ...VALID, password: "short", confirmPassword: "short" }))
    expect(result).toMatchObject({ error: "Password must be at least 8 characters" })
  })

  it("returns error when passwords do not match", async () => {
    const result = await registerOrg(null, makeFormData({ ...VALID, confirmPassword: "different1" }))
    expect(result).toMatchObject({ error: "Passwords do not match" })
  })

  it("returns error when email is already in use", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ id: "existing" })
    const result = await registerOrg(null, makeFormData(VALID))
    expect(result).toMatchObject({ error: "Email already in use" })
  })

  it("returns error when org slug is already taken", async () => {
    mockPrisma.organization.findUnique.mockResolvedValue({ id: "existing-org" })
    const result = await registerOrg(null, makeFormData(VALID))
    expect(result).toMatchObject({ error: "Slug already taken" })
  })

  it("creates org, user, and orgUser inside a transaction", async () => {
    await expect(registerOrg(null, makeFormData(VALID))).rejects.toThrow("REDIRECT:/login")
    expect(mockPrisma.$transaction).toHaveBeenCalledOnce()
    expect(mockPrisma.organization.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ name: "Acme Inc" }) })
    )
    expect(mockPrisma.user.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ email: "admin@acme.com" }) })
    )
  })

  it("creates orgUser with OWNER role", async () => {
    await expect(registerOrg(null, makeFormData(VALID))).rejects.toThrow("REDIRECT:/login")
    expect(mockPrisma.orgUser.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ role: "OWNER" }) })
    )
  })

  it("derives slug from orgName — lowercase with hyphens", async () => {
    await expect(registerOrg(null, makeFormData({ ...VALID, orgName: "My Cool Company!" })))
      .rejects.toThrow("REDIRECT:/login")
    expect(mockPrisma.organization.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ slug: "my-cool-company" }) })
    )
  })

  it("hashes the password — never stores plaintext", async () => {
    await expect(registerOrg(null, makeFormData(VALID))).rejects.toThrow("REDIRECT:/login")
    expect(mockHash).toHaveBeenCalledWith("secret123", 12)
    const userData = mockPrisma.user.create.mock.calls[0][0].data
    expect(userData.passwordHash).toBe("hashed-password")
    expect(userData).not.toHaveProperty("password")
  })

  it("redirects to /login on success", async () => {
    await expect(registerOrg(null, makeFormData(VALID))).rejects.toThrow("REDIRECT:/login")
  })

  it("returns user-friendly error on unexpected DB failure — no stack traces", async () => {
    mockPrisma.$transaction.mockRejectedValue(new Error("connection refused at pg:5432"))
    const result = await registerOrg(null, makeFormData(VALID)) as { error: string }
    expect(result.error).toBe("Registration failed. Please try again.")
    expect(result.error).not.toContain("connection refused")
    expect(result.error).not.toContain("pg:")
  })
})

// ── loginStaff ─────────────────────────────────────────────────────────────

describe("loginStaff", () => {
  beforeEach(() => vi.clearAllMocks())

  it("calls signIn with 'staff' provider", async () => {
    mockSignIn.mockResolvedValue(undefined)
    await loginStaff(null, makeFormData({ email: "admin@acme.com", password: "pass123" }))
    expect(mockSignIn).toHaveBeenCalledWith("staff", expect.objectContaining({ email: "admin@acme.com" }))
  })

  it("passes redirectTo: /dashboard", async () => {
    mockSignIn.mockResolvedValue(undefined)
    await loginStaff(null, makeFormData({ email: "a@b.com", password: "pass123" }))
    expect(mockSignIn).toHaveBeenCalledWith("staff", expect.objectContaining({ redirectTo: "/dashboard" }))
  })

  it("returns { error: 'Invalid email or password' } on AuthError", async () => {
    mockSignIn.mockRejectedValue(new AuthError("CredentialsSignin"))
    const result = await loginStaff(null, makeFormData({ email: "wrong@x.com", password: "bad" }))
    expect(result).toMatchObject({ error: "Invalid email or password" })
  })

  it("does not leak internal AuthError message to caller", async () => {
    mockSignIn.mockRejectedValue(new AuthError("DB connection failed — pg:5432"))
    const result = await loginStaff(null, makeFormData({ email: "a@b.com", password: "p" })) as { error: string }
    expect(result.error).toBe("Invalid email or password")
    expect(result.error).not.toContain("DB connection")
  })

  it("re-throws non-AuthError exceptions", async () => {
    mockSignIn.mockRejectedValue(new Error("fetch failed"))
    await expect(loginStaff(null, makeFormData({ email: "a@b.com", password: "p" }))).rejects.toThrow("fetch failed")
  })

  it("lowercases the email before calling signIn", async () => {
    mockSignIn.mockResolvedValue(undefined)
    await loginStaff(null, makeFormData({ email: "Admin@ACME.COM", password: "pass123" }))
    expect(mockSignIn).toHaveBeenCalledWith("staff", expect.objectContaining({ email: "admin@acme.com" }))
  })
})

// ── loginClient ────────────────────────────────────────────────────────────

describe("loginClient", () => {
  beforeEach(() => vi.clearAllMocks())

  it("calls signIn with 'client' provider and token", async () => {
    mockSignIn.mockResolvedValue(undefined)
    await loginClient(null, makeFormData({ token: "tok-abc123" }))
    expect(mockSignIn).toHaveBeenCalledWith("client", expect.objectContaining({ token: "tok-abc123" }))
  })

  it("returns user-friendly error on invalid token", async () => {
    mockSignIn.mockRejectedValue(new AuthError("TokenExpired"))
    const result = await loginClient(null, makeFormData({ token: "expired" }))
    expect(result).toMatchObject({ error: "Invalid or expired access link" })
  })
})

// ── logout ─────────────────────────────────────────────────────────────────

describe("logout", () => {
  it("calls signOut redirecting to /", async () => {
    mockSignOut.mockResolvedValue(undefined)
    await logout()
    expect(mockSignOut).toHaveBeenCalledWith({ redirectTo: "/" })
  })
})
