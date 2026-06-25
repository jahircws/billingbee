"use client"

import { useState } from "react"

interface FaqItem {
  question: string
  answer: string
}

interface FaqSectionProps {
  faqs: FaqItem[]
  toolName: string
}

export default function FaqSection({ faqs, toolName }: FaqSectionProps) {
  const [openIndex, setOpenIndex] = useState<number>(0)

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  }

  return (
    <section className="mt-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <h2 className="text-2xl font-bold text-slate-800 mb-8">Frequently Asked Questions</h2>
      <div>
        {faqs.map((faq, index) => (
          <div key={index} className="border-b border-slate-200 py-4">
            <button
              onClick={() => setOpenIndex(openIndex === index ? -1 : index)}
              className="w-full flex justify-between items-center text-left cursor-pointer"
              aria-expanded={openIndex === index}
            >
              <span className="font-semibold text-slate-800 pr-4">{faq.question}</span>
              <span className="text-slate-500 text-lg flex-shrink-0 select-none">
                {openIndex === index ? "−" : "+"}
              </span>
            </button>
            {openIndex === index && (
              <p className="text-slate-600 text-sm leading-relaxed mt-2">{faq.answer}</p>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}
