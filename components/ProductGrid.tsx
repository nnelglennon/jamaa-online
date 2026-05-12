"use client";

import Link from "next/link";
import { useState } from "react";
import { addToCart } from "./cart";

export type Product = {
  id: number;
  name: string;
  brand: string | null;
  price: number;
  image_url: string | null;
  availability: "available" | "limited" | "out_of_stock";
};

function badgeClass(a: Product["availability"]) {
  if (a === "available") return "bg-green-100 text-green-800 border-green-200";
  if (a === "limited") return "bg-amber-100 text-amber-900 border-amber-200";
  return "bg-rose-100 text-rose-800 border-rose-200";
}

export default function ProductGrid({ products }: { products: Product[] }) {
  const [msg, setMsg] = useState<string | null>(null);

  return (
    <>
      {msg && (
        <div className="mt-4 rounded-xl border bg-white p-3 text-sm">
          {msg}
        </div>
      )}

      <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        {products.slice(0, 48).map((p) => {
          const disabled = p.availability === "out_of_stock";

          return (
            <div key={p.id} className="rounded-2xl border bg-white p-3 shadow-sm">
              {/* Clickable image -> product page */}
              <Link href={`/product/${p.id}`} className="block">
                <div className="aspect-square w-full overflow-hidden rounded-xl border bg-slate-50">
                  {p.image_url ? (
                    <img
                      src={p.image_url}
                      alt={p.name}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs text-slate-500">
                      No image
                    </div>
                  )}
                </div>
              </Link>

              {/* Clickable name -> product page */}
              <Link href={`/product/${p.id}`} className="mt-3 block">
                <div className="line-clamp-2 text-sm font-extrabold hover:underline">
                  {p.name}
                </div>
                <div className="mt-1 text-xs text-slate-600">{p.brand ?? ""}</div>
              </Link>

              <div className="mt-3 flex items-center justify-between gap-2">
                <div className="text-sm font-extrabold">
                  KES {Number(p.price).toFixed(2)}
                </div>
                <span
                  className={[
                    "rounded-full border px-2 py-0.5 text-[11px] font-semibold",
                    badgeClass(p.availability),
                  ].join(" ")}
                >
                  {p.availability.replaceAll("_", " ")}
                </span>
              </div>

              <button
                disabled={disabled}
                onClick={() => {
                  addToCart(p.id, 1);
                  setMsg(`Added to cart: ${p.name}`);
                  setTimeout(() => setMsg(null), 1200);
                }}
                className="mt-3 w-full rounded-xl px-3 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                style={{ background: "var(--brand)" }}
              >
                {disabled ? "Out of stock" : "Add to cart"}
              </button>

              <Link
                href={`/product/${p.id}`}
                className="mt-2 block text-center text-xs underline text-slate-600"
              >
                View details
              </Link>
            </div>
          );
        })}
      </div>
    </>
  );
}