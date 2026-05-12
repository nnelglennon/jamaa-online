import { cookies } from "next/headers";
import { createClient } from "../../lib/supabase/server";
import ProductGrid, { type Product } from "../../components/ProductGrid";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const q = (searchParams.q ?? "").trim();

  const cookieStore = await cookies();
  const town = cookieStore.get("delivery_town")?.value ?? "";
  let branchId = cookieStore.get("fulfillment_branch_id")?.value ?? null;

  const supabase = await createClient();

  if (!branchId) {
    const { data } = await supabase.rpc("route_fulfillment_branch", { in_town: town });
    branchId = data ? String(data) : null;
  }

  const { data: results, error } = await supabase.rpc("search_products", {
    search_query: q,
    in_branch_id: branchId,
  });

  if (error) return <pre className="text-red-600">{error.message}</pre>;

  const rows = (results ?? []) as Product[];

  return (
    <div>
      <h1 className="text-lg font-extrabold" style={{ color: "var(--brand)" }}>
        Search
      </h1>
      <p className="mt-1 text-sm text-slate-600">
        Results for: <b className="text-slate-900">{q || "All products"}</b>
      </p>

      <ProductGrid products={rows} />
    </div>
  );
}