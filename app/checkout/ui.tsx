"use client";

import { useEffect, useState } from "react";
import { getCart, clearCart } from "../../components/cart";
import { placeOrder } from "./actions";

export default function CheckoutClient() {
  const [cartJson, setCartJson] = useState("[]");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const cart = getCart();
    setCartJson(JSON.stringify(cart.items));
  }, []);

  return (
    <form
      className="mt-6 rounded-2xl border bg-white p-4 shadow-sm"
      action={async (formData: FormData) => {
        try {
          setError(null);
          await placeOrder(formData);
          clearCart();
        } catch (e: any) {
          setError(e.message || "Something went wrong");
        }
      }}
    >
      <div className="text-sm font-semibold">Order summary</div>
      <div className="mt-2 text-xs text-slate-600">
        (Demo mode) Click any payment button below to mark the order as paid.
      </div>

      <input type="hidden" name="cart_json" value={cartJson} />

      {error && (
        <div className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <button
        className="mt-6 w-full rounded-xl px-4 py-3 text-sm font-semibold text-white"
        style={{ background: "var(--brand)" }}
      >
        Place Order
      </button>
    </form>
  );
}