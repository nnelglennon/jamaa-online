import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "../../lib/supabase/server";
import CheckoutClient from "./ui";

export default async function CheckoutPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: addr } = await supabase
    .from("addresses")
    .select("formatted_address, town, is_default")
    .eq("user_id", user.id)
    .eq("is_default", true)
    .maybeSingle();

  return (
    <div className="mx-auto max-w-md">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-lg font-extrabold" style={{ color: "var(--brand)" }}>
            Checkout
          </h1>
        </div>
        <Link className="text-sm underline" href="/cart">Back to cart</Link>
      </div>

      {!addr ? (
        <div className="mt-6 rounded-2xl border bg-amber-50 p-6 text-center">
          <p className="text-amber-800">You need a delivery address first.</p>
          <Link
            href="/deliver-to"
            className="mt-4 inline-block rounded-xl bg-black px-6 py-2 text-sm font-semibold text-white"
          >
            Set Delivery Address
          </Link>
        </div>
      ) : (
        <>
          <div className="mt-4 rounded-2xl border bg-white p-4 shadow-sm">
            <div className="text-sm font-semibold">Delivering to</div>
            <div className="mt-1 text-sm">{addr.formatted_address}</div>
            <div className="text-xs text-slate-600">Town: {addr.town}</div>
            <Link href="/deliver-to" className="mt-3 text-xs underline">
              Change address
            </Link>
          </div>

          <CheckoutClient />
        </>
      )}
    </div>
  );
}