"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { ArrowLeft, ArrowRight, Loader2, ExternalLink } from "lucide-react"

interface NameResult {
  name: string
  tagline: string
}

const INDUSTRIES = ["Tech", "Design", "Finance", "Marketing", "Legal", "Consulting", "Other"]
const STYLES = ["Modern", "Professional", "Catchy", "Indian Feel"]
const LENGTHS = ["Short (1 word)", "Medium (2 words)", "Any"]

function PillSelector<T extends string>({
  options,
  value,
  onChange,
}: {
  options: T[]
  value: T
  onChange: (v: T) => void
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
            value === opt
              ? "bg-emerald-500 text-white border-emerald-500"
              : "bg-white text-slate-600 border-slate-200 hover:border-emerald-300"
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  )
}

export default function StartupNameGeneratorClient() {
  const [description, setDescription] = useState("")
  const [industry, setIndustry] = useState<string>("Tech")
  const [style, setStyle] = useState<string>("Modern")
  const [length, setLength] = useState<string>("Any")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [names, setNames] = useState<NameResult[] | null>(null)

  async function generate() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/tools/startup-names", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description, industry, style, length }),
      })
      const data = await res.json()
      if (res.status === 429) {
        setError("rate_limited")
        return
      }
      if (!res.ok || data.error) {
        setError(data.error ?? "Something went wrong. Please try again.")
        return
      }
      setNames(data.names)
    } catch {
      setError("Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center">
            <Image src="/logo.png" alt="BillingBee" width={140} height={28} className="brightness-0" />
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
              Sign in
            </Link>
            <Link
              href="/register"
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-all active:scale-95"
            >
              Try free →
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-10">
        <Link href="/tools" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 mb-6">
          <ArrowLeft className="w-4 h-4" />
          All tools
        </Link>

        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">🚀</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
              AI-Powered
            </span>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Startup Name Generator</h1>
          <p className="text-slate-500">Describe your business and get 10 unique name ideas with domain links instantly.</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-6">
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                What does your business do?
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value.slice(0, 200))}
                rows={3}
                placeholder="e.g. I help freelancers manage their invoices and get paid faster"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 resize-none"
              />
              <p className="text-xs text-slate-400 mt-1 text-right">{description.length}/200</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Industry</label>
              <PillSelector options={INDUSTRIES} value={industry} onChange={setIndustry} />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Style</label>
              <PillSelector options={STYLES} value={style} onChange={setStyle} />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Length</label>
              <PillSelector options={LENGTHS} value={length} onChange={setLength} />
            </div>

            {error === "rate_limited" && (
              <p className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2">
                You&apos;ve used this tool too many times. Try again in an hour.
              </p>
            )}
            {error && error !== "rate_limited" && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">{error}</p>
            )}

            <button
              onClick={generate}
              disabled={loading || description.length < 10}
              className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating names...
                </>
              ) : (
                "Generate Names"
              )}
            </button>
          </div>
        </div>

        {names && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-800">Your name ideas</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {names.map((item) => (
                <div key={item.name} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
                  <p className="text-lg font-semibold text-slate-900">{item.name}</p>
                  <p className="text-sm text-slate-500 mt-1 mb-3">{item.tagline}</p>
                  <div className="flex gap-2 mb-3">
                    {[".com", ".co", ".in"].map((ext) => (
                      <a
                        key={ext}
                        href={`https://www.godaddy.com/domainsearch/find?domainToCheck=${item.name}${ext}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border border-slate-200 text-slate-600 hover:border-emerald-400 hover:text-emerald-600 transition-colors"
                      >
                        {ext}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    ))}
                  </div>
                  <Link
                    href="/register"
                    className="block text-center text-xs text-emerald-600 hover:text-emerald-700 font-medium border border-emerald-200 rounded-lg py-2 hover:bg-emerald-50 transition-colors"
                  >
                    Use this name on your invoice →
                  </Link>
                </div>
              ))}
            </div>

            <button
              onClick={generate}
              disabled={loading}
              className="w-full mt-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Regenerate
            </button>
          </div>
        )}

        <div className="mt-10 bg-white rounded-xl border border-slate-200 shadow-sm p-6 text-center">
          <h2 className="text-lg font-bold text-slate-900 mb-2">Ready to send professional invoices?</h2>
          <p className="text-sm text-slate-500 mb-4">
            BillingBee helps you invoice clients, track payments, and get paid faster — all with AI.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg px-5 py-2.5 text-sm font-medium transition-colors"
          >
            Create your free account
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </main>
    </div>
  )
}
