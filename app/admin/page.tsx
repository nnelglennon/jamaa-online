import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "../../lib/supabase/server";

export default async function AdminHomePage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (error) return <pre style={{ padding: 24, color: "red" }}>{error.message}</pre>;
  if (profile?.role !== "admin") {
    return <main style={{ padding: 24, fontFamily: "sans-serif" }}>403 — Admins only</main>;
  }

  return (
    <main style={{ padding: 24, fontFamily: "sans-serif", maxWidth: 720, margin: "0 auto" }}>
      <h1 style={{ fontSize: 22, fontWeight: 800 }}>Admin Dashboard</h1>
      <p style={{ marginTop: 6, color: "#666" }}>Choose what to manage.</p>

      <div style={{ marginTop: 16, display: "grid", gap: 10 }}>
        <Link
          href="/admin/orders"
          style={{ border: "1px solid #ddd", borderRadius: 12, padding: 12, textDecoration: "none", color: "inherit" }}
        >
          <b>Orders</b>
          <div style={{ fontSize: 13, color: "#666" }}>View orders, mark delivered, cancel</div>
        </Link>

        <Link
          href="/admin/inventory"
          style={{ border: "1px solid #ddd", borderRadius: 12, padding: 12, textDecoration: "none", color: "inherit" }}
        >
          <b>Inventory</b>
          <div style={{ fontSize: 13, color: "#666" }}>Seed stock, update qty on hand</div>
        </Link>

        <Link href="/" style={{ marginTop: 8 }}>Back to shop</Link>
      </div>
    </main>
  );
}