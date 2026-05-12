import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "../../../../lib/supabase/server";

type SubRow = { product_id: number; substitute_product_id: number };

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const product_ids: number[] = Array.isArray(body.product_ids)
    ? body.product_ids.map((n: any) => Number(n)).filter((n: number) => Number.isFinite(n))
    : [];

  if (product_ids.length === 0) {
    return NextResponse.json({ substitutes: [] });
  }

  const cookieStore = await cookies();
  const town = cookieStore.get("delivery_town")?.value ?? "";
  let branchId = cookieStore.get("fulfillment_branch_id")?.value ?? null;

  const supabase = await createClient();

  if (!branchId) {
    const { data } = await supabase.rpc("route_fulfillment_branch", { in_town: town });
    branchId = data ? String(data) : null;
  }

  // Read substitution mappings for these products
  const { data: subs, error: subsErr } = await supabase
    .from("substitutions")
    .select("product_id, substitute_product_id")
    .in("product_id", product_ids)
    .limit(5000);

  if (subsErr) {
    return NextResponse.json({ error: subsErr.message, substitutes: [] }, { status: 400 });
  }

  const subRows = (subs ?? []) as SubRow[];
  const substituteIds = Array.from(new Set(subRows.map((s) => s.substitute_product_id)));

  if (substituteIds.length === 0) {
    return NextResponse.json({ substitutes: [] });
  }

  // Fetch substitute product details + availability (no stock numbers)
  const { data: products, error: prodErr } = await supabase.rpc("products_by_ids", {
    in_ids: substituteIds,
    in_branch_id: branchId,
  });

  if (prodErr) {
    return NextResponse.json({ error: prodErr.message, substitutes: [] }, { status: 400 });
  }

  const prodMap = new Map<number, any>((products ?? []).map((p: any) => [p.id, p]));

  // Build per-product substitute options list
  const result = product_ids.map((pid) => {
    const options = subRows
      .filter((r) => r.product_id === pid)
      .map((r) => prodMap.get(r.substitute_product_id))
      .filter(Boolean);

    return { product_id: pid, options };
  });

  return NextResponse.json({ substitutes: result });
}