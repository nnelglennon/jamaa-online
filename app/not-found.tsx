import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md rounded-2xl border bg-white p-6 shadow-sm">
      <div className="text-lg font-extrabold" style={{ color: "var(--brand)" }}>
        Page not found
      </div>
      <p className="mt-2 text-sm text-slate-600">
        The page you’re looking for doesn’t exist.
      </p>
      <div className="mt-4 flex gap-3">
        <Link
          className="rounded-xl px-4 py-2 text-sm font-semibold text-white"
          style={{ background: "var(--brand)" }}
          href="/"
        >
          Go home
        </Link>
        <Link className="rounded-xl border bg-white px-4 py-2 text-sm font-semibold" href="/search">
          Search products
        </Link>
      </div>
    </div>
  );
}