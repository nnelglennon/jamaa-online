import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "../../../lib/supabase/server";
import AddToCartButton from "./ui";

type ProductRow = {
  id: number;
  name: string;
  brand: string | null;
  description: string | null;
  price: number;
  image_url: string | null;
  availability: "available" | "limited" | "out_of_stock";
};

export default async function ProductPage({ params }: { params: { id: string } }) {
  const productId = Number(params.id);
  if (!Number.isFinite(productId)) redirect("/");

  const cookieStore = await cookies();
  const town = cookieStore.get("delivery_town")?.value ?? "";
  let branchId = cookieStore.get("fulfillment_branch_id")?.value ?? null;

  const supabase = await createClient();

  if (!branchId) {
    const { data } = await supabase.rpc("route_fulfillment_branch", { in_town: town });
    branchId = data ? String(data) : null;
  }

  // Get product info
  const { data: p, error: pErr } = await supabase
    .from("products")
    .select("id,name,brand,description,price,image_url,active")
    .eq("id", productId)
    .maybeSingle();

  if (pErr) return <pre className="text-red-600">{pErr.message}</pre>;
  if (!p || p.active !== true) {
    return (
      <div className="rounded-xl border bg-white p-4">
        Product not found.
      </div>
    );
  }

  // Get availability without exposing quantities
  const { data: rows, error: aErr } = await supabase.rpc("products_by_ids", {
    in_ids: [productId],
    in_branch_id: branchId,
  });

  if (aErr) return <pre className="text-red-600">{aErr.message}</pre>;

  const availability =
    (rows?.[0]?.availability as ProductRow["availability"]) ?? "out_of_stock";

  const product: ProductRow = {
    id: p.id,
    name: p.name,
    brand: p.brand,
    description: p.description,
    price: Number(p.price),
    image_url: p.image_url,
    availability,
  };

  const disabled = product.availability === "out_of_stock";

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-lg font-extrabold" style={{ color: "var(--brand)" }}>
            Product details
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Availability depends on your delivery location.
          </p>
        </div>
        <Link className="text-sm underline" href="/">
          Back to shop
        </Link>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {/* Image */}
        <div className="rounded-2xl border bg-white p-3 shadow-sm">
          <div className="aspect-square w-full overflow-hidden rounded-xl border bg-slate-50">
            {product.image_url ? (
              <img
                src={product.image_url}
                alt={product.name}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-sm text-slate-500">
                No image
              </div>
            )}
          </div>
        </div>

        {/* Details */}
        <div className="rounded-2xl border bg-white p-4 shadow-sm">
          <div className="text-sm font-extrabold">{product.name}</div>
          <div className="mt-1 text-xs text-slate-600">{product.brand ?? ""}</div>

          <div className="mt-4 text-2xl font-extrabold">
            KES {product.price.toFixed(2)}
          </div>

          <div className="mt-2 text-sm text-slate-600">
            Availability:{" "}
            <b className="text-slate-900">
              {product.availability.replaceAll("_", " ")}
            </b>
          </div>

          {product.description && (
            <div className="mt-4">
              <div className="text-sm font-extrabold" style={{ color: "var(--brand)" }}>
                Description
              </div>
              <p className="mt-1 text-sm text-slate-700">{product.description}</p>
            </div>
          )}

          <div className="mt-5">
            <AddToCartButton
              productId={product.id}
              productName={product.name}
              disabled={disabled}
            />
          </div>

          <div className="mt-3">
            <Link className="text-sm underline" href="/cart">
              Go to cart
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}