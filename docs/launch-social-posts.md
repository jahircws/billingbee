# BillingBee v2.0 — Launch Day Social Posts

> ⚠️ DO NOT POST YET — drafts only.  
> Schedule for launch day after staging smoke tests pass.

---

## Twitter / X Thread

Post as @billingbeeapp (or @amitshuklain if personal account)

**Tweet 1/5** *(pin this)*
```
BillingBee v2 is live. 🐝

Upload a WhatsApp screenshot → instant invoice.
AI chases late payments automatically.
Create invoices by typing naturally.

Free at billingbee.co/generate — no signup needed.

🧵 Here's what we built:
```

**Tweet 2/5**
```
The feature I'm most proud of:

AI Collections Agent.

Invoice overdue? AI emails on Day 1, Day 7, Day 15, Day 45…

Changes tone over time. Starts gentle, gets firmer.
Never rude. Never forgets.

Freelancers spend 0 minutes chasing payments. 🏆
```

**Tweet 3/5**
```
The generator page is insane.

Upload a WhatsApp chat → AI reads the conversation → builds a draft invoice.

Or just type:
"Invoice TechCorp ₹50,000 for website development, due Dec 31"

That's it. GST-ready PDF in 8 seconds.
```

**Tweet 4/5**
```
Built with @AnthropicAI claude-haiku-4-5.
@NVIDIAInception member.

Stack:
→ Next.js 15 App Router
→ Prisma + Postgres
→ Resend for email
→ Razorpay + Stripe
→ Upstash Redis

6 months of evenings and weekends. 💀

#buildinpublic #indiedev #saas
```

**Tweet 5/5**
```
For Indian freelancers specifically:

✅ GST invoice with CGST/SGST split
✅ Razorpay UPI in every invoice
✅ INR formatting
✅ Quarterly GST export for your CA
✅ GSTIN validation

Not a generic invoicing tool.
Built for India. 🇮🇳

Try it free → billingbee.co/generate
```

---

## ProductHunt Listing

**Tagline** *(60 chars max)*
```
AI invoicing for Indian freelancers — get paid faster
```

**Description** *(260 chars max, for listing card)*
```
Upload a WhatsApp screenshot → instant GST invoice. Or just type: "Invoice Acme ₹25,000 for design." AI chases late payments automatically. Razorpay + Stripe built in. Free to start.
```

**Full description** *(for listing body)*

---

BillingBee v2 is a complete rebuild of our AI-powered invoicing tool for Indian freelancers and small businesses.

**The problem we're solving:**

Indian freelancers spend hours every week on admin: creating invoices, calculating GST, chasing late payments, sending follow-up emails. Most invoicing tools are built for the US market and don't understand Indian tax rules, UPI payments, or the way freelancers actually work here.

**What BillingBee does:**

🤖 **Natural language invoice creation**
Just say "Invoice Acme Corp ₹25,000 for logo design, due in 15 days." AI extracts the client, amount, GST rate, and due date — and creates a professional PDF.

📱 **WhatsApp → Invoice**
Upload a screenshot of a client conversation. AI reads it, extracts the project scope and amount, and drafts an invoice. Takes 10 seconds.

🔔 **AI Collections Agent**
Invoice overdue? The AI sends polite, escalating follow-up emails at Day 1, 7, 15, 45. Changes tone over time. You never have to chase a client manually again.

💳 **Razorpay + Stripe in every invoice**
Every invoice has a payment link. Clients pay via UPI, debit/credit card, or net banking. You get notified instantly.

🇮🇳 **Built for India, not adapted for India**
- GST-compliant with CGST/SGST split
- GSTIN validation and HSN/SAC codes
- INR formatting
- Quarterly GST export for your CA
- Razorpay UPI built in (not bolted on)

**What's free:**
- 5 invoices/month
- PDF download
- GST calculations
- No credit card required

**Pro (₹999/month):**
- Unlimited invoices
- AI Collections Agent
- Payment links
- Client portal
- Cashflow forecasting

---

**Makers:** Amit Shukla (founder & solo dev)  
**Launched:** June 2026  
**NVIDIA Inception member**

---

## IndieHackers Post

**Title:**
```
I rebuilt BillingBee from scratch in 3 months — here's everything I changed (and why the first version failed)
```

**Body:**

---

Six months ago I launched BillingBee. It was bad.

I had "AI invoicing" on the pricing page but the AI barely worked. The UI was frustrating. Mobile was broken. The GST calculations had bugs. 

I had 695 users who'd verified their email. About 4,230 more who'd signed up but gone inactive. And I'd made a promise to all of them that the product didn't keep.

So I made a decision: shut down the old version. Rebuild from scratch. Do it properly.

Here's what I learned and what I changed.

---

**The core mistake: I built for the wrong user**

