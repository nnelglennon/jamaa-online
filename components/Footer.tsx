import Link from "next/link";

export default function Footer() {
  const email = process.env.SHOP_CONTACT_EMAIL || "info@example.com";

  return (
    <footer className="mt-10 border-t bg-white">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="grid gap-6 md:grid-cols-3">
          <div>
            <div className="text-sm font-extrabold" style={{ color: "var(--brand)" }}>
              JAMAA Online
            </div>
            <div className="mt-2 text-sm text-slate-600">
              Contact email: <b className="text-slate-900">{email}</b>
            </div>
            <div className="mt-2 text-xs text-slate-500">
              © {new Date().getFullYear()} Jamaa Supermarket
            </div>
          </div>

          <div>
            <div className="text-sm font-extrabold" style={{ color: "var(--brand)" }}>
              Links
            </div>
            <div className="mt-2 grid gap-2 text-sm">
              <Link className="underline" href="/promotions">Promotions</Link>
              <Link className="underline" href="/orders">Orders</Link>
              <Link className="underline" href="/cart">Cart</Link>
            </div>
          </div>

          <div>
            <div className="text-sm font-extrabold" style={{ color: "var(--brand)" }}>
              Account
            </div>
            <div className="mt-2 grid gap-2 text-sm">
              <Link className="underline" href="/login">Login</Link>
              <Link className="underline" href="/signup">Sign up</Link>
              <Link className="underline" href="/logout">Logout</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}