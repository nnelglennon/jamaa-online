"use client";

import { useState } from "react";
import { addToCart } from "../../../components/cart";

export default function AddToCartButton({
  productId,
  productName,
  disabled,
}: {
  productId: number;
  productName: string;
  disabled: boolean;
}) {
  const [msg, setMsg] = useState<string | null>(null);

  return (
    <>
      {msg && <div className="mb-2 text-sm text-green-700">{msg}</div>}

      <button
        disabled={disabled}
        onClick={() => {
          addToCart(productId, 1);
          setMsg(`Added to cart: ${productName}`);
          setTimeout(() => setMsg(null), 1200);
        }}
        className="w-full rounded-xl px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
        style={{ background: "var(--brand)" }}
      >
        {disabled ? "Out of stock" : "Add to cart"}
      </button>
    </>
  );
}