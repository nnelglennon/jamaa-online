import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "../../lib/supabase/server";
import { saveDefaultAddress } from "./actions";

export default async function DeliverToPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: addresses } = await supabase
    .from("addresses")
    .select("id, formatted_address, town, phone, is_default, created_at")
    .order("created_at", { ascending: false });

  return (
    <main style={{ padding: 24, fontFamily: "sans-serif", maxWidth: 720, margin: "0 auto" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ fontSize: 22, fontWeight: 800 }}>Deliver to</h1>
        <Link href="/">Home</Link>
      </header>

      <p style={{ marginTop: 8, fontSize: 14, color: "#555" }}>
        Save a default delivery address. For demo routing, we use the <b>Town</b>.
      </p>

      <h2 style={{ marginTop: 16, fontWeight: 800 }}>Saved addresses</h2>
      <div style={{ marginTop: 8, display: "grid", gap: 10 }}>
        {(addresses ?? []).map((a) => (
          <div key={a.id} style={{ border: "1px solid #ddd", borderRadius: 10, padding: 12 }}>
            <div style={{ fontWeight: 700 }}>
              {a.is_default ? "Default address" : "Address"}
            </div>
            <div style={{ fontSize: 14 }}>{a.formatted_address}</div>
            <div style={{ fontSize: 13, color: "#666" }}>Town: {a.town}</div>
            {a.phone && <div style={{ fontSize: 13, color: "#666" }}>Phone: {a.phone}</div>}
          </div>
        ))}
      </div>

      <h2 style={{ marginTop: 20, fontWeight: 800 }}>Add / replace default address</h2>

      <form style={{ marginTop: 10, display: "grid", gap: 10 }}>
        <input
          name="formatted_address"
          placeholder="Full address (e.g. Nakuru, Section 58, near ...)"
          required
          style={{ padding: 10, border: "1px solid #ccc", borderRadius: 8 }}
        />
        <input
          name="town"
          placeholder="Town (e.g. Nakuru)"
          required
          style={{ padding: 10, border: "1px solid #ccc", borderRadius: 8 }}
        />
        <input
          name="phone"
          placeholder="Phone (optional)"
          style={{ padding: 10, border: "1px solid #ccc", borderRadius: 8 }}
        />
        <input
          name="notes"
          placeholder="Notes/landmark (optional)"
          style={{ padding: 10, border: "1px solid #ccc", borderRadius: 8 }}
        />

        <button
          formAction={saveDefaultAddress}
          style={{ padding: 10, borderRadius: 8, border: 0, background: "black", color: "white" }}
        >
          Save as default
        </button>
      </form>
    </main>
  );
}