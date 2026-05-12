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

export async function createProduct(formData: FormData) {
  const supabase = await requireAdmin();

  const category = String(formData.get("category") ?? "").trim();
  const sku = String(formData.get("sku") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const brand = String(formData.get("brand") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const image_url = String(formData.get("image_url") ?? "").trim();
  const price = Number(formData.get("price") ?? 0);

  if (!sku || !name || !Number.isFinite(price) || price < 0) {
    throw new Error("Missing/invalid sku, name, or price");
  }

  let category_id: number | null = null;

  if (category) {
    // upsert category then lookup id
    const { error: upErr } = await supabase.from("categories").upsert([{ name: category }], { onConflict: "name" });
    if (upErr) throw new Error(upErr.message);

    const { data: catRow, error: cErr } = await supabase
      .from("categories")
      .select("id")
      .eq("name", category)
      .single();

    if (cErr) throw new Error(cErr.message);
    category_id = Number(catRow.id);
  }

  // Upsert product by sku
  const { error: pErr } = await supabase.from("products").upsert([{
    category_id,
    sku,
    name,
    brand: brand || null,
    description: description || null,
    price,
    image_url: image_url || null,
    active: true,
  }], { onConflict: "sku" });

  if (pErr) throw new Error(pErr.message);

  redirect("/admin/products?done=1");
}

export async function setProductActive(formData: FormData) {
  const supabase = await requireAdmin();

  const id = Number(formData.get("id") ?? 0);
  const active = String(formData.get("active") ?? "true") === "true";
  if (!id) throw new Error("Missing id");

  const { error } = await supabase.from("products").update({ active }).eq("id", id);
  if (error) throw new Error(error.message);

  redirect("/admin/products");
}