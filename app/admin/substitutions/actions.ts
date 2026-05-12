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

  return { supabase, userId: user.id };
}

export async function addSubstitution(formData: FormData) {
  const { supabase } = await requireAdmin();

  const product_id = Number(formData.get("product_id") ?? 0);
  const substitute_product_id = Number(formData.get("substitute_product_id") ?? 0);

  if (!product_id || !substitute_product_id) throw new Error("Missing product ids");
  if (product_id === substitute_product_id) throw new Error("Cannot substitute a product with itself");

  const { error } = await supabase.from("substitutions").insert({
    product_id,
    substitute_product_id,
  });

  // ignore unique error (already added)
  if (error && !String(error.message).toLowerCase().includes("duplicate")) {
    throw new Error(error.message);
  }

  redirect(`/admin/substitutions?product=${product_id}`);
}

export async function removeSubstitution(formData: FormData) {
  const { supabase } = await requireAdmin();

  const product_id = Number(formData.get("product_id") ?? 0);
  const substitute_product_id = Number(formData.get("substitute_product_id") ?? 0);

  if (!product_id || !substitute_product_id) throw new Error("Missing product ids");

  const { error } = await supabase
    .from("substitutions")
    .delete()
    .eq("product_id", product_id)
    .eq("substitute_product_id", substitute_product_id);

  if (error) throw new Error(error.message);

  redirect(`/admin/substitutions?product=${product_id}`);
}