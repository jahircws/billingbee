export const EXTRACTION_PROMPT = `Extract invoice/billing information from this document.
Return ONLY valid JSON, no explanation, no markdown:
{
  "clientName": string|null,
  "clientEmail": string|null,
  "clientCompany": string|null,
  "items": [{"description":string,"qty":number,"rate":number}],
  "currency": string,
  "totalAmount": number|null,
  "taxAmount": number|null,
  "dueDate": string|null,
  "paymentTerms": string|null,
  "notes": string|null,
  "confidence": "high"|"medium"|"low"
}
Rules:
- If a field is not found, use null
- items: be specific, infer qty=1 if not stated
- currency: detect from symbols and text — ₹ or Rs or INR → "INR", $ or USD → "USD", € or EUR → "EUR", £ or GBP → "GBP", ¥ or JPY → "JPY", A$ or AUD → "AUD", CA$ or CAD → "CAD", S$ or SGD → "SGD", AED → "AED". Default "INR" only if no currency clues found
- taxAmount: extract the tax/GST/VAT amount if shown separately, else null
- paymentTerms: e.g. "Net 30", "Due on receipt", "50% upfront" — extract if mentioned
- dueDate: return as YYYY-MM-DD if found
- confidence: "high" if most fields found, "low" if mostly guessing`
