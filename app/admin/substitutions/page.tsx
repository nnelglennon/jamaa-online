import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "../../../lib/supabase/server";
import { addSubstitution, removeSubstitution } from "./actions";

type ProductRow = {
  id: number;
  sku: string | null;
  name: string;
  brand: string | null;
  price: number;
  active: boolean;
};

type SubRow = {
  product_id: number;
  substitute_product_id: number;
};

function buildOrQuery(q: string) {
  const s = q.replaceAll(",", " ").trim();
  if (!s) return null;

  // Supabase "or" filter string (PostgREST)
  // We match name/brand/sku using ilike.
  // NOTE: This is a demo-friendly implementation (not perfect escaping).
  const like = `%${s}%`;
  return `name.ilike.${like},brand.ilike.${like},sku.ilike.${like}`;
}

export default async function AdminSubstitutionsPage({
  searchParams,
}: {
  searchParams: { q?: string; product?: string; sq?: string };
}) {
  const supabase = await createClient();

  // Require login
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Require admin
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return <div className="p-6">403 — Admins only</div>;
  }

  const q = (searchParams.q ?? "").trim();
  const sq = (searchParams.sq ?? "").trim();
  const productId = searchParams.product ? Number(searchParams.product) : null;
  const baseProductId = Number.isFinite(productId as number) ? (productId as number) : null;

  // Base product search results
  let baseResults: ProductRow[] = [];
  if (q) {
    const or = buildOrQuery(q);
    const query = supabase
      .from("products")
      .select("id,sku,name,brand,price,active")
      .eq("active", true)
      .order("name", { ascending: true })
      .limit(25);

    const { data } = or ? await query.or(or) : await query;
    baseResults = (data ?? []) as ProductRow[];
  }

  // If a base product is selected, load it + existing substitutions + substitute search results
  let baseProduct: ProductRow | null = null;
  let existingSubs: ProductRow[] = [];
  let subSearchResults: ProductRow[] = [];

  if (baseProductId) {
    const { data: bp } = await supabase
      .from("products")
      .select("id,sku,name,brand,price,active")
      .eq("id", baseProductId)
      .maybeSingle();

    baseProduct = (bp as ProductRow) ?? null;

    const { data: subRows } = await supabase
      .from("substitutions")
      .select("product_id, substitute_product_id")
      .eq("product_id", baseProductId)
      .limit(2000);

    const rows = (subRows ?? []) as SubRow[];
    const subIds = rows.map((r) => r.substitute_product_id);

    if (subIds.length > 0) {
      const { data: subsData } = await supabase
        .from("products")
        .select("id,sku,name,brand,price,active")
        .in("id", subIds)
        .order("name", { ascending: true });

      existingSubs = (subsData ?? []) as ProductRow[];
    }

    // Search candidates to add as substitutes (sq)
    if (sq) {
      const or2 = buildOrQuery(sq);
      const query2 = supabase
        .from("products")
        .select("id,sku,name,brand,price,active")
        .eq("active", true)
        .order("name", { ascending: true })
        .limit(25);

      const { data: cand } = or2 ? await query2.or(or2) : await query2;

      // Filter out: the base product itself + already added substitutes
      const existingSet = new Set(existingSubs.map((p) => p.id));
      subSearchResults = ((cand ?? []) as ProductRow[]).filter(
        (p) => p.id !== baseProductId && !existingSet.has(p.id)
      );
    }
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-lg font-extrabold" style={{ color: "var(--brand)" }}>
            Admin — Substitutions
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Manage “Replace with…” options shown in the cart when items are out of stock.
          </p>
        </div>

        <div className="flex gap-3">
          <Link className="underline text-sm" href="/admin/orders">
            Orders
          </Link>
          <Link className="underline text-sm" href="/admin/inventory">
            Inventory
          </Link>
          <Link className="underline text-sm" href="/admin">
            Admin home
          </Link>
        </div>
      </div>

      {/* Step 1: Choose base product */}
      <div className="mt-4 rounded-2xl border bg-white p-4 shadow-sm">
        <div className="text-sm font-extrabold" style={{ color: "var(--brand)" }}>
          1) Select a product
        </div>

        <form method="GET" action="/admin/substitutions" className="mt-3 grid gap-2 md:grid-cols-[1fr_auto]">
          <input
            name="q"
            defaultValue={q}
            placeholder="Search products by name / brand / sku…"
            className="w-full rounded-xl border px-3 py-2 text-sm"
          />
          <button
            className="rounded-xl px-4 py-2 text-sm font-semibold text-white"
            style={{ background: "var(--brand)" }}
          >
            Search
          </button>
        </form>

        {q && (
          <div className="mt-3 grid gap-2">
            {baseResults.map((p) => (
              <Link
                key={p.id}
                href={`/admin/substitutions?product=${p.id}`}
                className="rounded-xl border bg-white p-3 hover:bg-slate-50"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-extrabold">{p.name}</div>
                    <div className="mt-1 text-xs text-slate-600">
                      SKU: {p.sku ?? "-"} • {p.brand ?? ""} • KES {Number(p.price).toFixed(2)}
                    </div>
                  </div>
                  <div className="text-sm underline">Manage</div>
                </div>
              </Link>
            ))}

            {baseResults.length === 0 && (
              <div className="rounded-xl border bg-slate-50 p-3 text-sm text-slate-600">
                No products found for “{q}”.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Step 2: Manage substitutions for selected product */}
      <div className="mt-4 rounded-2xl border bg-white p-4 shadow-sm">
        <div className="text-sm font-extrabold" style={{ color: "var(--brand)" }}>
          2) Manage substitutes
        </div>

        {!baseProductId || !baseProduct ? (
          <div className="mt-3 text-sm text-slate-600">
            Select a product above to manage its substitutes.
          </div>
        ) : (
          <>
            <div className="mt-3 rounded-xl border bg-slate-50 p-3">
              <div className="text-sm font-extrabold">{baseProduct.name}</div>
              <div className="mt-1 text-xs text-slate-600">
                SKU: {baseProduct.sku ?? "-"} • {baseProduct.brand ?? ""} • KES{" "}
                {Number(baseProduct.price).toFixed(2)}
              </div>
              <div className="mt-2 text-xs text-slate-600">
                When this product is <b>out of stock</b>, the cart will show the substitutes below.
              </div>
            </div>

            {/* Existing substitutes */}
            <div className="mt-4">
              <div className="text-sm font-extrabold" style={{ color: "var(--brand)" }}>
                Existing substitutes
              </div>

              <div className="mt-2 grid gap-2">
                {existingSubs.map((s) => (
                  <div key={s.id} className="rounded-xl border bg-white p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-extrabold">{s.name}</div>
                        <div className="mt-1 text-xs text-slate-600">
                          SKU: {s.sku ?? "-"} • {s.brand ?? ""} • KES {Number(s.price).toFixed(2)}
                        </div>
                      </div>

                      <form action={removeSubstitution}>
                        <input type="hidden" name="product_id" value={String(baseProductId)} />
                        <input type="hidden" name="substitute_product_id" value={String(s.id)} />
                        <button className="rounded-xl border border-rose-200 bg-white px-3 py-2 text-sm font-semibold text-rose-700">
                          Remove
                        </button>
                      </form>
                    </div>
                  </div>
                ))}

                {existingSubs.length === 0 && (
                  <div className="rounded-xl border bg-slate-50 p-3 text-sm text-slate-600">
                    No substitutes yet.
                  </div>
                )}
              </div>
            </div>

            {/* Search + add substitutes */}
            <div className="mt-5">
              <div className="text-sm font-extrabold" style={{ color: "var(--brand)" }}>
                Add substitutes
              </div>

              <form method="GET" action="/admin/substitutions" className="mt-2 grid gap-2 md:grid-cols-[1fr_auto]">
                <input type="hidden" name="product" value={String(baseProductId)} />
                <input
                  name="sq"
                  defaultValue={sq}
                  placeholder="Search products to add as substitutes…"
                  className="w-full rounded-xl border px-3 py-2 text-sm"
                />
                <button className="rounded-xl border bg-white px-4 py-2 text-sm font-semibold">
                  Search
                </button>
              </form>

              {sq && (
                <div className="mt-3 grid gap-2">
                  {subSearchResults.map((cand) => (
                    <div key={cand.id} className="rounded-xl border bg-white p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="truncate text-sm font-extrabold">{cand.name}</div>
                          <div className="mt-1 text-xs text-slate-600">
                            SKU: {cand.sku ?? "-"} • {cand.brand ?? ""} • KES{" "}
                            {Number(cand.price).toFixed(2)}
                          </div>
                        </div>

                        <form action={addSubstitution}>
                          <input type="hidden" name="product_id" value={String(baseProductId)} />
                          <input type="hidden" name="substitute_product_id" value={String(cand.id)} />
                          <button
                            className="rounded-xl px-3 py-2 text-sm font-semibold text-white"
                            style={{ background: "var(--brand)" }}
                          >
                            Add
                          </button>
                        </form>
                      </div>
                    </div>
                  ))}

                  {subSearchResults.length === 0 && (
                    <div className="rounded-xl border bg-slate-50 p-3 text-sm text-slate-600">
                      No candidates found for “{sq}” (or they’re already added).
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}