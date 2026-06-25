import { NextRequest, NextResponse } from "next/server"
import Anthropic from "@anthropic-ai/sdk"
import { getOrgId } from "@/lib/session"
import { checkRateLimit } from "@/lib/rate-limit"
import prisma from "@/lib/db"
import { format, subDays, startOfMonth, endOfMonth } from "date-fns"

const client = new Anthropic()

// ── Types ─────────────────────────────────────────────────────────────────────

interface ChatMessage {
  role: "user" | "assistant"
  content: string
}

interface IntentResult {
  intent: "QUERY" | "CREATE" | "DUPLICATE" | "ACTION" | "INSIGHT"
  entities: {
    clientName?: string
    amount?: number
    description?: string
    dueDate?: string
    invoiceId?: string
  }
}

// ── Context fetch ──────────────────────────────────────────────────────────────

async function fetchOrgContext(orgId: string) {
  const now = new Date()
  const monthStart = startOfMonth(now)
  const monthEnd = endOfMonth(now)
  const lastMonthStart = startOfMonth(subDays(monthStart, 1))
  const lastMonthEnd = endOfMonth(subDays(monthStart, 1))

  const [
    org,
    clientCount,
    invoiceCount,
    unpaidInvoices,
    overdueInvoices,
    recentPayments,
    topClients,
    thisMonthInvoices,
    lastMonthInvoices,
    lastInvoice,
  ] = await Promise.all([
    prisma.organization.findUnique({ where: { id: orgId }, select: { currency: true } }),
    prisma.client.count({ where: { orgId, isActive: true } }),
    prisma.invoice.count({ where: { orgId } }),
    prisma.invoice.findMany({
      where: { orgId, status: { in: ["UNPAID", "OVERDUE"] } },
      select: { id: true, invoiceNumber: true, amountDue: true, currency: true, dueDate: true, status: true, client: { select: { name: true } } },
      orderBy: { dueDate: "asc" },
      take: 10,
    }),
    prisma.invoice.findMany({
      where: { orgId, status: "OVERDUE" },
      select: { id: true, invoiceNumber: true, amountDue: true, currency: true, dueDate: true, client: { select: { name: true } } },
      orderBy: { dueDate: "asc" },
      take: 10,
    }),
    prisma.payment.findMany({
      where: { invoice: { orgId } },
      select: { amount: true, currency: true, createdAt: true, invoice: { select: { client: { select: { name: true } } } } },
      orderBy: { createdAt: "desc" },
      take: 3,
    }),
    prisma.client.findMany({
      where: { orgId, isActive: true },
      orderBy: { updatedAt: "desc" },
      take: 5,
      select: { id: true, name: true, email: true },
    }),
    prisma.invoice.aggregate({
      where: { orgId, issueDate: { gte: monthStart, lte: monthEnd }, status: { in: ["UNPAID", "PAID", "OVERDUE"] } },
      _sum: { total: true },
    }),
    prisma.invoice.aggregate({
      where: { orgId, issueDate: { gte: lastMonthStart, lte: lastMonthEnd }, status: { in: ["UNPAID", "PAID", "OVERDUE"] } },
      _sum: { total: true },
    }),
    prisma.invoice.findFirst({
      where: { orgId },
      orderBy: { createdAt: "desc" },
      include: { client: { select: { name: true } } },
    }),
  ])

  function groupByCurrency(items: { amountDue: unknown; currency: string }[]) {
    const m: Record<string, number> = {}
    for (const i of items) {
      const c = i.currency as string
      m[c] = (m[c] ?? 0) + Number(i.amountDue)
    }
    return m
  }

  return {
    clientCount,
    invoiceCount,
    unpaidCount: unpaidInvoices.length,
    overdueCount: overdueInvoices.length,
    unpaidByCurrency: groupByCurrency(unpaidInvoices),
    overdueByCurrency: groupByCurrency(overdueInvoices),
    unpaidInvoices: unpaidInvoices.map((i) => ({
      id: i.id,
      number: i.invoiceNumber,
      client: i.client.name,
      amount: Number(i.amountDue),
      currency: i.currency as string,
      dueDate: i.dueDate ? format(i.dueDate, "d MMM yyyy") : null,
      status: i.status,
    })),
    overdueInvoices: overdueInvoices.map((i) => ({
      id: i.id,
      number: i.invoiceNumber,
      client: i.client.name,
      amount: Number(i.amountDue),
      currency: i.currency as string,
      dueDate: i.dueDate ? format(i.dueDate, "d MMM yyyy") : null,
    })),
    recentPayments: recentPayments.map((p) => ({
      client: p.invoice.client.name,
      amount: Number(p.amount),
      currency: p.currency as string,
      date: format(p.createdAt, "d MMM yyyy"),
    })),
    topClients: topClients.map((c) => ({ id: c.id, name: c.name })),
    thisMonthRevenue: Number(thisMonthInvoices._sum.total ?? 0),
    lastMonthRevenue: Number(lastMonthInvoices._sum.total ?? 0),
    lastClientUsed: lastInvoice?.client?.name ?? null,
    orgCurrency: org?.currency ?? "INR",
    today: format(now, "d MMMM yyyy"),
  }
}

