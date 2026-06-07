export const EXTRACTION_PROMPT = `Extract invoice/billing information from this document.
Return ONLY valid JSON, no explanation, no markdown:
{
  "clientName": string|null,
  "clientEmail": string|null,
  "clientCompany": string|null,
  "items": [{"description":string,"qty":number,"rate":number}],
  "currency": string,
  "totalAmount": number|null,
  "dueDate": string|null,
  "notes": string|null,
  "confidence": "high"|"medium"|"low"
}
Rules:
- If a field is not found, use null
- items: be specific, infer qty=1 if not stated
- currency: "INR" default for Indian content, "USD" if $ found
- confidence: "high" if most fields found, "low" if mostly guessing`
