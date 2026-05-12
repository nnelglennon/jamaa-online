import { cookies } from "next/headers";
import { createClient } from "../lib/supabase/server";
import ProductGrid, { type Product } from "../components/ProductGrid";
import Departments from "../components/Departments";
import CategoriesDrawer from "../components/CategoriesDrawer";
import CategoriesSidebar from "../components/CategoriesSidebar";

type Category = { id: number; name: string };

export default async function HomePage({
  searchParams,
}: {
  searchParams: { cat?: string };
}) {
  const cookieStore = await cookies();
  const town = cookieStore.get("delivery_town")?.value ?? "";
  let branchId = cookieStore.get("fulfillment_branch_id")?.value ?? null;

  const supabase = await createClient();

  if (!branchId) {
    const { data } = await supabase.rpc("route_fulfillment_branch", { in_town: town });
    branchId = data ? String(data) : null;
  }

  const catId = searchParams.cat ? Number(searchParams.cat) : null;
  const categoryFilter = Number.isFinite(catId) ? catId : null;

  const { data: categories, error: catErr } = await supabase
    .from("categories")
    .select("id,name")
    .order("name", { ascending: true });

  if (catErr) return <pre className="text-red-600">{catErr.message}</pre>;

  const cats = (categories ?? []) as Category[];

  // IMPORTANT: use named args matching your function signature
  const { data: products, error } = await supabase.rpc("search_products_v2", {
    in_branch_id: branchId,
    in_category_id: categoryFilter,
    search_query: "",
  });

  if (error) return <pre className="text-red-600">{error.message}</pre>;

  const rows = (products ?? []) as Product[];

  return (
    <div>
      {/* Page header row */}
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-lg font-extrabold" style={{ color: "var(--brand)" }}>
            Shop
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Delivery location affects availability.
          </p>
        </div>

        {/* Mobile-only categories drawer button */}
        <div className="md:hidden">
          <CategoriesDrawer categories={cats} activeId={categoryFilter} />
        </div>
      </div>

      {/* Layout: sidebar on desktop, grid on right */}
      <div className="mt-4 grid gap-4 md:grid-cols-[260px_1fr]">
        <div className="hidden md:block">
          <CategoriesSidebar categories={cats} activeId={categoryFilter} />
        </div>

        <div>
          {/* Chips only on mobile (desktop already has sidebar) */}
          <div className="md:hidden">
            <Departments categories={cats} activeId={categoryFilter} />
          </div>

          <ProductGrid products={rows} />
        </div>
      </div>
    </div>
  );
}