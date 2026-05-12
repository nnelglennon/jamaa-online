"use server";

import { redirect } from "next/navigation";
import { createClient } from "../../../lib/supabase/server";

export async function payDemo(formData: FormData) {
  const orderId = String(formData.get("order_id") ?? "").trim();
  const method = String(formData.get("method") ?? "").trim();

  if (!orderId) redirect("/orders");

  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase.rpc("customer_pay_demo", {
    in_order_id: orderId,
    in_method: method,
  });

  if (error) throw new Error(error.message);

  redirect(`/orders/${orderId}`);
}