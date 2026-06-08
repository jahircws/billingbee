/**
 * BillingBee v2.0 — k6 Load Test
 *
 * Usage:
 *   k6 run scripts/load-test.js
 *   k6 run --env BASE_URL=https://app-v2.billingbee.co scripts/load-test.js
 *   k6 run --env BASE_URL=http://localhost:3000 scripts/load-test.js
 *
 * Install k6: https://k6.io/docs/get-started/installation/
 *   macOS: brew install k6
 */

import http from "k6/http"
import { check, sleep } from "k6"
import { Rate, Trend } from "k6/metrics"

// ── Config ───────────���────────────────────────────────────────────────────────

const BASE_URL = __ENV.BASE_URL || "https://app-v2.billingbee.co"

// Authenticated session cookie — set via env var for dashboard/invoice scenarios
// export BB_SESSION_COOKIE="next-auth.session-token=..."
const SESSION_COOKIE = __ENV.BB_SESSION_COOKIE || ""

// ── Custom metrics ───────────���─────────────────────────���──────────────────────

const generateErrors = new Rate("generate_errors")
const dashboardErrors = new Rate("dashboard_errors")
const aiErrors = new Rate("ai_errors")

const generateDuration = new Trend("generate_duration", true)
const dashboardDuration = new Trend("dashboard_duration", true)

// ── Options ────────────────────���──────────────────────────────────────────────

export const options = {
  scenarios: {
    // 30% — anonymous /generate (SEO landing, edge-cached)
    generate_anon: {
      executor: "constant-vus",
      vus: 60,
      duration: "5m",
      exec: "scenarioGenerate",
    },
    // 20% — AI suggest endpoint
    ai_suggest: {
      executor: "constant-vus",
      vus: 40,
      duration: "5m",
      exec: "scenarioSuggest",
    },
    // 20% — authenticated dashboard
    dashboard_auth: {
      executor: "constant-vus",
      vus: 40,
      duration: "5m",
      exec: "scenarioDashboard",
    },
    // 20% — createInvoice server action
    create_invoice: {
      executor: "constant-vus",
      vus: 40,
      duration: "5m",
      exec: "scenarioCreateInvoice",
    },
    // 10% — AI copilot
    ai_copilot: {
      executor: "constant-vus",
      vus: 20,
      duration: "5m",
      exec: "scenarioCopilot",
    },
  },

  thresholds: {
    // Overall: p95 response time < 3s
    http_req_duration: ["p(95)<3000"],
    // Error rate < 1%
    http_req_failed: ["rate<0.01"],
    // Per-scenario error rates
    generate_errors: ["rate<0.01"],
    dashboard_errors: ["rate<0.01"],
    ai_errors: ["rate<0.05"],
    // Specific page targets
    generate_duration: ["p(95)<800"],
    dashboard_duration: ["p(95)<1500"],
  },
}

// ── Helpers ─────────���─────────────────────────────────────────────────────────

function authHeaders() {
  return SESSION_COOKIE
    ? { Cookie: SESSION_COOKIE, "Content-Type": "application/json" }
    : { "Content-Type": "application/json" }
}

function anonHeaders() {
  return { Accept: "text/html,application/json" }
}

// ── Scenarios ──────────────────────────────────��──────────────────────────────

/** 30% — GET /generate (anonymous, edge-cached) */
export function scenarioGenerate() {
  const start = Date.now()
  const res = http.get(`${BASE_URL}/generate`, { headers: anonHeaders(), tags: { name: "generate" } })
  generateDuration.add(Date.now() - start)

  const ok = check(res, {
    "generate: status 200": (r) => r.status === 200,
    "generate: body not empty": (r) => r.body !== null && r.body.length > 100,
  })
  generateErrors.add(!ok)
  sleep(Math.random() * 2 + 1) // 1–3s think time
}

/** 20% — POST /api/generate/suggest */
export function scenarioSuggest() {
  const payload = JSON.stringify({
    field: "description",
    context: {
      docType: "invoice",
      fromName: "Acme Consulting",
      toName: "Beta Corp",
      projectTitle: "Website redesign",
    },
  })

  const res = http.post(`${BASE_URL}/api/generate/suggest`, payload, {
    headers: { "Content-Type": "application/json" },
    tags: { name: "suggest" },
  })

  check(res, {
    "suggest: status 200 or 429": (r) => r.status === 200 || r.status === 429,
    "suggest: has suggestions or error": (r) => {
      if (r.status === 429) return true
      try {
        const body = JSON.parse(r.body)
        return Array.isArray(body.suggestions) || typeof body.error === "string"
      } catch {
        return false
      }
    },
  })
  sleep(Math.random() * 3 + 2)
}

/** 20% — GET /dashboard (authenticated) */
export function scenarioDashboard() {
  if (!SESSION_COOKIE) {
    // Without a real session, just verify redirect behavior
    const res = http.get(`${BASE_URL}/dashboard`, {
      headers: anonHeaders(),
      redirects: 0,
      tags: { name: "dashboard" },
    })
    check(res, {
      "dashboard: redirects to login when unauth": (r) => r.status === 307 || r.status === 302,
    })
    sleep(1)
    return
  }

  const start = Date.now()
  const res = http.get(`${BASE_URL}/dashboard`, {
    headers: authHeaders(),
    tags: { name: "dashboard" },
  })
  dashboardDuration.add(Date.now() - start)

  const ok = check(res, {
    "dashboard: status 200": (r) => r.status === 200,
    "dashboard: contains Dashboard heading": (r) => r.body.includes("Dashboard") || r.body.includes("dashboard"),
  })
  dashboardErrors.add(!ok)
  sleep(Math.random() * 4 + 2)
}

/** 20% — POST createInvoice action */
export function scenarioCreateInvoice() {
  if (!SESSION_COOKIE) {
    sleep(1)
    return
  }

  // Next.js server action call
  const payload = JSON.stringify({
    clientId: "dummy-client-id",
    currency: "INR",
    items: [
      { description: "Load test service", quantity: 1, unitPrice: 1000, taxRate: 18 },
    ],
  })

  const res = http.post(`${BASE_URL}/invoices/new`, payload, {
    headers: { ...authHeaders(), "Next-Action": "createInvoice" },
    tags: { name: "create_invoice" },
  })

  check(res, {
    "createInvoice: not 500": (r) => r.status !== 500,
  })
  sleep(Math.random() * 5 + 3)
}

/** 10% — POST /api/ai/copilot */
export function scenarioCopilot() {
  if (!SESSION_COOKIE) {
    sleep(1)
    return
  }

  const payload = JSON.stringify({
    messages: [{ role: "user", content: "What is my revenue this month?" }],
  })

  const res = http.post(`${BASE_URL}/api/ai/copilot`, payload, {
    headers: authHeaders(),
    timeout: "10s",
    tags: { name: "copilot" },
  })

  const ok = check(res, {
    "copilot: not 500": (r) => r.status !== 500,
    "copilot: responds within 10s": (r) => r.timings.duration < 10000,
  })
  aiErrors.add(!ok)
  sleep(Math.random() * 6 + 4)
}
