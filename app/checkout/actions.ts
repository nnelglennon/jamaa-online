"use server";

import { redirect } from "next/navigation";
import { createClient } from "../../lib/supabase/server";

type CartItem = { productId: number; qty: number };

function parsePlaceOrderError(message: string) {
  const msg = String(message || "");

  // expected patterns from our SQL:
  // - out_of_stock:Sugar 2kg
  // - not_authenticated
  // - no_default_address
  if (msg.startsWith("out_of_stock:")) {
    const item = msg.replace("out_of_stock:", "").trim();
    return { code: "out_of_stock", item };
  }

  if (msg.includes("no_default_address")) {
    return { code: "no_default_address", item: "" };
  }

  if (msg.includes("not_authenticated")) {
    return { code: "not_authenticated", item: "" };
  }

  return { code: "unknown", item: msg.slice(0, 120) };
}

export async function placeOrder(formData: FormData) {
  const cartJson = String(formData.get("cart_json") ?? "[]");
  let items: CartItem[] = [];

  try {
    items = JSON.parse(cartJson);
  } catch {
    items = [];
  }

  items = (items ?? [])
    .map((i) => ({ productId: Number(i.productId), qty: Number(i.qty) }))
    .filter((i) => Number.isFinite(i.productId) && Number.isFinite(i.qty) && i.qty > 0);

  if (items.length === 0) redirect("/cart");

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Creates order + reserves stock atomically
  const { data: orderId, error } = await supabase.rpc("place_order_v1", {
    cart_items: items,
  });

  if (error) {
    const parsed = parsePlaceOrderError(error.message);

    if (parsed.code === "no_default_address") {
      redirect("/deliver-to");
    }

    // Send user back to cart with a readable message
    redirect(
      `/cart?checkout_error=${encodeURIComponent(parsed.code)}&item=${encodeURIComponent(
        parsed.item || ""
      )}`
    );
  }

  // Success -> payment step
  redirect(`/pay/${orderId}`);
}