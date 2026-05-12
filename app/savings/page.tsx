import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "../../lib/supabase/server";

type SavingsOrderRow = {
  order_id: string;
  created_at: string;
  payment_status: string;
  status: string;
  promo_units: number;
  savings: number;
};

export default async function SavingsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data, error } = await supabase.rpc("get_savings_orders_v1");

  if (error) return <pre className="text-red-600">{error.message}</pre>;

  const rows = (data ?? []) as SavingsOrderRow[];

  const totalSavings = rows.reduce((sum, r) => sum + Number(r.savings || 0), 0);
  const totalPromoUnits = rows.reduce((sum, r) => sum + Number(r.promo_units || 0), 0);

  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-lg font-extrabold" style={{ color: "var(--brand)" }}>
            Savings
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Savings are calculated from <b>paid/delivered</b> orders only.
          </p>
        </div>
        <Link className="text-sm underline" href="/account">
          Account
        </Link>
      </div>

      <div className="mt-4 rounded-2xl border bg-white p-4 shadow-sm">
        <div className="text-sm text-slate-600">Total savings</div>
        <div className="mt-1 text-3xl font-extrabold">
          KES {totalSavings.toFixed(2)}
        </div>
        <div className="mt-2 text-xs text-slate-500">
          Promo units purchased: <b className="text-slate-900">{totalPromoUnits}</b>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm font-extrabold" style={{ color: "var(--brand)" }}>
            Savings by order
          </div>
          <Link className="text-sm underline" href="/orders">
            Orders
          </Link>
        </div>

        <div className="mt-3 grid gap-2">
          {rows.map((r) => (
            <div key={r.order_id} className="rounded-xl border bg-white p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate text-sm font-extrabold">
                    Order{" "}
                    <Link className="underline" href={`/orders/${r.order_id}`}>
                      {r.order_id}
                    </Link>
                  </div>
                  <div className="mt-1 text-xs text-slate-600">
                    {new Date(r.created_at).toLocaleString()} • Status:{" "}
                    <b className="text-slate-900">{r.status}</b> • Payment:{" "}
                    <b className="text-slate-900">{r.payment_status}</b>
                  </div>
                  <div className="mt-1 text-xs text-slate-600">
                    Promo units: <b className="text-slate-900">{r.promo_units}</b>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs text-slate-600">Savings</div>
                  <div className="text-sm font-extrabold">
                    KES {Number(r.savings).toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {rows.length === 0 && (
            <div className="rounded-xl border bg-slate-50 p-3 text-sm text-slate-600">
              No savings yet. Savings show after orders are paid/delivered and include promo-priced items.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}