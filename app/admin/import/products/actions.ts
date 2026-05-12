"use server";

import { redirect } from "next/navigation";
import { createClient } from "../../../../lib/supabase/server";

async function requireAdmin() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (error) throw new Error(error.message);
  if (profile?.role !== "admin") throw new Error("403 — Admins only");

  return supabase;
}

// Small CSV parser that supports quotes.
function parseCsv(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cur = "";
  let inQuotes = false;

  function pushCell() {
    row.push(cur);
    cur = "";
  }

  function pushRow() {
    // ignore empty trailing row
    if (row.length === 1 && row[0].trim() === "") return;
    rows.push(row);
    row = [];
  }

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];

    if (inQuotes) {
      if (ch === '"') {
        const next = text[i + 1];
        if (next === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cur += ch;
      }
    } else {
      if (ch === '"') inQuotes = true;
      else if (ch === ",") pushCell();
      else if (ch === "\n") {
        pushCell();
        pushRow();
      } else if (ch !== "\r") cur += ch;
    }
  }

  // last cell/row
  pushCell();
  pushRow();

  if (rows.length === 0) return [];

  const headers = rows[0].map((h) => h.trim());
  const out: Record<string, string>[] = [];

  for (const r of rows.slice(1)) {
    const obj: Record<string, string> = {};
    headers.forEach((h, idx) => {
      obj[h] = (r[idx] ?? "").trim();
    });
    out.push(obj);
  }

  return out;
}

export async function importProductsCsv(formData: FormData) {
  const supabase = await requireAdmin();

  const file = formData.get("file") as File | null;
  if (!file) throw new Error("No file uploaded");

  const text = await file.text();
  const items = parseCsv(text);

  // Expected headers:
  // category, sku, name, brand, description, price, image_url, active
  const cleaned = items
    .map((r) => ({
      category: (r["category"] ?? "").trim(),
      sku: (r["sku"] ?? "").trim(),
      name: (r["name"] ?? "").trim(),
      brand: (r["brand"] ?? "").trim(),
      description: (r["description"] ?? "").trim(),
      price: Number((r["price"] ?? "").trim() || "0"),
      image_url: (r["image_url"] ?? "").trim(),
      active: (r["active"] ?? "").trim().toLowerCase(),
    }))
    .filter((r) => r.sku && r.name && Number.isFinite(r.price));

  if (cleaned.length === 0) {
    throw new Error("No valid rows. Ensure CSV has headers and at least sku,name,price.");
  }

  // 1) Upsert categories
  const categoryNames = Array.from(new Set(cleaned.map((r) => r.category).filter(Boolean)));
  if (categoryNames.length > 0) {
    const { error: catUpErr } = await supabase
      .from("categories")
      .upsert(categoryNames.map((name) => ({ name })), { onConflict: "name" });

    if (catUpErr) throw new Error(catUpErr.message);
  }

  // 2) Load category IDs
  const { data: cats, error: catSelErr } = await supabase
    .from("categories")
    .select("id,name")
    .in("name", categoryNames.length ? categoryNames : ["__none__"]);

  if (catSelErr) throw new Error(catSelErr.message);

  const catMap = new Map<string, number>((cats ?? []).map((c: any) => [String(c.name), Number(c.id)]));

  // 3) Upsert products by SKU
  const productRows = cleaned.map((r) => ({
    category_id: r.category ? (catMap.get(r.category) ?? null) : null,
    sku: r.sku,
    name: r.name,
    brand: r.brand || null,
    description: r.description || null,
    price: r.price,
    image_url: r.image_url || null,
    active: r.active === "" ? true : r.active !== "false",
  }));

  const { error: prodErr } = await supabase
    .from("products")
    .upsert(productRows, { onConflict: "sku" });

  if (prodErr) throw new Error(prodErr.message);

  redirect(`/admin/import/products?done=1&rows=${encodeURIComponent(String(productRows.length))}`);
}