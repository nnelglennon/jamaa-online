"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  CartItem,
  clearCart,
  getCart,
  removeFromCart,
  replaceProduct,
  setQty,
} from "../../components/cart";

type Availability = "available" | "limited" | "out_of_stock";

type ProductRow = {
  id: number;
  name: string;
  brand: string | null;
  price: number;
  availability: Availability;
  image_url?: string | null;
};

type SubOption = {
  id: number;
  name: string;
  brand: string | null;
  price: number;
  availability: Availability;
  image_url: string | null;
};

type SubsResponse = {
  substitutes: { product_id: number; options: SubOption[] }[];
};

function errorMessage(code: string, item: string) {
  if (code === "out_of_stock") return `Out of stock: ${item || "an item in your cart"}. Choose a substitute or remove it.`;
  if (code === "no_default_address") return "You need a delivery address before checkout.";
  if (code === "not_authenticated") return "Please login to continue.";
  return `Could not place order. ${item ? `Details: ${item}` : ""}`.trim();
}

export default function CartPage() {
  const searchParams = useSearchParams();
  const checkoutError = searchParams.get("checkout_error") ?? "";
  const item = searchParams.get("item") ?? "";

  const [items, setItems] = useState<CartItem[]>([]);
  const [products, setProducts] = useState<Record<number, ProductRow>>({});
  const [subs, setSubs] = useState<Record<number, SubOption[]>>({});
  const [loadingSubs, setLoadingSubs] = useState(false);

  useEffect(() => {
    setItems(getCart().items);
  }, []);

  // Load product details for cart items
  useEffect(() => {
    async function load() {
      if (items.length === 0) return setProducts({});

      const ids = items.map((i) => i.productId);

      const res = await fetch("/api/products/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });

      const json = await res.json();
      const map: Record<number, ProductRow> = {};
      (json.products ?? []).forEach((p: ProductRow) => (map[p.id] = p));
      setProducts(map);
    }
    load();
  }, [items]);

  // Load substitute options for out_of_stock items
  useEffect(() => {
    async function loadSubs() {
      const outIds = items
        .map((i) => i.productId)
        .filter((pid) => products[pid]?.availability === "out_of_stock");

      if (outIds.length === 0) {
        setSubs({});
        return;
      }

      setLoadingSubs(true);
      try {
        const res = await fetch("/api/products/substitutes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ product_ids: outIds }),
        });

        const json = (await res.json()) as SubsResponse;

        const map: Record<number, SubOption[]> = {};
        (json.substitutes ?? []).forEach((row) => {
          map[row.product_id] = row.options ?? [];
        });

        setSubs(map);
      } finally {
        setLoadingSubs(false);
      }
    }

    if (items.length > 0) loadSubs();
  }, [items, products]);

  const subtotal = useMemo(() => {
    return items.reduce((sum, i) => {
      const p = products[i.productId];
      if (!p) return sum;
      return sum + Number(p.price) * i.qty;
    }, 0);
  }, [items, products]);

  const anyOutOfStock = useMemo(() => {
    return items.some((i) => products[i.productId]?.availability === "out_of_stock");
  }, [items, products]);

  return (
    <div>
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-lg font-extrabold" style={{ color: "var(--brand)" }}>
            Cart
          </h1>
          <p className="mt-1 text-sm text-slate-600">Review items before checkout.</p>
        </div>
        <Link className="underline text-sm" href="/">
          Continue shopping
        </Link>
      </div>

      {/* Checkout error banner (from failed place_order_v1) */}
      {checkoutError && (
        <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900">
          <div className="font-extrabold">Checkout issue</div>
          <div className="mt-1">{errorMessage(checkoutError, item)}</div>
        </div>
      )}

      {/* Naivas-style warning */}
      <div className="mt-4 rounded-2xl border bg-amber-50 p-4 text-sm text-amber-900">
        <div className="font-extrabold">Availability notice</div>
        <div className="mt-1">
          Some products may not be available at your nearest store based on your delivery location.
          If an item is out of stock, choose a substitute below or remove it.
        </div>
      </div>

      {items.length === 0 ? (
        <div className="mt-4 rounded-xl border bg-white p-4 text-sm text-slate-600">
          Your cart is empty.
        </div>
      ) : (
        <>
          <div className="mt-4 grid gap-3">
            {items.map((i) => {
              const p = products[i.productId];
              const availability = p?.availability ?? "out_of_stock";
              const out = availability === "out_of_stock";

              return (
                <div key={i.productId} className="rounded-2xl border bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-extrabold">
                        {p?.name ?? `Product ${i.productId}`}
                      </div>
                      <div className="mt-1 text-xs text-slate-600">{p?.brand ?? ""}</div>

                      <div className="mt-2 text-sm font-extrabold">
                        {p ? `KES ${Number(p.price).toFixed(2)}` : "Loading…"}
                      </div>

                      <div className="mt-1 text-xs text-slate-600">
                        Availability:{" "}
                        <b className={out ? "text-rose-700" : "text-slate-900"}>
                          {availability.replaceAll("_", " ")}
                        </b>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <label className="text-xs text-slate-600">Qty</label>
                      <input
                        type="number"
                        min={0}
                        value={i.qty}
                        onChange={(e) => {
                          const q = Number(e.target.value);
                          setQty(i.productId, q);
                          setItems(getCart().items);
                        }}
                        className="w-24 rounded-lg border px-3 py-2 text-sm"
                      />

                      <button
                        type="button"
                        className="rounded-lg border px-3 py-2 text-sm font-semibold text-rose-700 border-rose-200"
                        onClick={() => {
                          removeFromCart(i.productId);
                          setItems(getCart().items);
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  </div>

                  {/* Substitute section */}
                  {out && (
                    <div className="mt-4 rounded-xl border bg-slate-50 p-3">
                      <div className="text-sm font-extrabold" style={{ color: "var(--brand)" }}>
                        Substitute options
                      </div>

                      {loadingSubs && (
                        <div className="mt-2 text-sm text-slate-600">Loading substitutes…</div>
                      )}

                      {!loadingSubs && (subs[i.productId]?.length ?? 0) === 0 && (
                        <div className="mt-2 text-sm text-slate-600">
                          No substitutes available for this item yet.
                        </div>
                      )}

                      {!loadingSubs && (subs[i.productId]?.length ?? 0) > 0 && (
                        <div className="mt-3 grid gap-2">
                          {(subs[i.productId] ?? []).slice(0, 6).map((s) => (
                            <div
                              key={s.id}
                              className="flex items-center justify-between gap-3 rounded-xl border bg-white p-3"
                            >
                              <div className="min-w-0">
                                <div className="truncate text-sm font-extrabold">{s.name}</div>
                                <div className="mt-1 text-xs text-slate-600">
                                  {s.brand ?? ""} • KES {Number(s.price).toFixed(2)}
                                </div>
                                <div className="mt-1 text-xs text-slate-600">
                                  Availability:{" "}
                                  <b className={s.availability === "out_of_stock" ? "text-rose-700" : "text-slate-900"}>
                                    {s.availability.replaceAll("_", " ")}
                                  </b>
                                </div>
                              </div>

                              <button
                                type="button"
                                className="rounded-xl px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
                                style={{ background: "var(--brand)" }}
                                disabled={s.availability === "out_of_stock"}
                                onClick={() => {
                                  replaceProduct(i.productId, s.id);
                                  setItems(getCart().items);
                                }}
                              >
                                Replace
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-4 rounded-2xl border bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600">Subtotal</span>
              <span className="font-extrabold">KES {subtotal.toFixed(2)}</span>
            </div>

            <div className="mt-3 grid gap-2 md:grid-cols-2">
              <button
                onClick={() => {
                  clearCart();
                  setItems([]);
                }}
                className="rounded-xl border bg-white px-4 py-2 text-sm font-semibold"
              >
                Clear cart
              </button>

              <Link
                href={anyOutOfStock ? "/cart" : "/checkout"}
                className="rounded-xl px-4 py-2 text-center text-sm font-semibold text-white"
                style={{ background: "var(--brand)" }}
              >
                {anyOutOfStock ? "Resolve out-of-stock items" : "Proceed to checkout"}
              </Link>
            </div>

            {anyOutOfStock && (
              <div className="mt-3 text-xs text-rose-700">
                You have out-of-stock items. Replace or remove them before checkout.
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}