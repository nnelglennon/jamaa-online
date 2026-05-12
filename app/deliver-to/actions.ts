"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "../../lib/supabase/server";

function toOptionalNumber(v: FormDataEntryValue | null): number | null {
  if (v === null) return null;
  const s = String(v).trim();
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

// Logged-in users: save full address to DB (and set default)
export async function saveDefaultAddress(formData: FormData) {
  const formatted_address = String(formData.get("formatted_address") ?? "").trim();
  const town = String(formData.get("town") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  const lat = toOptionalNumber(formData.get("lat"));
  const lng = toOptionalNumber(formData.get("lng"));

  if (!formatted_address || !town) redirect("/");

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // unset existing defaults
  const { error: clearErr } = await supabase
    .from("addresses")
    .update({ is_default: false })
    .eq("user_id", user.id);

  if (clearErr) throw new Error(clearErr.message);

  // insert new default address
  const { error: insertErr } = await supabase.from("addresses").insert({
    user_id: user.id,
    label: "Default",
    formatted_address,
    town,
    phone: phone || null,
    notes: notes || null,
    lat,
    lng,
    is_default: true,
  });

  if (insertErr) throw new Error(insertErr.message);

  // route to branch + cookies
  const { data: branchId, error: routeErr } = await supabase.rpc("route_fulfillment_branch", {
    in_town: town,
  });

  if (routeErr) throw new Error(routeErr.message);

  const cookieStore = await cookies();
  cookieStore.set("delivery_town", town, { path: "/", sameSite: "lax" });
  if (branchId) {
    cookieStore.set("fulfillment_branch_id", String(branchId), { path: "/", sameSite: "lax" });
  }

  redirect("/");
}

// Logged-out users: set cookies only (town -> branch)
export async function setDeliverTownCookiesOnly(formData: FormData) {
  const town = String(formData.get("town") ?? "").trim();
  if (!town) redirect("/");

  const supabase = await createClient();

  const { data: branchId, error: routeErr } = await supabase.rpc("route_fulfillment_branch", {
    in_town: town,
  });

  if (routeErr) throw new Error(routeErr.message);

  const cookieStore = await cookies();
  cookieStore.set("delivery_town", town, { path: "/", sameSite: "lax" });
  if (branchId) {
    cookieStore.set("fulfillment_branch_id", String(branchId), { path: "/", sameSite: "lax" });
  }

  redirect("/");
}

// Logged-in users: choose a saved address as default (Deliver here)
export async function setDefaultAddressById(formData: FormData) {
  const addressId = String(formData.get("address_id") ?? "").trim();
  if (!addressId) redirect("/");

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // verify address belongs to this user
  const { data: addr, error: addrErr } = await supabase
    .from("addresses")
    .select("id, town")
    .eq("id", addressId)
    .eq("user_id", user.id)
    .single();

  if (addrErr) throw new Error(addrErr.message);

  // clear defaults
  const { error: clearErr } = await supabase
    .from("addresses")
    .update({ is_default: false })
    .eq("user_id", user.id);

  if (clearErr) throw new Error(clearErr.message);

  // set this as default
  const { error: setErr } = await supabase
    .from("addresses")
    .update({ is_default: true })
    .eq("id", addr.id)
    .eq("user_id", user.id);

  if (setErr) throw new Error(setErr.message);

  // route + cookies
  const { data: branchId, error: routeErr } = await supabase.rpc("route_fulfillment_branch", {
    in_town: addr.town,
  });

  if (routeErr) throw new Error(routeErr.message);

  const cookieStore = await cookies();
  cookieStore.set("delivery_town", addr.town, { path: "/", sameSite: "lax" });
  if (branchId) {
    cookieStore.set("fulfillment_branch_id", String(branchId), { path: "/", sameSite: "lax" });
  }

  redirect("/");
}