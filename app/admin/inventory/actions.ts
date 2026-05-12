"use server";

import { redirect } from "next/navigation";
import { createClient } from "../../../lib/supabase/server";

async function requireAdmin() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

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

export async function upsertInventory(formData: FormData) {
  const supabase = await requireAdmin();

  const branch_id = String(formData.get("branch_id") ?? "");
  const product_id = Number(formData.get("product_id") ?? 0);
  const qty_on_hand = Number(formData.get("qty_on_hand") ?? 0);

  if (!branch_id || !product_id || qty_on_hand < 0) {
    throw new Error("Invalid inventory input");
  }

  const { error } = await supabase.from("branch_inventory").upsert({
    branch_id,
    product_id,
    qty_on_hand,
    updated_at: new Date().toISOString(),
  });

  if (error) throw new Error(error.message);

  redirect(`/admin/inventory?branch=${encodeURIComponent(branch_id)}`);
}

export async function seedBranchInventory(formData: FormData) {
  const supabase = await requireAdmin();

  const branch_id = String(formData.get("branch_id") ?? "");
  const qty = Number(formData.get("qty") ?? 50);

  if (!branch_id || qty < 0) throw new Error("Invalid seed input");

  const { data: products, error: prodErr } = await supabase
    .from("products")
    .select("id")
    .eq("active", true);

  if (prodErr) throw new Error(prodErr.message);

  const rows = (products ?? []).map((p) => ({
    branch_id,
    product_id: p.id,
    qty_on_hand: qty,
    qty_reserved: 0,
    updated_at: new Date().toISOString(),
  }));

  const { error } = await supabase.from("branch_inventory").upsert(rows);
  if (error) throw new Error(error.message);

  redirect(`/admin/inventory?branch=${encodeURIComponent(branch_id)}`);
}

/**
 * One-click demo reset:
 * - Cancels open orders for this branch (in SQL function)
 * - Sets qty_on_hand for ALL active products
 * - Sets qty_reserved = 0
 */
export async function demoResetBranch(formData: FormData) {
  const supabase = await requireAdmin();

  const branch_id = String(formData.get("branch_id") ?? "").trim();
  const qty = Number(formData.get("qty") ?? 100);

  if (!branch_id) throw new Error("Missing branch_id");
  if (!Number.isFinite(qty) || qty < 0) throw new Error("Invalid qty");

  const { error } = await supabase.rpc("admin_demo_reset_branch_v1", {
    in_branch_id: branch_id,
    in_qty: qty,
  });

  if (error) throw new Error(error.message);

  redirect(`/admin/inventory?branch=${encodeURIComponent(branch_id)}&reset=1`);
}