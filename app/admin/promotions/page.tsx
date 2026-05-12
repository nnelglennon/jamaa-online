import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "../../../lib/supabase/server";
import { createPromoFromUrl, deletePromo, togglePromo, uploadPromoFile } from "./actions";

type Promo = {
  id: number;
  title: string;
  asset_url: string;
  asset_type: "image" | "pdf" | "link";
  active: boolean;
  created_at: string;
};

export default async function AdminPromotionsPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return <div className="p-6">403 — Admins only</div>;

  const { data, error } = await supabase
    .from("promotions")
    .select("id,title,asset_url,asset_type,active,created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) return <pre className="text-red-600">{error.message}</pre>;

  const promos = (data ?? []) as Promo[];

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-lg font-extrabold" style={{ color: "var(--brand)" }}>
            Admin — Promotions
          </h1>
          <p className="mt-1 text-sm text-slate-600">Post weekly offers (upload image/PDF or use URL).</p>
        </div>
        <div className="flex gap-3">
          <Link className="underline text-sm" href="/promotions">Customer page</Link>
          <Link className="underline text-sm" href="/admin">Admin home</Link>
        </div>
      </div>

      {/* Upload file */}
      <div className="mt-4 rounded-2xl border bg-white p-4 shadow-sm">
        <div className="text-sm font-extrabold" style={{ color: "var(--brand)" }}>Upload promo file</div>
        <form className="mt-3 grid gap-3" action={uploadPromoFile}>
          <input
            name="title"
            placeholder="Title (e.g. Weekend Offers)"
            className="w-full rounded-xl border px-3 py-2 text-sm"
            required
          />
          <input
            type="file"
            name="file"
            accept="image/*,application/pdf"
            className="w-full rounded-xl border bg-white px-3 py-2 text-sm"
            required
          />
          <button className="rounded-xl px-4 py-2 text-sm font-semibold text-white" style={{ background: "var(--brand)" }}>
            Upload & publish
          </button>
          <div className="text-xs text-slate-600">
            Uploads to Supabase Storage bucket <b>promos</b> and saves a public URL.
          </div>
        </form>
      </div>

      {/* Create from URL */}
      <div className="mt-4 rounded-2xl border bg-white p-4 shadow-sm">
        <div className="text-sm font-extrabold" style={{ color: "var(--brand)" }}>Create promo from URL</div>
        <form className="mt-3 grid gap-3" action={createPromoFromUrl}>
          <input name="title" placeholder="Title" className="w-full rounded-xl border px-3 py-2 text-sm" required />
          <select name="asset_type" defaultValue="image" className="w-full rounded-xl border px-3 py-2 text-sm">
            <option value="image">Image URL</option>
            <option value="pdf">PDF URL</option>
            <option value="link">Link</option>
          </select>
          <input name="asset_url" placeholder="https://..." className="w-full rounded-xl border px-3 py-2 text-sm" required />
          <button className="rounded-xl border bg-white px-4 py-2 text-sm font-semibold">
            Publish from URL
          </button>
        </form>
      </div>

      {/* List */}
      <div className="mt-4 grid gap-3">
        {promos.map((p) => (
          <div key={p.id} className="rounded-2xl border bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-sm font-extrabold">{p.title}</div>
                <div className="mt-1 text-xs text-slate-500">
                  {p.asset_type} • {new Date(p.created_at).toLocaleString()}
                </div>
                <div className="mt-2 text-xs text-slate-600 break-all">{p.asset_url}</div>
              </div>

              <div className="flex flex-col gap-2">
                <a className="rounded-xl border bg-white px-3 py-2 text-sm font-semibold text-center"
                   href={p.asset_url} target="_blank" rel="noreferrer">
                  Open
                </a>

                <form action={togglePromo}>
                  <input type="hidden" name="id" value={String(p.id)} />
                  <input type="hidden" name="active" value={String(!p.active)} />
                  <button className="w-full rounded-xl border bg-white px-3 py-2 text-sm font-semibold">
                    {p.active ? "Deactivate" : "Activate"}
                  </button>
                </form>

                <form action={deletePromo}>
                  <input type="hidden" name="id" value={String(p.id)} />
                  <button className="w-full rounded-xl border border-rose-300 bg-white px-3 py-2 text-sm font-semibold text-rose-700">
                    Delete
                  </button>
                </form>
              </div>
            </div>

            {p.asset_type === "image" && (
              <div className="mt-3 overflow-hidden rounded-xl border bg-slate-50">
                <img src={p.asset_url} alt={p.title} className="w-full object-contain" />
              </div>
            )}

            <div className="mt-3 text-sm">
              Status: <b className="text-slate-900">{p.active ? "Active" : "Hidden"}</b>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}