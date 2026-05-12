import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "../../../lib/supabase/server";

export default async function AdminOrdersPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return <main style={{ padding: 24, fontFamily: "sans-serif" }}>403 — Admins only</main>;
  }

  const { data: orders, error } = await supabase
    .from("orders")
    .select("id,status,payment_status,total,created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <main style={{ padding: 24, fontFamily: "sans-serif", maxWidth: 900, margin: "0 auto" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800 }}>Admin — Orders</h1>
          <div style={{ fontSize: 13, color: "#666" }}>Manage fulfillment + delivery</div>
        </div>
        <nav style={{ display: "flex", gap: 12 }}>
          <Link href="/admin/inventory">Inventory</Link>
          <Link href="/">Shop</Link>
        </nav>
      </header>

      {error && <pre style={{ color: "red", marginTop: 12 }}>{error.message}</pre>}

      <div style={{ marginTop: 14, display: "grid", gap: 10 }}>
        {(orders ?? []).map((o) => (
          <Link
            key={o.id}
            href={`/admin/orders/${o.id}`}
            style={{
              border: "1px solid #ddd",
              borderRadius: 12,
              padding: 12,
              textDecoration: "none",
              color: "inherit",
            }}
          >
            <div style={{ fontWeight: 800 }}>Order {o.id}</div>
            <div style={{ fontSize: 13, color: "#666" }}>
              Status: {o.status} | Payment: {o.payment_status}
            </div>
            <div style={{ marginTop: 6 }}>Total: KES {Number(o.total).toFixed(2)}</div>
          </Link>
        ))}
      </div>
    </main>
  );
}