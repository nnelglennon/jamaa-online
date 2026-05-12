import Link from "next/link";
import { cookies } from "next/headers";
import CartBadge from "./CartBadge";
import DeliverToModal from "./DeliverToModal";
import { createClient } from "../lib/supabase/server";

import {
  saveDefaultAddress,
  setDeliverTownCookiesOnly,
  setDefaultAddressById,
} from "../app/deliver-to/actions";

function initialFromEmail(email: string | null | undefined) {
  if (!email) return "A";
  return email.trim().charAt(0).toUpperCase() || "A";
}

type AddressRow = {
  id: string;
  formatted_address: string;
  town: string;
  phone: string | null;
  is_default: boolean;
};

export default async function Header() {
  const cookieStore = await cookies();
  const town = cookieStore.get("delivery_town")?.value ?? "";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const loggedIn = !!user;
  const badgeInitial = initialFromEmail(user?.email);

  let addresses: AddressRow[] = [];
  if (loggedIn && user) {
    const { data } = await supabase
      .from("addresses")
      .select("id, formatted_address, town, phone, is_default")
      .eq("user_id", user.id)
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: false });

    addresses = (data ?? []) as AddressRow[];
  }

  return (
    <header className="sticky top-0 z-50 border-b bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2">
        <div className="min-w-0">
          <Link href="/" className="flex items-center gap-2">
            <img
              src="/jamaa-logo.png"
              alt="Jamaa"
              className="h-12 w-auto max-w-[180px] object-contain"
            />
            <span className="text-base font-extrabold tracking-tight" style={{ color: "var(--brand)" }}>
              JAMAA Online
            </span>
          </Link>

          {/* Enclosed Deliver-to pill */}
          <div className="mt-2 inline-flex max-w-full items-center gap-2 rounded-full border bg-slate-50 px-3 py-1 text-xs text-slate-700">
            <span className="truncate">
              Deliver to: <b className="text-slate-900">{town || "Set location"}</b>
            </span>

            <DeliverToModal
              town={town}
              loggedIn={loggedIn}
              addresses={addresses}
              saveDefaultAddress={saveDefaultAddress}
              setDeliverTownCookiesOnly={setDeliverTownCookiesOnly}
              setDefaultAddressById={setDefaultAddressById}
            />
          </div>
        </div>

        {/* Desktop search */}
        <form action="/search" className="hidden w-full max-w-xl md:block">
          <input
            name="q"
            placeholder="Search products…"
            className="w-full rounded-full border bg-white px-4 py-2 text-sm outline-none focus:ring-2"
          />
        </form>

        {/* Right nav */}
        <nav className="flex items-center gap-4">
          <Link href="/promotions" className="text-sm underline">
            Promos
          </Link>

          <Link href="/search" className="text-sm underline md:hidden">
            Search
          </Link>

          <CartBadge />

          {!loggedIn ? (
            <>
              <Link href="/login" className="text-sm underline">Login</Link>
              <Link href="/signup" className="text-sm underline">Sign up</Link>
            </>
          ) : (
            <>
              <Link
                href="/orders"
                className="inline-flex items-center gap-2 rounded-full border bg-white px-2 py-1 text-sm"
                title={user?.email ?? "Account"}
              >
                <span
                  className="grid h-7 w-7 place-items-center rounded-full text-xs font-extrabold text-white"
                  style={{ background: "var(--brand)" }}
                >
                  {badgeInitial}
                </span>
                <span className="hidden sm:inline">Account</span>
              </Link>

              <Link href="/logout" className="text-sm underline">
                Logout
              </Link>
            </>
          )}
        </nav>
      </div>

      {/* Mobile search */}
      <div className="mx-auto max-w-6xl px-4 pb-3 md:hidden">
        <form action="/search">
          <input
            name="q"
            placeholder="Search products…"
            className="w-full rounded-full border bg-white px-4 py-2 text-sm outline-none focus:ring-2"
          />
        </form>
      </div>
    </header>
  );
}