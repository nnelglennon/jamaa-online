import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "../../../lib/supabase/server";
import { demoResetBranch, seedBranchInventory, upsertInventory } from "./actions";

type InventoryProduct = {
  sku: string | null;
  name: string | null;
  price: number | null;
};

type InventoryRow = {
  product_id: number;
  qty_on_hand: number;
  qty_reserved: number;
  products: InventoryProduct[] | null; // Supabase nested select returns array
};

type Branch = {
  id: string;
  code: string;
  internal_name: string;
  town: string;
};

export default async function AdminInventoryPage({
  searchParams,
}: {
  searchParams: { branch?: string; reset?: string };
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return <main className="p-6">403 — Admins only</main>;
  }

  const { data: branches, error: branchesErr } = await supabase
    .from("branches")
    .select("id, code, internal_name, town")
    .order("code", { ascending: true });

  if (branchesErr) return <pre className="p-6 text-red-600">{branchesErr.message}</pre>;

  const branchList = (branches ?? []) as Branch[];
  const chosenBranchId =
    searchParams.branch ?? (branchList[0]?.id ? String(branchList[0].id) : "");

  const chosenBranch = branchList.find((b) => String(b.id) === String(chosenBranchId));

  if (!chosenBranch) {
    return <main className="p-6">No branches found.</main>;
  }

  const { data: inventory, error: invErr } = await supabase
    .from("branch_inventory")
    .select("product_id, qty_on_hand, qty_reserved, products ( sku, name, price )")
    .eq("branch_id", chosenBranch.id)
    .order("product_id", { ascending: true });

  const inventoryRows = (inventory ?? []) as unknown as InventoryRow[];

  return (
    <main className="mx-auto max-w-5xl p-6">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-lg font-extrabold" style={{ color: "var(--brand)" }}>
            Admin — Inventory
          </h1>
          <div className="mt-1 text-sm text-slate-600">
            Branch (admin only): <b className="text-slate-900">{chosenBranch.internal_name}</b> —{" "}
            {chosenBranch.town}
          </div>
        </div>

        <nav className="flex gap-3 text-sm">
          <Link className="underline" href="/admin">
            Admin home
          </Link>
          <Link className="underline" href="/admin/orders">
            Orders
          </Link>
          <Link className="underline" href="/">
            Shop
          </Link>
        </nav>
      </header>

      {searchParams.reset === "1" && (
        <div className="mt-4 rounded-2xl border border-green-200 bg-green-50 p-4 text-sm text-green-900">
          <div className="font-extrabold">Demo reset complete</div>
          <div className="mt-1">Stock reset + reserved cleared for this branch.</div>
        </div>
      )}

      {/* Branch switch */}
      <section className="mt-4 rounded-2xl border bg-white p-4 shadow-sm">
        <div className="text-sm font-extrabold" style={{ color: "var(--brand)" }}>
          Switch branch
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {branchList.map((b) => (
            <Link
              key={b.id}
              href={`/admin/inventory?branch=${encodeURIComponent(String(b.id))}`}
              className="rounded-full border bg-white px-3 py-1 text-sm"
            >
              {b.code}
            </Link>
          ))}
        </div>
      </section>

      {/* Demo reset + seed */}
      <section className="mt-4 grid gap-3 md:grid-cols-2">
        <div className="rounded-2xl border bg-white p-4 shadow-sm">
          <div className="text-sm font-extrabold" style={{ color: "var(--brand)" }}>
            Demo reset (recommended before pitching)
          </div>
          <p className="mt-1 text-sm text-slate-600">
            Cancels open orders for this branch and sets stock for all products.
          </p>

          <form className="mt-3 grid gap-2" action={demoResetBranch}>
            <input type="hidden" name="branch_id" value={String(chosenBranch.id)} />
            <label className="text-sm font-semibold">Set stock qty (per product)</label>
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
              Run demo reset
            </button>
          </form>

          <div className="mt-2 text-xs text-amber-700">
            Use only for demo/testing.
          </div>
        </div>

        <div className="rounded-2xl border bg-white p-4 shadow-sm">
          <div className="text-sm font-extrabold" style={{ color: "var(--brand)" }}>
            Seed inventory (quick)
          </div>
          <p className="mt-1 text-sm text-slate-600">
            Creates inventory rows for all active products if missing.
          </p>

          <form className="mt-3 grid gap-2" action={seedBranchInventory}>
            <input type="hidden" name="branch_id" value={String(chosenBranch.id)} />
            <label className="text-sm font-semibold">Qty</label>
            <input
              name="qty"
              type="number"
              defaultValue={50}
              min={0}
              className="w-full rounded-xl border px-3 py-2 text-sm"
            />
            <button className="rounded-xl border bg-white px-4 py-2 text-sm font-semibold">
              Seed
            </button>
          </form>
        </div>
      </section>

      {invErr && <pre className="mt-4 text-red-600">{invErr.message}</pre>}

      <h2 className="mt-6 text-sm font-extrabold" style={{ color: "var(--brand)" }}>
        Inventory rows
      </h2>

      <div className="mt-3 grid gap-3">
        {inventoryRows.map((row) => (
          <div key={row.product_id} className="rounded-2xl border bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="truncate text-sm font-extrabold">
                  {row.products?.[0]?.name ?? "Unknown product"}
                </div>
                <div className="mt-1 text-xs text-slate-600">
                  SKU: {row.products?.[0]?.sku ?? "-"}
                </div>
              </div>

              <div className="text-right text-sm">
                <div className="font-extrabold">
                  KES {Number(row.products?.[0]?.price ?? 0).toFixed(2)}
                </div>
                <div className="mt-1 text-xs text-slate-600">
                  Reserved: <b className="text-slate-900">{row.qty_reserved}</b>
                </div>
              </div>
            </div>

            <form className="mt-3 flex flex-wrap items-center gap-2" action={upsertInventory}>
              <input type="hidden" name="branch_id" value={String(chosenBranch.id)} />
              <input type="hidden" name="product_id" value={String(row.product_id)} />

              <label className="text-sm font-semibold">On hand</label>
              <input
                name="qty_on_hand"
                type="number"
                defaultValue={row.qty_on_hand}
                min={0}
                className="w-32 rounded-xl border px-3 py-2 text-sm"
              />

              <button
                className="ml-auto rounded-xl px-4 py-2 text-sm font-semibold text-white"
                style={{ background: "var(--brand)" }}
              >
                Save
              </button>
            </form>
          </div>
        ))}

        {inventoryRows.length === 0 && (
          <div className="rounded-2xl border bg-white p-4 text-sm text-slate-600">
            No inventory rows yet for this branch. Use “Seed” or “Demo reset” above.
          </div>
        )}
      </div>
    </main>
  );
}