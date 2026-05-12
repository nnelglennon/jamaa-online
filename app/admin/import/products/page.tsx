import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "../../../../lib/supabase/server";
import { importProductsCsv } from "./actions";

export default async function ImportProductsPage({
  searchParams,
}: {
  searchParams: { done?: string; rows?: string };
}) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") return <div className="p-6">403 — Admins only</div>;

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-lg font-extrabold" style={{ color: "var(--brand)" }}>
            Admin — Import Products (CSV)
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Upload a CSV to create categories and upsert products by SKU.
          </p>
        </div>

        <div className="flex gap-3 text-sm">
          <Link className="underline" href="/admin/inventory">Inventory</Link>
          <Link className="underline" href="/admin/substitutions">Substitutions</Link>
          <Link className="underline" href="/admin">Admin home</Link>
        </div>
      </div>

      {searchParams.done === "1" && (
        <div className="mt-4 rounded-2xl border border-green-200 bg-green-50 p-4 text-sm text-green-900">
          <div className="font-extrabold">Import complete</div>
          <div className="mt-1">Rows processed: <b>{searchParams.rows ?? "?"}</b></div>
          <div className="mt-2 text-xs">
            Next: go to <Link className="underline" href="/admin/inventory">Inventory</Link> and run <b>Demo reset</b> or <b>Seed</b>.
          </div>
        </div>
      )}

      <div className="mt-4 rounded-2xl border bg-white p-4 shadow-sm">
        <div className="text-sm font-extrabold" style={{ color: "var(--brand)" }}>
          CSV format
        </div>

        <div className="mt-2 rounded-xl border bg-slate-50 p-3 text-xs text-slate-700">
          Required headers (first row):<br />
          <b>category, sku, name, brand, description, price, image_url, active</b>
          <br /><br />
          Notes:
          <ul className="list-disc pl-5">
            <li><b>sku</b>, <b>name</b>, <b>price</b> should not be empty.</li>
            <li><b>active</b> can be blank (defaults true) or “false”.</li>
            <li>If a field contains commas, wrap it in quotes.</li>
          </ul>
        </div>

        <form className="mt-4 grid gap-3" action={importProductsCsv}>
          <input
            type="file"
            name="file"
            accept=".csv,text/csv"
            className="w-full rounded-xl border bg-white px-3 py-2 text-sm"
            required
          />

          <button
            className="rounded-xl px-4 py-2 text-sm font-semibold text-white"
            style={{ background: "var(--brand)" }}
          >
            Import CSV
          </button>
        </form>
      </div>
    </div>
  );
}