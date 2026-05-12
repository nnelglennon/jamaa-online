import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "../../../lib/supabase/server";
import { payDemo } from "./actions";

type OrderRow = {
  id: string;
  status: string;
  payment_status: string;
  total: number;
  created_at: string;
};

export default async function PayPage({ params }: { params: { id: string } }) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Only let the owner pay
  const { data: order, error } = await supabase
    .from("orders")
    .select("id,status,payment_status,total,created_at")
    .eq("id", params.id)
    .single();

  if (error) return <pre className="text-red-600">{error.message}</pre>;

  const o = order as OrderRow;

  // If already paid, go to order
  if (o.payment_status === "paid") redirect(`/orders/${o.id}`);

  return (
    <div className="mx-auto max-w-md">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-lg font-extrabold" style={{ color: "var(--brand)" }}>
            Pay for order
          </h1>
          <p className="mt-1 text-sm text-slate-600 break-all">Order ID: {o.id}</p>
        </div>
        <Link className="text-sm underline" href={`/orders/${o.id}`}>
          Back
        </Link>
      </div>

      <div className="mt-4 rounded-xl border bg-white p-4 shadow-sm">
        <div className="text-sm text-slate-600">Amount</div>
        <div className="mt-1 text-2xl font-extrabold">KES {Number(o.total).toFixed(2)}</div>
        <div className="mt-2 text-xs text-slate-500">
          Payment status: <b className="text-slate-900">{o.payment_status}</b>
        </div>
      </div>

      <div className="mt-4 rounded-xl border bg-white p-4 shadow-sm">
        <div className="text-sm font-extrabold" style={{ color: "var(--brand)" }}>
          Choose payment method
        </div>
        <p className="mt-1 text-sm text-slate-600">
          (Demo) These buttons mark the order as paid. Later, connect Pesapal/Flutterwave live.
        </p>

        <div className="mt-4 grid gap-2">
          <form action={payDemo}>
            <input type="hidden" name="order_id" value={o.id} />
            <input type="hidden" name="method" value="mpesa" />
            <button
              className="w-full rounded-xl px-4 py-2 text-sm font-semibold text-white"
              style={{ background: "var(--brand)" }}
            >
              Pay with M‑Pesa (Demo)
            </button>
          </form>

          <form action={payDemo}>
            <input type="hidden" name="order_id" value={o.id} />
            <input type="hidden" name="method" value="airtel_money" />
            <button className="w-full rounded-xl border bg-white px-4 py-2 text-sm font-semibold">
              Pay with Airtel Money (Demo)
            </button>
          </form>

          <form action={payDemo}>
            <input type="hidden" name="order_id" value={o.id} />
            <input type="hidden" name="method" value="card" />
            <button className="w-full rounded-xl border bg-white px-4 py-2 text-sm font-semibold">
              Pay with Visa/Mastercard (Demo)
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}