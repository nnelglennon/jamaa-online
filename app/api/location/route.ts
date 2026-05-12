import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const town = String(body.town ?? "").trim();

  const res = NextResponse.json({ ok: true });

  if (town) {
    res.cookies.set("delivery_town", town, { path: "/", sameSite: "lax" });
    // clear branch cookie so server can re-route cleanly
    res.cookies.set("fulfillment_branch_id", "", { path: "/", maxAge: 0 });
  }

  return res;
}