import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "../../../../lib/supabase/server";

export async function POST(request: Request) {
  const { ids } = await request.json();

  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ products: [] });
  }

  const cookieStore = await cookies();
  const branchId = cookieStore.get("fulfillment_branch_id")?.value ?? null;

  const supabase = await createClient();

  const { data: products, error } = await supabase.rpc("products_by_ids", {
    in_ids: ids,
    in_branch_id: branchId,
  });

  if (error) {
    return NextResponse.json({ error: error.message, products: [] }, { status: 400 });
  }

  return NextResponse.json({ products: products ?? [] });
}