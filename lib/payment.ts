const PAYMENT_METHOD_LABELS: Record<string, string> = {
  RAZORPAY: "Razorpay",
  STRIPE: "Card",
  PAYPAL: "PayPal",
  BANK_TRANSFER: "Bank transfer",
  CASH: "Cash",
  CHEQUE: "Cheque",
  OTHER: "Manual",
}

/** Human-friendly label for a PaymentMethod enum value. */
export function paymentMethodLabel(method: string | null | undefined): string {
  if (!method) return "Manual"
  return PAYMENT_METHOD_LABELS[method] ?? method
}
