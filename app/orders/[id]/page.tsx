import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "../../../lib/supabase/server";
import StatusPill from "../../../components/StatusPill";

type OrderRow = {
  id: string;
  status: string;
  payment_status: string;
  subtotal: number;
  delivery_fee: number;
  total: number;
  created_at: string;
};

type ItemProduct = {
  name: string | null;
  sku: string | null;
};

type OrderItemRow = {
  id: string;
  qty: number;
  unit_price: number;
  regular_unit_price: number;
  line_total: number;
  products: ItemProduct[] | null; // Supabase nested select returns array
};

function calcItemSavings(i: OrderItemRow) {
  const diff = Math.max(0, Number(i.regular_unit_price) - Number(i.unit_price));
  return diff * Number(i.qty);
}

export default async function OrderDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: order, error } = await supabase
    .from("orders")
    .select("id, status, payment_status, subtotal, delivery_fee, total, created_at")
    .eq("id", params.id)
    .single();

  if (error) return <pre className="text-red-600">{error.message}</pre>;

  const o = order as OrderRow;

  const { data: items, error: itemsErr } = await supabase
    .from("order_items")
    .select("id, qty, unit_price, regular_unit_price, line_total, products ( name, sku )")
    .eq("order_id", params.id);

  if (itemsErr) return <pre className="text-red-600">{itemsErr.message}</pre>;

  const rows = (items ?? []) as unknown as OrderItemRow[];

  const savings = rows.reduce((sum, i) => sum + calcItemSavings(i), 0);
  const isConfirmed = o.payment_status === "paid" || o.status === "delivered";

  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-lg font-extrabold" style={{ color: "var(--brand)" }}>
            Order details
          </h1>
          <p className="mt-1 text-sm text-slate-600 break-all">ID: {o.id}</p>
        </div>
        <Link className="text-sm underline" href="/orders">
          Back to orders
        </Link>
      </div>

      <div className="mt-4 rounded-2xl border bg-white p-4 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div className="text-sm">
            <div className="text-slate-600">Status</div>
            <div className="mt-1">
              <StatusPill status={o.status} />
            </div>

            <div className="mt-3 text-slate-600">Payment</div>
            <div className="mt-1 font-semibold text-slate-900">{o.payment_status}</div>
          </div>

          <div className="text-right text-sm">
            <div className="text-slate-600">Total</div>
            <div className="mt-1 text-lg font-extrabold">
              KES {Number(o.total).toFixed(2)}
            </div>
            <div className="mt-2 text-xs text-slate-500">
              {new Date(o.created_at).toLocaleString()}
            </div>
          </div>
        </div>

        <div className="mt-4 grid gap-2 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-600">Subtotal</span>
            <span className="font-semibold">KES {Number(o.subtotal).toFixed(2)}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-slate-600">Delivery fee</span>
            <span className="font-semibold">KES {Number(o.delivery_fee).toFixed(2)}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-slate-600">
              Savings {isConfirmed ? "" : "(estimated)"}
            </span>
            <span className="font-extrabold text-green-700">
              - KES {savings.toFixed(2)}
            </span>
          </div>

          <div className="flex justify-between border-t pt-2">
            <span className="font-extrabold">Total</span>
            <span className="font-extrabold">KES {Number(o.total).toFixed(2)}</span>
          </div>

          {!isConfirmed && (
            <div className="text-xs text-slate-500">
              Savings are confirmed once the order is paid/delivered.
            </div>
          )}
        </div>
      </div>

      <h2 className="mt-6 text-sm font-extrabold" style={{ color: "var(--brand)" }}>
        Items
      </h2>

      <div className="mt-3 grid gap-3">
        {rows.map((i) => {
          const itemSavings = calcItemSavings(i);
          const hasPromo = itemSavings > 0;

          return (
            <div key={i.id} className="rounded-2xl border bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate text-sm font-extrabold">
                    {i.products?.[0]?.name ?? "Product"}
                  </div>
                  <div className="mt-1 text-xs text-slate-600">
                    SKU: {i.products?.[0]?.sku ?? "-"}
                  </div>

                  {hasPromo && (
                    <div className="mt-2 inline-flex items-center gap-2 rounded-full border border-green-200 bg-green-50 px-2 py-0.5 text-[11px] font-semibold text-green-800">
                      Promo • You saved KES {itemSavings.toFixed(2)}
                    </div>
                  )}
                </div>

                <div className="text-right text-sm">
                  <div className="font-semibold">Qty {i.qty}</div>

                  <div className="mt-1 text-xs text-slate-600">
                    Unit: KES {Number(i.unit_price).toFixed(2)}
                  </div>

                  {Number(i.regular_unit_price) > Number(i.unit_price) && (
                    <div className="text-xs text-slate-500 line-through">
                      Regular: KES {Number(i.regular_unit_price).toFixed(2)}
                    </div>
                  )}

                  <div className="mt-1 font-extrabold">
                    KES {Number(i.line_total).toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {rows.length === 0 && (
          <div className="rounded-2xl border bg-white p-4 text-sm text-slate-600">
            No items found for this order.
          </div>
        )}
      </div>
    </div>
  );
}