import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "../../../lib/supabase/server";
import { createProduct, setProductActive } from "./actions";

type ProductRow = {
  id: number;
  sku: string | null;
  name: string;
  brand: string | null;
  price: number;
  regular_price: number | null;
  active: boolean;
};

function isPromo(p: ProductRow) {
  return p.regular_price !== null && Number(p.regular_price) > Number(p.price);
}

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: { q?: string; done?: string };
}) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") return <div className="p-6">403 — Admins only</div>;

  const q = (searchParams.q ?? "").trim();

  let query = supabase
    .from("products")
    .select("id,sku,name,brand,price,regular_price,active")
    .order("name", { ascending: true })
    .limit(150);

  if (q) {
    query = query.or(`name.ilike.%${q}%,brand.ilike.%${q}%,sku.ilike.%${q}%`);
  }

  const { data, error } = await query;
  if (error) return <pre className="text-red-600">{error.message}</pre>;

  const products = (data ?? []) as ProductRow[];

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-lg font-extrabold" style={{ color: "var(--brand)" }}>
            Admin — Products
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            To put a product on promotion: set <b>regular_price</b> &gt; <b>price</b>.
          </p>
        </div>
        <div className="flex gap-3">
          <Link className="underline text-sm" href="/admin/inventory">Inventory</Link>
          <Link className="underline text-sm" href="/admin/promotions">Weekly Promotions</Link>
          <Link className="underline text-sm" href="/admin">Admin home</Link>
        </div>
      </div>

      {searchParams.done === "1" && (
        <div className="mt-4 rounded-2xl border border-green-200 bg-green-50 p-4 text-sm text-green-900">
          Saved successfully.
        </div>
      )}

      <div className="mt-4 rounded-2xl border bg-white p-4 shadow-sm">
        <div className="text-sm font-extrabold" style={{ color: "var(--brand)" }}>
          Create / Update product (upsert by SKU)
        </div>

        <form className="mt-3 grid gap-3 md:grid-cols-2" action={createProduct}>
          <input name="category" placeholder="Category (e.g. Groceries)" className="rounded-xl border px-3 py-2 text-sm" />
          <input name="sku" placeholder="SKU (unique)" className="rounded-xl border px-3 py-2 text-sm" required />

          <input name="name" placeholder="Product name" className="rounded-xl border px-3 py-2 text-sm md:col-span-2" required />

          <input name="brand" placeholder="Brand (optional)" className="rounded-xl border px-3 py-2 text-sm" />

          <input name="price" type="number" step="0.01" min="0" placeholder="Promo/current price (KES)" className="rounded-xl border px-3 py-2 text-sm" required />

          <input name="regular_price" type="number" step="0.01" min="0" placeholder="Regular/original price (KES) (optional)" className="rounded-xl border px-3 py-2 text-sm" />

          <input name="image_url" placeholder="Image URL (optional)" className="rounded-xl border px-3 py-2 text-sm md:col-span-2" />

          <textarea name="description" placeholder="Description (optional)" className="rounded-xl border px-3 py-2 text-sm md:col-span-2" rows={3} />

          <button className="rounded-xl px-4 py-2 text-sm font-semibold text-white md:col-span-2" style={{ background: "var(--brand)" }}>
            Save product
          </button>
        </form>
      </div>

      <form method="GET" action="/admin/products" className="mt-4 flex gap-2">
        <input name="q" defaultValue={q} placeholder="Search…" className="w-full rounded-xl border px-3 py-2 text-sm" />
        <button className="rounded-xl border bg-white px-4 py-2 text-sm font-semibold">Search</button>
      </form>

      <div className="mt-4 grid gap-3">
        {products.map((p) => (
          <div key={p.id} className="rounded-2xl border bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="truncate text-sm font-extrabold">{p.name}</div>
                <div className="mt-1 text-xs text-slate-600">
                  SKU: {p.sku ?? "-"} • {p.brand ?? ""}
                </div>

                {isPromo(p) ? (
                  <div className="mt-2 text-sm">
                    <span className="font-extrabold text-blue-700">
                      KES {Number(p.price).toFixed(2)}
                    </span>{" "}
                    <span className="text-slate-600 line-through">
                      KES {Number(p.regular_price).toFixed(2)}
                    </span>
                    <div className="mt-1 text-xs text-slate-600">
                      Promo active
                    </div>
                  </div>
                ) : (
                  <div className="mt-2 text-sm font-extrabold">
                    KES {Number(p.price).toFixed(2)}
                  </div>
                )}

                <div className="mt-2 text-xs">
                  Status: <b className="text-slate-900">{p.active ? "Active" : "Inactive"}</b>
                </div>
              </div>

              <form action={setProductActive} className="flex flex-col gap-2">
                <input type="hidden" name="id" value={String(p.id)} />
                <input type="hidden" name="active" value={String(!p.active)} />
                <button className="rounded-xl border bg-white px-3 py-2 text-sm font-semibold">
                  {p.active ? "Deactivate" : "Activate"}
                </button>
              </form>
            </div>
          </div>
        ))}

        {products.length === 0 && (
          <div className="rounded-2xl border bg-white p-4 text-sm text-slate-600">
            No products found.
          </div>
        )}
      </div>
    </div>
  );
}