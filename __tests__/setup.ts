import { vi } from "vitest"

// Silence Next.js redirect throws in tests (redirect() throws internally)
vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => { throw new Error(`REDIRECT:${url}`) }),
  notFound: vi.fn(() => { throw new Error("NOT_FOUND") }),
}))

// Mock next-auth signIn / signOut
vi.mock("next-auth/react", () => ({
  signIn: vi.fn(),
  signOut: vi.fn(),
}))
