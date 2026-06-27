"use client"

import { useState, useRef, useCallback } from "react"
import { Upload, X, FileText, Image, Loader2, CheckCircle, AlertCircle, RefreshCw } from "lucide-react"

export interface ExtractionResult {
  clientName: string | null
  clientEmail: string | null
  clientCompany: string | null
  items: { description: string; qty: number; rate: number }[]
  currency: string
  totalAmount: number | null
  taxAmount: number | null
  dueDate: string | null
  paymentTerms: string | null
  notes: string | null
  confidence: "high" | "medium" | "low"
}

interface Props {
  /** /api/generate/extract for anon, /api/ai/extract for authed dashboard */
  endpoint?: string
  onExtracted: (data: ExtractionResult) => void
}

const ACCEPT = "image/*,application/pdf,text/plain,.eml"
const MAX_MB = 10

function fileIcon(type: string) {
  if (type.startsWith("image/")) return <Image size={20} className="text-emerald-600" />
  return <FileText size={20} className="text-emerald-600" />
}

function confidenceBadge(c: "high" | "medium" | "low") {
  const map = {
    high: { label: "High confidence", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    medium: { label: "Medium confidence", cls: "bg-amber-50 text-amber-700 border-amber-200" },
    low: { label: "Low confidence — review fields", cls: "bg-red-50 text-red-700 border-red-200" },
  }
  const { label, cls } = map[c]
  const Icon = c === "high" ? CheckCircle : AlertCircle
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full border ${cls}`}>
      <Icon size={11} />
      {label}
    </span>
  )
}

export default function UploadToInvoice({
  endpoint = "/api/generate/extract",
  onExtracted,
}: Props) {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<ExtractionResult | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  function resetFile() {
    setFile(null)
    setPreview(null)
    setResult(null)
    setError(null)
    if (inputRef.current) inputRef.current.value = ""
  }

  function pickFile(f: File) {
    if (f.size > MAX_MB * 1024 * 1024) {
      setError(`File too large — max ${MAX_MB}MB`)
      return
    }
    setFile(f)
    setResult(null)
    setError(null)
    if (f.type.startsWith("image/")) {
      const url = URL.createObjectURL(f)
      setPreview(url)
    } else {
      setPreview(null)
    }
  }

  function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (f) pickFile(f)
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const f = e.dataTransfer.files?.[0]
    if (f) pickFile(f)
  }, [])

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(true)
  }, [])

  const onDragLeave = useCallback(() => setDragging(false), [])

  async function handleExtract() {
    if (!file) return
    setLoading(true)
    setError(null)

    try {
      const fd = new FormData()
      fd.append("file", file)
      const res = await fetch(endpoint, { method: "POST", body: fd })
      const data = await res.json()

      if (!res.ok || data.error) {
        setError(data.error ?? "Extraction failed")
        return
      }
      setResult(data.extraction)
      onExtracted(data.extraction)
    } catch {
      setError("Network error — try again")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      {!file && (
        <div
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onClick={() => inputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
            dragging
              ? "border-emerald-400 bg-emerald-50"
              : "border-gray-200 hover:border-emerald-300 hover:bg-gray-50"
          }`}
        >
          <Upload size={28} className="mx-auto text-gray-400 mb-3" />
          <p className="text-sm font-medium text-gray-700 mb-1">
            Drop your document here, or click to browse
          </p>
          <p className="text-xs text-gray-400">
            WhatsApp screenshot, email, PDF, or text file · Max {MAX_MB}MB
          </p>
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPT}
            onChange={onInputChange}
            className="hidden"
          />
        </div>
      )}

      {/* File preview */}
      {file && (
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          {preview ? (
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={preview} alt="Upload preview" className="w-full max-h-48 object-cover object-top" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
            </div>
          ) : (
            <div className="bg-gray-50 px-4 py-6 flex items-center gap-3">
              {fileIcon(file.type)}
              <div>
                <p className="text-sm font-medium text-gray-800 truncate max-w-[260px]">{file.name}</p>
                <p className="text-xs text-gray-400">{(file.size / 1024).toFixed(0)} KB</p>
              </div>
            </div>
          )}

          <div className="px-4 py-3 bg-white flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              {fileIcon(file.type)}
              <span className="text-xs text-gray-600 truncate">{file.name}</span>
            </div>
            <button onClick={resetFile} className="text-gray-400 hover:text-red-400 shrink-0 transition-colors">
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5 text-sm text-red-700">
          <AlertCircle size={14} />
          {error}
        </div>
      )}

      {/* Extract button */}
      {file && !result && (
        <button
          onClick={handleExtract}
          disabled={loading}
          className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors text-sm"
        >
          {loading ? (
            <>
              <Loader2 size={15} className="animate-spin" />
              Reading your document...
            </>
          ) : (
            "Extract invoice data"
          )}
        </button>
      )}

      {/* Result summary */}
      {result && (
        <div className="border border-emerald-200 rounded-xl p-4 bg-emerald-50/50 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-800">Extracted successfully</span>
            {confidenceBadge(result.confidence)}
          </div>

          <div className="text-xs text-gray-600 space-y-1">
            {result.clientName && (
              <div className="flex gap-2">
                <span className="text-gray-400 w-24 shrink-0">Client</span>
                <span className="font-medium text-gray-800 bg-emerald-100 px-1 rounded">{result.clientName}</span>
              </div>
            )}
            {result.clientCompany && (
              <div className="flex gap-2">
                <span className="text-gray-400 w-24 shrink-0">Company</span>
                <span className="font-medium text-gray-800 bg-emerald-100 px-1 rounded">{result.clientCompany}</span>
              </div>
            )}
            {result.items.length > 0 && (
              <div className="flex gap-2">
                <span className="text-gray-400 w-24 shrink-0">Items</span>
                <span className="font-medium text-gray-800">
                  {result.items.length} line item{result.items.length !== 1 ? "s" : ""} extracted
                </span>
              </div>
            )}
            {result.totalAmount && (
              <div className="flex gap-2">
                <span className="text-gray-400 w-24 shrink-0">Total</span>
                <span className="font-medium text-gray-800 bg-emerald-100 px-1 rounded">
                  {result.currency} {result.totalAmount.toLocaleString()}
                </span>
              </div>
            )}
          </div>

          <p className="text-xs text-gray-500 italic">Edit any field before saving</p>

          <button
            onClick={resetFile}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-emerald-700 transition-colors"
          >
            <RefreshCw size={11} />
            Upload a different file
          </button>
        </div>
      )}
    </div>
  )
}
