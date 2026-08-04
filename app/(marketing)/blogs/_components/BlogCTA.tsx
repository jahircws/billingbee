import Link from "next/link";

export function BlogCTA({
  title = "Create GST-compliant invoices for free",
  description = "BillingBee automatically calculates CGST, SGST, and IGST and generates a professional PDF ready to send to your client. No credit card required.",
  href = "/register",
  ctaLabel = "Start Free with BillingBee",
}: {
  title?: string;
  description?: string;
  href?: string;
  ctaLabel?: string;
}) {
  return (
    <div className="bg-emerald-50 border border-emerald-100 rounded-2xl px-6 py-10 md:px-10 text-center">
      <h3 className="text-xl md:text-2xl font-bold text-emerald-800">{title}</h3>
      <p className="text-slate-600 mt-3 max-w-xl mx-auto leading-relaxed">
        {description}
      </p>
      <Link
        href={href}
        className="inline-block mt-6 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors active:scale-95"
      >
        {ctaLabel}
      </Link>
    </div>
  );
}