// ── Intent classification ──────────────────────────────────────────────────────

async function classifyIntent(message: string, history: ChatMessage[]): Promise<IntentResult> {
  const recentHistory = history.slice(-4).map((m) => `${m.role}: ${m.content}`).join("\n")

  const msg = await client.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 150,
    system: `Classify this message into one of: QUERY, CREATE, DUPLICATE, ACTION, INSIGHT.
Also extract entities: clientName, amount (number only), description, dueDate (ISO date if possible), invoiceId.
Return JSON only: {"intent":"...","entities":{...}}`,
    messages: [
      { role: "user", content: recentHistory ? `Context:\n${recentHistory}\n\nMessage: ${message}` : message },
    ],
  })

  const text = msg.content[0].type === "text" ? msg.content[0].text : ""
  try {
    const match = text.match(/\{[\s\S]*\}/)
    if (!match) throw new Error()
    return JSON.parse(match[0]) as IntentResult
  } catch {
    return { intent: "QUERY", entities: {} }
  }
}

// ── Route handler ──────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  let orgId: string
  try {
    orgId = await getOrgId()
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const limited = await checkRateLimit(req, "ai", `ai:${orgId}`)
  if (limited) return limited

  let body: { message: string; history: ChatMessage[] }
  try {
    body = await req.json() as { message: string; history: ChatMessage[] }
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }
  const { message, history = [] } = body
  if (!message?.trim()) return NextResponse.json({ error: "Empty message" }, { status: 400 })

  // Org context (DB queries) — retry once on connection drop
  let ctx: Awaited<ReturnType<typeof fetchOrgContext>>
  try {
    ctx = await fetchOrgContext(orgId)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    const isConnErr = /server has closed|connection terminated|connection reset|ECONNRESET|ECONNREFUSED/i.test(msg)
    if (isConnErr) {
      console.warn("[AI Copilot] DB connection drop — retrying once:", msg)
      try {
        ctx = await fetchOrgContext(orgId)
      } catch (retryErr) {
        const retryMsg = retryErr instanceof Error ? retryErr.message : String(retryErr)
        console.error("[AI Copilot] DB retry failed:", retryErr)
        return NextResponse.json({ error: `Database error: ${retryMsg}` }, { status: 503 })
      }
    } else {
      console.error("[AI Copilot] DB error:", err)
      return NextResponse.json({ error: `Database error: ${msg}` }, { status: 503 })
    }
  }

  // Intent classification (Anthropic API)
  let intent: IntentResult
  try {
    intent = await classifyIntent(message, history)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error("[AI Copilot] intent error:", err)
    return NextResponse.json({ error: `AI error: ${msg}` }, { status: 503 })
  }

  // ── ACTION intents — return JSON, no streaming ─────────────────────────────

  if (intent.intent === "CREATE") {
    // Try to find matching client
    let matchedClient: { id: string; name: string } | null = null
    if (intent.entities.clientName) {
      const name = intent.entities.clientName.toLowerCase()
      matchedClient = ctx.topClients.find((c) => c.name.toLowerCase().includes(name) || name.includes(c.name.toLowerCase())) ?? null
    }

    const dueDate = intent.entities.dueDate
      ? intent.entities.dueDate
      : format(new Date(Date.now() + 30 * 86400000), "yyyy-MM-dd")

    return NextResponse.json({
      type: "ACTION",
      action: "CREATE_INVOICE",
      data: {
        clientName: intent.entities.clientName ?? "",
        clientId: matchedClient?.id ?? null,
        amount: intent.entities.amount ?? null,
        description: intent.entities.description ?? "",
        dueDate,
        currency: ctx.orgCurrency,
      },
      message: `Opening invoice form for ${intent.entities.clientName ?? "new client"}${
        intent.entities.amount ? ` · ${ctx.orgCurrency} ${intent.entities.amount.toLocaleString("en-IN")}` : ""
      }${intent.entities.description ? ` · ${intent.entities.description}` : ""}`,
    })
  }

  if (intent.intent === "DUPLICATE") {
    const name = intent.entities.clientName?.toLowerCase()
    const match = ctx.unpaidInvoices.find((i) => name && i.client.toLowerCase().includes(name))
      ?? ctx.overdueInvoices.find((i) => name && i.client.toLowerCase().includes(name))

    if (match) {
      return NextResponse.json({
        type: "ACTION",
        action: "DUPLICATE_INVOICE",
        data: { invoiceId: match.id, clientName: match.client },
        message: `Duplicating ${match.number} for ${match.client} with today's dates`,
      })
    }
    // Fall through to QUERY if we can't find the invoice
  }

  if (intent.intent === "ACTION") {
    // "mark paid", "send reminder" etc — return action for frontend to handle
    if (intent.entities.invoiceId || message.toLowerCase().includes("remind")) {
      return NextResponse.json({
        type: "ACTION",
        action: "SEND_REMINDER",
        data: { overdueCount: ctx.overdueCount, overdueByCurrency: ctx.overdueByCurrency },
        message: `Sending reminders to ${ctx.overdueCount} overdue client${ctx.overdueCount !== 1 ? "s" : ""} · ${Object.entries(ctx.overdueByCurrency).map(([c, a]) => `${c} ${a.toLocaleString()}`).join(", ")} outstanding`,
      })
    }
  }

  // ── QUERY / INSIGHT — stream narrative response ───────────────────────────

  function fmtAmt(amount: number, currency: string) {
    const sym: Record<string, string> = { INR: "₹", USD: "$", EUR: "€", GBP: "£", AUD: "A$", CAD: "C$", SGD: "S$" }
    const prefix = sym[currency] ?? `${currency} `
    return `${prefix}${amount.toLocaleString("en-IN")}`
  }
  function fmtByCurrency(byCurrency: Record<string, number>) {
    const entries = Object.entries(byCurrency)
    if (entries.length === 0) return "₹0"
    return entries.map(([c, a]) => fmtAmt(a, c)).join(" + ")
  }

  const contextSummary = `
Org data as of ${ctx.today}:
- Clients: ${ctx.clientCount}
- Total invoices: ${ctx.invoiceCount}
- Unpaid invoices: ${ctx.unpaidCount} totalling ${fmtByCurrency(ctx.unpaidByCurrency)}
- Overdue invoices: ${ctx.overdueCount} totalling ${fmtByCurrency(ctx.overdueByCurrency)}
- This month revenue: ${fmtAmt(ctx.thisMonthRevenue, ctx.orgCurrency)}
- Last month revenue: ${fmtAmt(ctx.lastMonthRevenue, ctx.orgCurrency)}
- Recent payments: ${ctx.recentPayments.map((p) => `${p.client} paid ${fmtAmt(p.amount, p.currency)} on ${p.date}`).join("; ") || "none"}
- Overdue invoices detail: ${ctx.overdueInvoices.map((i) => `${i.client} owes ${fmtAmt(i.amount, i.currency)} (due ${i.dueDate ?? "unknown"})`).join("; ") || "none"}
- Unpaid invoices detail: ${ctx.unpaidInvoices.map((i) => `${i.client} ${fmtAmt(i.amount, i.currency)} ${i.status}`).join("; ") || "none"}
`.trim()

  const messages: Anthropic.MessageParam[] = [
    ...history.slice(-8).map((m) => ({ role: m.role, content: m.content })),
    { role: "user", content: message },
  ]

  const stream = client.messages.stream({
    model: "claude-haiku-4-5",
    max_tokens: 600,
    system: `You are BillingBee AI Copilot — a sharp, friendly AI CFO for freelancers.
${contextSummary}
Rules: be concise, direct, always use the correct currency symbol from the context data (₹ for INR, $ for USD, etc). Use bullet points for lists. Never make up data not in context. Today: ${ctx.today}.`,
    messages,
  })

  const encoder = new TextEncoder()
  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          if (chunk.type === "content_block_delta" && chunk.delta.type === "text_delta") {
            controller.enqueue(encoder.encode(chunk.delta.text))
          }
        }
      } catch (err) {
        console.error("[AI Copilot] stream error:", err)
      } finally {
        controller.close()
      }
    },
    cancel() {
      stream.controller.abort()
    },
  })

  return new Response(readable, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "X-Intent": intent.intent },
  })
}
