"use server";

import { redirect } from "next/navigation";
import { createClient } from "../../../../lib/supabase/server";

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

export async function setStatus(formData: FormData) {
  const supabase = await requireAdmin();
  const orderId = String(formData.get("order_id") ?? "");
  const status = String(formData.get("status") ?? "");

  const { error } = await supabase.rpc("admin_set_order_status_v1", {
    in_order_id: orderId,
    in_status: status,
  });

  if (error) throw new Error(error.message);

  redirect(`/admin/orders/${orderId}`);
}

export async function cancelOrder(formData: FormData) {
  const supabase = await requireAdmin();
  const orderId = String(formData.get("order_id") ?? "");

  const { error } = await supabase.rpc("admin_cancel_order_v1", {
    in_order_id: orderId,
  });

  if (error) throw new Error(error.message);

  redirect(`/admin/orders/${orderId}`);
}

export async function markDelivered(formData: FormData) {
  const supabase = await requireAdmin();
  const orderId = String(formData.get("order_id") ?? "");

  const { error } = await supabase.rpc("admin_mark_delivered_v1", {
    in_order_id: orderId,
  });

  if (error) throw new Error(error.message);

  redirect(`/admin/orders/${orderId}`);
}