"use server";

import { redirect } from "next/navigation";
import { createClient } from "../../../lib/supabase/server";

async function requireAdmin() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (error) throw new Error(error.message);
  if (profile?.role !== "admin") throw new Error("403 — Admins only");

  return supabase;
}

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export async function generateDemoProducts(formData: FormData) {
  const supabase = await requireAdmin();

  const count = Number(formData.get("count") ?? 100);
  if (!Number.isFinite(count) || count <= 0 || count > 1000) {
    throw new Error("Count must be between 1 and 1000");
  }

  const categories = [
    "Groceries",
    "Fresh Food",
    "Household",
    "Beverages",
    "Personal Care",
  ];

  // Upsert categories
  const { error: catErr } = await supabase
    .from("categories")
    .upsert(categories.map((name) => ({ name })), { onConflict: "name" });

  if (catErr) throw new Error(catErr.message);

  const { data: catRows, error: catSelErr } = await supabase
    .from("categories")
    .select("id,name")
    .in("name", categories);

  if (catSelErr) throw new Error(catSelErr.message);

  const catMap = new Map<string, number>((catRows ?? []).map((c: any) => [String(c.name), Number(c.id)]));

  // Create products
  const now = Date.now();
  const rows = Array.from({ length: count }).map((_, i) => {
    const cat = categories[i % categories.length];
    const catId = catMap.get(cat) ?? null;

    const sku = `DEMO-${now}-${i}`;
    const price = randInt(50, 2000);

    return {
      category_id: catId,
      sku,
      name: `${cat} Item ${i + 1}`,
      brand: "DemoBrand",
      description: "Demo product for pitching",
      price,
      image_url: null,
      active: true,
    };
  });

  const { error: prodErr } = await supabase.from("products").insert(rows);
  if (prodErr) throw new Error(prodErr.message);

  redirect(`/admin/demo-data?done=1&count=${encodeURIComponent(String(count))}`);
}