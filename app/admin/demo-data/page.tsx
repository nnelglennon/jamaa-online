import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "../../../lib/supabase/server";
import { generateDemoProducts } from "./actions";

export default async function DemoDataPage({
  searchParams,
}: {
  searchParams: { done?: string; count?: string };
}) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return <div className="p-6">403 — Admins only</div>;

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-lg font-extrabold" style={{ color: "var(--brand)" }}>
            Admin — Demo Data
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Generate sample categories/products for pitching.
          </p>
        </div>

        <div className="flex gap-3 text-sm">
          <Link className="underline" href="/admin/products">Products</Link>
          <Link className="underline" href="/admin/inventory">Inventory</Link>
          <Link className="underline" href="/admin">Admin home</Link>
        </div>
      </div>

      {searchParams.done === "1" && (
        <div className="mt-4 rounded-2xl border border-green-200 bg-green-50 p-4 text-sm text-green-900">
          Generated <b>{searchParams.count ?? "?"}</b> demo products.
          <div className="mt-2 text-xs">
            Next: go to <Link className="underline" href="/admin/inventory">Inventory</Link> and run <b>Demo reset</b>.
          </div>
        </div>
      )}

      <div className="mt-4 rounded-2xl border bg-white p-4 shadow-sm">
        <div className="text-sm font-extrabold" style={{ color: "var(--brand)" }}>
          Generate demo products
        </div>

        <form className="mt-3 grid gap-3" action={generateDemoProducts}>
          <label className="text-sm font-semibold">How many products?</label>
          <input
            name="count"
            type="number"
            defaultValue={100}
            min={1}
            max={1000}
            className="w-full rounded-xl border px-3 py-2 text-sm"
          />
          <button className="rounded-xl px-4 py-2 text-sm font-semibold text-white" style={{ background: "var(--brand)" }}>
            Generate
          </button>
        </form>
      </div>
    </div>
  );
}