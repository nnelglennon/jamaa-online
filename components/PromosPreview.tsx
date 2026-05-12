import Link from "next/link";
import { createClient } from "../lib/supabase/server";

type Promo = {
  id: number;
  title: string;
  asset_url: string;
  asset_type: "image" | "pdf" | "link";
  active: boolean;
  created_at: string;
};

export default async function PromosPreview() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("promotions")
    .select("id,title,asset_url,asset_type,active,created_at")
    .eq("active", true)
    .order("created_at", { ascending: false })
    .limit(3);

  if (error) {
    return (
      <div className="mt-4 rounded-2xl border bg-white p-4 text-sm text-slate-600">
        Promotions unavailable right now.
      </div>
    );
  }

  const promos = (data ?? []) as Promo[];

  return (
    <section className="mt-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <div className="text-sm font-extrabold" style={{ color: "var(--brand)" }}>
            Promotions
          </div>
          <div className="mt-1 text-sm text-slate-600">Latest offers and announcements.</div>
        </div>
        <Link className="text-sm underline" href="/promotions">
          View all
        </Link>
      </div>

      <div className="mt-3 grid gap-3 md:grid-cols-3">
        {promos.map((p) => (
          <a
            key={p.id}
            href={p.asset_url}
            target="_blank"
            rel="noreferrer"
            className="rounded-2xl border bg-white p-4 shadow-sm hover:bg-slate-50"
          >
            <div className="text-sm font-extrabold">{p.title}</div>
            <div className="mt-1 text-xs text-slate-500">
              {new Date(p.created_at).toLocaleDateString()} • {p.asset_type.toUpperCase()}
            </div>

            {p.asset_type === "image" && (
              <div className="mt-3 overflow-hidden rounded-xl border bg-slate-50">
                <img src={p.asset_url} alt={p.title} className="w-full object-contain" />
              </div>
            )}

            {p.asset_type !== "image" && (
              <div className="mt-3 text-sm text-slate-600">
                Open promo
              </div>
            )}
          </a>
        ))}

        {promos.length === 0 && (
          <div className="rounded-2xl border bg-white p-4 text-sm text-slate-600 md:col-span-3">
            No promotions posted yet.
          </div>
        )}
      </div>
    </section>
  );
}