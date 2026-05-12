import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "../../lib/supabase/server";
import StatusPill from "../../components/StatusPill";

type OrderRow = {
  id: string;
  status: string;
  payment_status: string;
  total: number;
  created_at: string;
};

export default async function OrdersPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: orders, error } = await supabase
    .from("orders")
    .select("id, status, payment_status, total, created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) return <pre className="text-red-600">{error.message}</pre>;

  const rows = (orders ?? []) as OrderRow[];

  return (
    <div>
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-lg font-extrabold" style={{ color: "var(--brand)" }}>
            My Orders
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Track your orders and view receipts.
          </p>
        </div>
        <Link className="text-sm underline" href="/">
          Continue shopping
        </Link>
      </div>

      <div className="mt-4 grid gap-3">
        {rows.map((o) => (
          <Link
            key={o.id}
            href={`/orders/${o.id}`}
            className="rounded-xl border bg-white p-4 shadow-sm hover:bg-slate-50"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="truncate text-sm font-extrabold">Order {o.id}</div>
                <div className="mt-1 text-xs text-slate-600">
                  Payment: <b className="text-slate-900">{o.payment_status}</b>
                </div>
              </div>

              <div className="flex flex-col items-end gap-2">
                <StatusPill status={o.status} />
                <div className="text-sm font-extrabold">
                  KES {Number(o.total).toFixed(2)}
                </div>
              </div>
            </div>

            <div className="mt-2 text-xs text-slate-500">
              Created: {new Date(o.created_at).toLocaleString()}
            </div>
          </Link>
        ))}

        {rows.length === 0 && (
          <div className="rounded-xl border bg-white p-4 text-sm text-slate-600">
            No orders yet.
          </div>
        )}
      </div>
    </div>
  );
}