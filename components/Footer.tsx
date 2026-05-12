export default function Footer() {
  const email = process.env.SHOP_CONTACT_EMAIL || "info@example.com";

  const payPill =
    "inline-flex items-center rounded-full border bg-white px-3 py-1 text-xs font-semibold text-slate-700";

  return (
    <footer className="mt-10 border-t bg-white">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="grid gap-6 md:grid-cols-3">
          <div>
            <div className="text-sm font-extrabold" style={{ color: "var(--brand)" }}>
              Contact
            </div>
            <div className="mt-2 text-sm text-slate-600">
              Email: <b className="text-slate-900">{email}</b>
            </div>
          </div>

          <div>
            <div className="text-sm font-extrabold" style={{ color: "var(--brand)" }}>
              Payments
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              <span className={payPill}>M‑Pesa</span>
              <span className={payPill}>Airtel Money</span>
              <span className={payPill}>Visa</span>
              <span className={payPill}>Mastercard</span>
            </div>
            <div className="mt-2 text-xs text-slate-500">
              Payment options shown for demo; live gateway can be connected.
            </div>
          </div>

          <div>
            <div className="text-sm font-extrabold" style={{ color: "var(--brand)" }}>
              About
            </div>
            <div className="mt-2 text-sm text-slate-600">
              Online ordering with delivery routing by location and stock checks per branch.
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}