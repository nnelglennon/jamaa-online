import Link from "next/link";

export default function HomeHero() {
  return (
    <section className="rounded-3xl border bg-white p-5 shadow-sm">
      <div className="grid gap-4 md:grid-cols-[1.2fr_0.8fr] md:items-center">
        <div>
          <h1 className="text-2xl font-extrabold leading-tight" style={{ color: "var(--brand)" }}>
            Shop online. Get delivery.
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Your delivery location affects product availability. Set “Deliver to” to get the correct store coverage.
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href="/search"
              className="rounded-xl px-4 py-2 text-sm font-semibold text-white"
              style={{ background: "var(--brand)" }}
            >
              Search products
            </Link>

            <Link
              href="/promotions"
              className="rounded-xl border bg-white px-4 py-2 text-sm font-semibold"
            >
              View promotions
            </Link>

            <Link
              href="/cart"
              className="rounded-xl border bg-white px-4 py-2 text-sm font-semibold"
            >
              Go to cart
            </Link>
          </div>

          <div className="mt-4 grid gap-2 text-xs text-slate-600 sm:grid-cols-3">
            <div className="rounded-xl border bg-slate-50 p-3">
              <div className="font-extrabold text-slate-900">Fast pickup & delivery</div>
              <div className="mt-1">Orders routed by your location.</div>
            </div>
            <div className="rounded-xl border bg-slate-50 p-3">
              <div className="font-extrabold text-slate-900">Pay options</div>
              <div className="mt-1">M‑Pesa, Airtel Money, Visa/Mastercard (setup ready).</div>
            </div>
            <div className="rounded-xl border bg-slate-50 p-3">
              <div className="font-extrabold text-slate-900">Substitutions</div>
              <div className="mt-1">Replace out-of-stock items in cart.</div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border bg-slate-50 p-4">
          <div className="text-sm font-extrabold" style={{ color: "var(--brand)" }}>
            Quick tips
          </div>
          <ul className="mt-2 list-disc space-y-2 pl-5 text-sm text-slate-700">
            <li>Tap <b>Deliver to → Change</b> to set your town.</li>
            <li>Out-of-stock items can be replaced with <b>Substitutes</b> in cart.</li>
            <li>Use <b>Promotions</b> for weekly deals.</li>
          </ul>
        </div>
      </div>
    </section>
  );
}