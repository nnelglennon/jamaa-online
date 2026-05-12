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

  redirect(`/admin/tools?done=1&branch=${encodeURIComponent(branch_id)}`);
}