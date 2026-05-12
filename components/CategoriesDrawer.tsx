"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Category = { id: number; name: string };

export default function CategoriesDrawer({
  categories,
  activeId,
}: {
  categories: Category[];
  activeId: number | null;
}) {
  const [open, setOpen] = useState(false);

  // ESC closes
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // lock scroll
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        className="rounded-full border bg-white px-3 py-1 text-sm font-semibold"
        onClick={() => setOpen(true)}
      >
        Categories
      </button>

      {open && (
        <div className="fixed inset-0 z-[60]">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />

          <div className="absolute left-0 top-0 h-full w-[85%] max-w-sm border-r bg-white shadow-xl">
            <div className="flex items-center justify-between border-b p-4">
              <div className="text-sm font-extrabold" style={{ color: "var(--brand)" }}>
                Categories
              </div>
              <button
                className="rounded-lg border px-3 py-1 text-sm"
                onClick={() => setOpen(false)}
              >
                Close
              </button>
            </div>

            <div className="p-3 overflow-y-auto h-[calc(100%-64px)]">
              <Link
                href="/"
                onClick={() => setOpen(false)}
                className={[
                  "block rounded-xl border px-3 py-2 text-sm font-semibold",
                  activeId === null ? "text-white" : "bg-white",
                ].join(" ")}
                style={activeId === null ? { background: "var(--brand)", borderColor: "var(--brand)" } : {}}
              >
                All products
              </Link>

              <div className="mt-2 grid gap-2">
                {categories.map((c) => (
                  <Link
                    key={c.id}
                    href={`/?cat=${c.id}`}
                    onClick={() => setOpen(false)}
                    className={[
                      "block rounded-xl border px-3 py-2 text-sm",
                      activeId === c.id ? "text-white" : "bg-white",
                    ].join(" ")}
                    style={activeId === c.id ? { background: "var(--brand)", borderColor: "var(--brand)" } : {}}
                  >
                    {c.name}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}