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

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: order, error } = await supabase
    .from("orders")
    .select("id,status,payment_status,total,created_at")
    .eq("id", params.id)
    .single();

  if (error) return <pre className="text-red-600">{error.message}</pre>;

  const o = order as OrderRow;

  if (o.payment_status === "paid") redirect(`/orders/${o.id}`);

  return (
    <div className="mx-auto max-w-md">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-lg font-extrabold" style={{ color: "var(--brand)" }}>
            Payment
          </h1>
          <p className="mt-1 text-sm text-slate-600 break-all">Order ID: {o.id}</p>
        </div>
        <Link className="text-sm underline" href={`/orders/${o.id}`}>
          Back
        </Link>
      </div>

      <div className="mt-4 rounded-2xl border bg-white p-4 shadow-sm">
        <div className="text-sm text-slate-600">Amount</div>
        <div className="mt-1 text-2xl font-extrabold">KES {Number(o.total).toFixed(2)}</div>
        <div className="mt-2 text-xs text-slate-500">
          Choose a payment option below to complete your order.
        </div>
      </div>

      <div className="mt-4 rounded-2xl border bg-white p-4 shadow-sm">
        <div className="text-sm font-extrabold" style={{ color: "var(--brand)" }}>
          Pay with
        </div>

        <div className="mt-4 grid gap-2">
          <form action={payDemo}>
            <input type="hidden" name="order_id" value={o.id} />
            <input type="hidden" name="method" value="mpesa" />
            <button
              className="w-full rounded-xl px-4 py-2 text-sm font-semibold text-white"
              style={{ background: "var(--brand)" }}
            >
              M‑Pesa
            </button>
          </form>

          <form action={payDemo}>
            <input type="hidden" name="order_id" value={o.id} />
            <input type="hidden" name="method" value="airtel_money" />
            <button className="w-full rounded-xl border bg-white px-4 py-2 text-sm font-semibold">
              Airtel Money
            </button>
          </form>

          <form action={payDemo}>
            <input type="hidden" name="order_id" value={o.id} />
            <input type="hidden" name="method" value="card" />
            <button className="w-full rounded-xl border bg-white px-4 py-2 text-sm font-semibold">
              Visa / Mastercard
            </button>
          </form>
        </div>

        <div className="mt-3 text-xs text-slate-600">
          For the pitch demo, payment completion is simulated. Live gateway integration can be enabled after approval.
        </div>
      </div>
    </div>
  );
}