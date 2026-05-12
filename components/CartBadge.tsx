"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getCart } from "./cart";

export default function CartBadge() {
  const [count, setCount] = useState(0);

  function refresh() {
    const cart = getCart();
    const total = cart.items.reduce((sum, i) => sum + i.qty, 0);
    setCount(total);
  }

  useEffect(() => {
    refresh();

    const onStorage = () => refresh();
    window.addEventListener("storage", onStorage);

    const onCart: EventListener = () => refresh();
    window.addEventListener("jamaa-cart-changed", onCart);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("jamaa-cart-changed", onCart);
    };
  }, []);

  return (
    <Link href="/cart" className="relative inline-flex items-center gap-2">
      <span className="text-sm font-medium">Cart</span>
      <span className="min-w-6 rounded-full bg-black px-2 py-0.5 text-center text-xs text-white">
        {count}
      </span>
    </Link>
  );
}