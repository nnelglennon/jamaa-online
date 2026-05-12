import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "../../../lib/supabase/server";
import { demoResetBranch } from "./actions";

type Branch = {
  id: string;
  code: string;
  internal_name: string;
  town: string;
  active: boolean;
};

export default async function AdminToolsPage({
  searchParams,
}: {
  searchParams: { done?: string; branch?: string };
}) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile, error: profErr } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profErr) return <pre className="text-red-600">{profErr.message}</pre>;
  if (profile?.role !== "admin") return <div className="p-6">403 — Admins only</div>;

  const { data: branches, error: bErr } = await supabase
    .from("branches")
    .select("id,code,internal_name,town,active")
    .order("code", { ascending: true });

  if (bErr) return <pre className="text-red-600">{bErr.message}</pre>;

  const list = (branches ?? []) as Branch[];
  const defaultBranchId = searchParams.branch ?? (list[0]?.id ?? "");

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-lg font-extrabold" style={{ color: "var(--brand)" }}>
            Admin — Tools
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Demo utilities for pitching (reset stock, clear reservations).
          </p>
        </div>

        <div className="flex gap-3">
          <Link className="underline text-sm" href="/admin/orders">Orders</Link>
          <Link className="underline text-sm" href="/admin/inventory">Inventory</Link>
          <Link className="underline text-sm" href="/admin">Admin home</Link>
        </div>
      </div>

      {searchParams.done === "1" && (
        <div className="mt-4 rounded-2xl border border-green-200 bg-green-50 p-4 text-sm text-green-900">
          <div className="font-extrabold">Reset complete</div>
          <div className="mt-1">
            The selected branch inventory was reset and open orders were cancelled.
          </div>
        </div>
      )}

      <div className="mt-4 rounded-2xl border bg-white p-4 shadow-sm">
        <div className="text-sm font-extrabold" style={{ color: "var(--brand)" }}>
          Demo Reset Branch
        </div>
        <p className="mt-1 text-sm text-slate-600">
          This cancels all non-delivered orders for that branch and sets stock for all active products.
        </p>

        <div className="mt-3 rounded-xl border bg-amber-50 p-3 text-sm text-amber-900">
          <div className="font-extrabold">Use only for demo</div>
          <div className="mt-1">
            This is for pitching/testing. Do not use in a real live store without proper workflow rules.
          </div>
        </div>

        <form className="mt-4 grid gap-3" action={demoResetBranch}>
          <label className="text-sm font-semibold">Branch</label>
          <select
            name="branch_id"
            defaultValue={defaultBranchId}
            className="w-full rounded-xl border px-3 py-2 text-sm"
            required
          >
            {list.map((b) => (
              <option key={b.id} value={b.id}>
                {b.code} — {b.internal_name} ({b.town})
              </option>
            ))}
          </select>

          <label className="text-sm font-semibold">Stock quantity to set (per product)</label>
          <input
            name="qty"
            type="number"
            defaultValue={100}
            min={0}
            className="w-full rounded-xl border px-3 py-2 text-sm"
          />

          <button
            className="rounded-xl px-4 py-2 text-sm font-semibold text-white"
            style={{ background: "var(--brand)" }}
          >
            Run Demo Reset
          </button>

          <div className="text-xs text-slate-600">
            After reset, try: Shop → Add to cart → Checkout. It should never fail due to reserved stock.
          </div>
        </form>
      </div>
    </div>
  );
}