The first version tried to be a generic invoicing tool. But India has completely different requirements:
- Razorpay and UPI (not just Stripe)
- GST with CGST/SGST split
- WhatsApp is where project conversations happen (not email)
- Freelancers chase payments manually via WhatsApp (it's embarrassing and exhausting)

Version 2 is built specifically for Indian freelancers. Nothing is bolted on.

---

**The 5 things I rebuilt:**

**1. The AI actually works now**

v1's "AI" was basically a form with a fancy label. 

v2 uses Claude (Haiku) and you just type: *"Invoice TechCorp ₹50,000 for website development, due in 15 days."* It extracts client, amount, GST, due date. Creates a PDF. In 8 seconds.

Or you can upload a WhatsApp screenshot of the project conversation. AI reads it and drafts the invoice.

**2. Collections Agent**

This is the thing I'm most proud of. 

When an invoice goes overdue, an AI agent sends follow-up emails on Day 1, 7, 15, 45. The tone starts gentle and gets firmer over time. Never rude, never forgets.

Freelancers I've tested this with report 0 minutes spent chasing payments. The AI handles it completely.

**3. Razorpay is first-class**

v1 had Stripe only. Big mistake for India.

Every invoice now has a Razorpay payment link. Clients can pay via UPI, cards, net banking. The link is in the PDF and in the email.

**4. Mobile-first**

I wrote v1 desktop-first and did a half-hearted mobile pass at the end. The result was unusable.

v2 was designed on a 390px frame first. The entire core flow — create invoice, send, track payment — works one-handed on a phone.

**5. Proper GST**

v1's GST was wrong in subtle ways. v2 calculates CGST/SGST correctly based on state. Generates quarterly exports for your CA. Has proper GSTIN validation.

---

**The rebuild process:**

- 3 months of evenings and weekends
- Solo (I'm the only dev)
- ~18 sessions of 4-6 hours each
- Tech: Next.js 15, Prisma, Postgres, Claude API, Resend, Razorpay, Stripe, Upstash Redis
- Joined NVIDIA Inception during the build

---

**The relaunch plan:**

I'm writing this the day before I send the relaunch email to 695 verified users. They get 3 months Pro free as an apology for the wait. Then I'll email the inactive segment (60 days free). Then the unverified cold list (no account needed CTA).

Terrified. Excited.

---

**Lessons:**

1. "AI" as a feature is meaningless if the AI doesn't actually work
2. Indian-specific payment rails are not optional — Razorpay UPI is table stakes
3. Build for mobile first, not as an afterthought
4. The collections problem is the most painful thing for freelancers — solve that, everything else is secondary
5. Rebuilding from scratch is sometimes the right call

---

Ask me anything about the rebuild, the tech stack, India-specific product decisions, or what it's like to re-launch to a list that's been waiting 6 months.

**→ Try it: billingbee.co/generate (free, no signup needed)**

---

*Building in public. Next milestone: 100 paying users.*

---

## LinkedIn Post

```
We rebuilt BillingBee from scratch.

The old version wasn't good enough.
The AI didn't work. The UI was frustrating. I know.

We spent 3 months rebuilding everything.

What's new in v2:

→ Upload a WhatsApp screenshot → instant GST invoice
→ AI chases late payments automatically  
→ Create invoices by typing naturally
→ Razorpay UPI built in to every invoice
→ Mobile-first design

For Indian freelancers specifically:
✅ GST-compliant with CGST/SGST split
✅ Quarterly export for your CA
✅ GSTIN validation
✅ INR formatting

Free to try at billingbee.co/generate — no signup needed.

If you're a freelancer in India and you spend time on invoicing or chasing payments, I'd love your feedback.

#freelancer #india #invoicing #saas #buildinpublic #startup
```

---

## Hacker News Show HN

**Title:**
```
Show HN: BillingBee – AI invoicing for Indian freelancers (upload WhatsApp chat → invoice)
```

**Body:**
```
Hi HN,

I'm Amit. I rebuilt BillingBee from scratch after the first version didn't deliver on its AI promises.

The core insight: Indian freelancers primarily negotiate projects over WhatsApp, not email. So I built an upload feature — you screenshot the conversation, AI reads it and drafts an invoice. Takes 10 seconds.

Other things that are India-specific:
- Razorpay UPI in every invoice (not just Stripe)
- GST with CGST/SGST calculation
- Quarterly tax export for your CA
- INR formatting

The AI copilot lets you just type "Invoice Acme ₹25,000 for design work" and it fills in client details, amounts, due date.

Collections Agent sends escalating follow-up emails when invoices go overdue. Tone starts gentle, gets firmer. Freelancers stop chasing payments manually.

Free to try (5 invoices/month, no credit card): https://billingbee.co/generate

Happy to answer questions about the tech stack (Next.js 15, Claude API, Prisma, Razorpay) or India-specific product decisions.
```

---

## Send/Post Schedule (DO NOT FOLLOW YET — staging must pass first)

```
Day 0 (today):       Staging smoke tests, QA sign-off
Day 1 (launch):      Segment A email (695 verified) + Twitter thread + HN Show HN
Day 2:               Segment B email (4,230 inactive)
Day 3:               Segment C email (3,899 unverified)
Day 4:               ProductHunt launch (schedule for 12:01 AM PT)
Day 7:               IndieHackers post (after having first week metrics)
Day 14:              LinkedIn post (with first week numbers)
```

---

*Last updated: 2026-06-08 — DO NOT POST until staging verified*
