import { createClient } from "../../lib/supabase/server";

type Promo = {
  id: number;
  title: string;
  asset_url: string;
  asset_type: "image" | "pdf" | "link";
  active: boolean;
  created_at: string;
};

export default async function PromotionsPage() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("promotions")
    .select("id,title,asset_url,asset_type,active,created_at")
    .eq("active", true)
    .order("created_at", { ascending: false })
    .limit(30);

  if (error) return <pre className="text-red-600">{error.message}</pre>;

  const promos = (data ?? []) as Promo[];

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-lg font-extrabold" style={{ color: "var(--brand)" }}>
        Promotions
      </h1>
      <p className="mt-1 text-sm text-slate-600">
        Latest offers and announcements.
      </p>

      <div className="mt-4 grid gap-3">
        {promos.map((p) => (
          <div key={p.id} className="rounded-2xl border bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-sm font-extrabold">{p.title}</div>
                <div className="mt-1 text-xs text-slate-500">
                  {new Date(p.created_at).toLocaleString()}
                </div>
              </div>

              <a
                href={p.asset_url}
                target="_blank"
                rel="noreferrer"
                className="rounded-xl border bg-white px-3 py-2 text-sm font-semibold"
              >
                Open
              </a>
            </div>

            {p.asset_type === "image" && (
              <div className="mt-3 overflow-hidden rounded-xl border bg-slate-50">
                <img
                  src={p.asset_url}
                  alt={p.title}
                  className="w-full object-contain"
                  loading="lazy"
                />
              </div>
            )}

            {p.asset_type !== "image" && (
              <div className="mt-3 text-sm text-slate-600">
                Type: <b className="text-slate-900">{p.asset_type}</b>
              </div>
            )}
          </div>
        ))}

        {promos.length === 0 && (
          <div className="rounded-2xl border bg-white p-4 text-sm text-slate-600">
            No promotions posted yet.
          </div>
        )}
      </div>
    </div>
  );
}