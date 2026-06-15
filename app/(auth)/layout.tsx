import Image from "next/image"

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left panel — brand */}
      <div
        className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12"
        style={{ backgroundColor: "#1e2330" }}
      >
        <a href="/" className="flex items-center no-underline">
          <Image src="/logo.png" alt="BillingBee" width={160} height={40} className="object-contain brightness-0 invert" />
        </a>

        <div className="space-y-6">
          <div className="space-y-3">
            <h1 className="text-4xl font-bold text-white leading-tight">
              Invoice smarter,
              <br />
              <span style={{ color: "#10b981" }}>get paid faster.</span>
            </h1>
            <p className="text-gray-400 text-lg leading-relaxed">
              AI-powered invoicing built for Indian freelancers and small businesses. GST-ready,
              multi-currency, zero hassle.
            </p>
          </div>

          <div className="space-y-4">
            {[
              { icon: "⚡", text: "Create GST invoices in seconds with AI" },
              { icon: "💳", text: "Accept payments via Razorpay, Stripe & PayPal" },
              { icon: "📊", text: "Real-time revenue analytics & reports" },
            ].map(({ icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <span className="text-lg">{icon}</span>
                <span className="text-gray-300 text-sm">{text}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-gray-600 text-sm">© {new Date().getFullYear()} BillingBee. All rights reserved.</p>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 sm:p-10 bg-white">
        {/* Mobile logo */}
        <a href="/" className="lg:hidden mb-8 no-underline">
          <Image src="/logo.png" alt="BillingBee" width={160} height={40} className="object-contain" />
        </a>

        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  )
}
