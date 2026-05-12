"use server";

import { redirect } from "next/navigation";
import { createClient } from "../../../lib/supabase/server";
import { createServiceClient } from "../../../lib/supabase/service";

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

  return { supabase, user };
}

function extFromFile(file: File) {
  const name = (file.name || "").toLowerCase();
  const i = name.lastIndexOf(".");
  if (i === -1) return "";
  return name.slice(i + 1);
}

function promoTypeFromFile(file: File): "image" | "pdf" | "link" {
  const t = (file.type || "").toLowerCase();
  if (t.startsWith("image/")) return "image";
  if (t === "application/pdf") return "pdf";
  // fallback
  return "link";
}

export async function createPromoFromUrl(formData: FormData) {
  const { supabase } = await requireAdmin();

  const title = String(formData.get("title") ?? "").trim();
  const asset_url = String(formData.get("asset_url") ?? "").trim();
  const asset_type = String(formData.get("asset_type") ?? "link").trim();

  if (!title || !asset_url) throw new Error("Missing title or URL");
  if (!["image", "pdf", "link"].includes(asset_type)) throw new Error("Invalid type");

  const { error } = await supabase.from("promotions").insert({
    title,
    asset_url,
    asset_type,
    active: true,
  });

  if (error) throw new Error(error.message);

  redirect("/admin/promotions");
}

export async function uploadPromoFile(formData: FormData) {
  await requireAdmin(); // ensure only admins can do this

  const title = String(formData.get("title") ?? "").trim();
  const file = formData.get("file") as File | null;

  if (!title) throw new Error("Missing title");
  if (!file) throw new Error("No file uploaded");

  // Upload using service-role server client (never expose to browser)
  const svc = createServiceClient();

  const ext = extFromFile(file);
  const safeExt = ext ? `.${ext}` : "";
  const path = `promo-${Date.now()}-${Math.random().toString(16).slice(2)}${safeExt}`;

  const arrayBuffer = await file.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);

  const { error: upErr } = await svc.storage
    .from("promos")
    .upload(path, bytes, {
      contentType: file.type || undefined,
      upsert: false,
    });

  if (upErr) throw new Error(upErr.message);

  // Public URL (bucket must be public)
  const { data: pub } = svc.storage.from("promos").getPublicUrl(path);

  if (!pub?.publicUrl) throw new Error("Could not get public URL");

  const asset_type = promoTypeFromFile(file);

  // Insert promo row using normal (RLS-respecting) admin session client
  const { supabase } = await requireAdmin();
  const { error: insErr } = await supabase.from("promotions").insert({
    title,
    asset_url: pub.publicUrl,
    asset_type,
    active: true,
  });

  if (insErr) throw new Error(insErr.message);

  redirect("/admin/promotions");
}

export async function togglePromo(formData: FormData) {
  const { supabase } = await requireAdmin();

  const id = Number(formData.get("id") ?? 0);
  const active = String(formData.get("active") ?? "false") === "true";
  if (!id) throw new Error("Missing id");

  const { error } = await supabase.from("promotions").update({ active }).eq("id", id);
  if (error) throw new Error(error.message);

  redirect("/admin/promotions");
}

export async function deletePromo(formData: FormData) {
  const { supabase } = await requireAdmin();

  const id = Number(formData.get("id") ?? 0);
  if (!id) throw new Error("Missing id");

  const { error } = await supabase.from("promotions").delete().eq("id", id);
  if (error) throw new Error(error.message);

  redirect("/admin/promotions");
}