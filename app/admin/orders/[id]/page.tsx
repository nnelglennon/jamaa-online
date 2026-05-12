import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "../../../../lib/supabase/server";
import { cancelOrder, markDelivered, setStatus } from "./actions";

type OrderRow = {
  id: string;
  status: string;
  payment_status: string;
  subtotal: number;
  delivery_fee: number;
  total: number;
  created_at: string;
};

type OrderProduct = {
  name: string | null;
  sku: string | null;
};

type OrderItemRow = {
  id: string;
  qty: number;
  unit_price: number;
  line_total: number;
  products: OrderProduct[] | null; // <-- NOTE: array
};

export default async function AdminOrderDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return (
      <main style={{ padding: 24, fontFamily: "sans-serif" }}>
        403 — Admins only
      </main>
    );
  }

  const { data: order, error } = await supabase
    .from("orders")
    .select(
      "id,status,payment_status,subtotal,delivery_fee,total,created_at"
    )
    .eq("id", params.id)
    .single();

  if (error) {
    return <pre style={{ padding: 24, color: "red" }}>{error.message}</pre>;
  }

  const orderRow = order as OrderRow;

  const { data: items } = await supabase
    .from("order_items")
    .select("id, qty, unit_price, line_total, products ( name, sku )")
    .eq("order_id", params.id);

  const itemRows = (items ?? []) as unknown as OrderItemRow[];

  return (
    <main
      style={{
        padding: 24,
        fontFamily: "sans-serif",
        maxWidth: 900,
        margin: "0 auto",
      }}
    >
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800 }}>Admin — Order</h1>
          <div style={{ fontSize: 13, color: "#666" }}>{orderRow.id}</div>
        </div>
        <nav style={{ display: "flex", gap: 12 }}>
          <Link href="/admin/orders">Back</Link>
          <Link href="/admin/inventory">Inventory</Link>
        </nav>
      </header>

      <section
        style={{
          marginTop: 14,
          border: "1px solid #ddd",
          borderRadius: 12,
          padding: 12,
        }}
      >
        <div>
          <b>Status:</b> {orderRow.status}
        </div>
        <div>
          <b>Payment:</b> {orderRow.payment_status}
        </div>
        <div style={{ marginTop: 8 }}>
          <b>Total:</b> KES {Number(orderRow.total).toFixed(2)}
        </div>

        <div
          style={{
            marginTop: 12,
            display: "flex",
            gap: 10,
            flexWrap: "wrap",
          }}
        >
          <form>
            <input type="hidden" name="order_id" value={orderRow.id} />
            <input type="hidden" name="status" value="picking" />
            <button formAction={setStatus} style={btnStyle}>
              Picking
            </button>
          </form>

          <form>
            <input type="hidden" name="order_id" value={orderRow.id} />
            <input type="hidden" name="status" value="packed" />
            <button formAction={setStatus} style={btnStyle}>
              Packed
            </button>
          </form>

          <form>
            <input type="hidden" name="order_id" value={orderRow.id} />
            <input type="hidden" name="status" value="out_for_delivery" />
            <button formAction={setStatus} style={btnStyle}>
              Out for delivery
            </button>
          </form>

          <form>
            <input type="hidden" name="order_id" value={orderRow.id} />
            <button
              formAction={markDelivered}
              style={{
                ...btnStyle,
                background: "black",
                color: "white",
                borderColor: "black",
              }}
            >
              Mark delivered (deduct stock)
            </button>
          </form>

          <form>
            <input type="hidden" name="order_id" value={orderRow.id} />
            <button
              formAction={cancelOrder}
              style={{ ...btnStyle, borderColor: "#c00", color: "#c00" }}
            >
              Cancel (release reserved)
            </button>
          </form>
        </div>

        <div style={{ marginTop: 10, fontSize: 12, color: "#666" }}>
          Delivered deducts: <code>qty_on_hand -= qty</code> and releases:{" "}
          <code>qty_reserved -= qty</code>. Cancel only releases reserved.
        </div>
      </section>

      <h2 style={{ marginTop: 18, fontWeight: 800 }}>Items</h2>
      <div style={{ marginTop: 10, display: "grid", gap: 10 }}>
        {itemRows.map((i) => (
          <div
            key={i.id}
            style={{
              border: "1px solid #ddd",
              borderRadius: 12,
              padding: 12,
            }}
          >
            <div style={{ fontWeight: 800 }}>
              {i.products?.[0]?.name ?? "Unknown product"}
            </div>
            <div style={{ fontSize: 13, color: "#666" }}>
              SKU: {i.products?.[0]?.sku ?? "-"}
            </div>
            <div style={{ marginTop: 6 }}>Qty: {i.qty}</div>
            <div>Unit: KES {Number(i.unit_price).toFixed(2)}</div>
            <div>
              <b>Line total:</b> KES {Number(i.line_total).toFixed(2)}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}

const btnStyle: React.CSSProperties = {
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid #ddd",
  background: "white",
  cursor: "pointer",
};