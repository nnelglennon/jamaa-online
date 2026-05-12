"use client";

import { useEffect, useMemo, useState } from "react";

type AddressRow = {
  id: string;
  formatted_address: string;
  town: string;
  phone: string | null;
  is_default: boolean;
};

type ServerAction = (formData: FormData) => Promise<void>;

type ReverseGeoResp = {
  display_name?: string;
  address?: {
    city?: string;
    town?: string;
    village?: string;
    county?: string;
    state?: string;
  };
};

function guessTown(r: ReverseGeoResp | null): string {
  const a = r?.address;
  return (a?.city || a?.town || a?.village || a?.county || a?.state || "").trim();
}

export default function DeliverToModal({
  town,
  loggedIn,
  addresses,
  saveDefaultAddress,
  setDeliverTownCookiesOnly,
  setDefaultAddressById,
}: {
  town: string;
  loggedIn: boolean;
  addresses: AddressRow[];
  saveDefaultAddress: ServerAction;
  setDeliverTownCookiesOnly: ServerAction;
  setDefaultAddressById: ServerAction;
}) {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);

  // UI state
  const [showAddNew, setShowAddNew] = useState(addresses.length === 0);

  // form state
  const [townInput, setTownInput] = useState(town || "");
  const [addrInput, setAddrInput] = useState("");
  const [phoneInput, setPhoneInput] = useState("");
  const [notesInput, setNotesInput] = useState("");

  // geo state
  const [lat, setLat] = useState<string>("");
  const [lng, setLng] = useState<string>("");
  const [geoMsg, setGeoMsg] = useState<string>("");

  const hasGeo = useMemo(
    () => typeof navigator !== "undefined" && "geolocation" in navigator,
    []
  );

  function openModal() {
    setTownInput(town || "");
    setAddrInput("");
    setPhoneInput("");
    setNotesInput("");
    setLat("");
    setLng("");
    setGeoMsg("");
    setShowAddNew(addresses.length === 0);

    setMounted(true);
    requestAnimationFrame(() => setVisible(true));
  }

  function closeModal() {
    setVisible(false);
    setTimeout(() => setMounted(false), 180);
  }

  // ESC closes
  useEffect(() => {
    if (!mounted) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeModal();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mounted]);

  // Lock page scroll while modal open (modal body scrolls)
  useEffect(() => {
    if (!mounted) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mounted]);

  async function useMyLocation() {
    setGeoMsg("");
    if (!hasGeo) {
      setGeoMsg("Geolocation not supported on this device/browser.");
      return;
    }

    setGeoMsg("Getting your location…");

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const la = pos.coords.latitude;
        const lo = pos.coords.longitude;

        setLat(String(la));
        setLng(String(lo));

        // Best-effort reverse geocode for demo
        try {
          setGeoMsg("Detecting town…");
          const url =
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(
              la
            )}&lon=${encodeURIComponent(lo)}`;

          const res = await fetch(url);
          if (!res.ok) throw new Error("Reverse geocode failed");
          const json = (await res.json()) as ReverseGeoResp;

          const t = guessTown(json);
          if (t) setTownInput(t);
          if (json.display_name) setAddrInput(json.display_name);

          setGeoMsg(t ? `Location set: ${t}` : "Location set. Please type your town.");
        } catch {
          setGeoMsg("Location set. Please type your town (auto-detect failed).");
        }
      },
      (err) => setGeoMsg(err.message || "Could not get location."),
      { enableHighAccuracy: true, timeout: 12000 }
    );
  }

  return (
    <>
      <button type="button" className="underline text-xs" onClick={openModal}>
        Change
      </button>

      {mounted && (
        <div className="fixed inset-0 z-[60]">
          {/* Overlay */}
          <div
            className={`absolute inset-0 bg-black/40 transition-opacity duration-200 ${
              visible ? "opacity-100" : "opacity-0"
            }`}
            onClick={closeModal}
          />

          {/* Sheet / dialog */}
          <div
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
            className={[
              "absolute inset-x-0 bottom-0 z-[70] w-full border bg-white shadow-xl",
              "md:left-1/2 md:top-16 md:bottom-auto md:w-[92%] md:max-w-lg md:-translate-x-1/2",
              "rounded-t-2xl md:rounded-2xl",
              "transition-all duration-200 ease-out",
              visible
                ? "translate-y-0 opacity-100 md:scale-100"
                : "translate-y-full opacity-0 md:scale-95",
              // IMPORTANT: makes body scroll
              "max-h-[85vh] md:max-h-[80vh] overflow-hidden flex flex-col",
            ].join(" ")}
          >
            {/* Header */}
            <div className="p-4 border-b bg-white">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-extrabold" style={{ color: "var(--brand)" }}>
                    Select Address
                  </div>
                  <div className="mt-1 text-xs text-slate-600">
                    Some products may not be available at your nearest store. You can substitute products in your cart.
                  </div>
                </div>

                <button
                  type="button"
                  className="rounded-lg border px-3 py-1 text-sm"
                  onClick={closeModal}
                >
                  Close menu
                </button>
              </div>

              <div className="mt-3 flex items-center justify-between gap-3">
                <button
                  type="button"
                  className="rounded-lg border px-3 py-2 text-sm font-semibold"
                  onClick={useMyLocation}
                >
                  Use my current location
                </button>

                <div className="text-right text-xs text-slate-600">
                  {geoMsg ? geoMsg : "Tip: Location helps pick the right branch."}
                </div>
              </div>
            </div>

            {/* Body (scrolls) */}
            <div className="p-4 overflow-y-auto min-h-0">
              {!loggedIn ? (
                <form className="grid gap-3" action={setDeliverTownCookiesOnly}>
                  <label className="text-sm font-semibold">Town</label>
                  <input
                    name="town"
                    value={townInput}
                    onChange={(e) => setTownInput(e.target.value)}
                    placeholder="e.g. Nakuru"
                    className="w-full rounded-xl border px-3 py-2 text-sm"
                    required
                  />

                  <button
                    type="submit"
                    className="rounded-xl px-4 py-2 text-sm font-semibold text-white"
                    style={{ background: "var(--brand)" }}
                  >
                    Set location
                  </button>

                  <div className="text-xs text-slate-600">
                    Login is required to place an order for delivery.
                  </div>
                </form>
              ) : (
                <>
                  {/* Saved addresses */}
                  <div className="text-sm font-extrabold" style={{ color: "var(--brand)" }}>
                    Saved addresses
                  </div>

                  <div className="mt-2 grid gap-2">
                    {addresses.length === 0 ? (
                      <div className="rounded-xl border bg-slate-50 p-3 text-sm text-slate-600">
                        No saved addresses yet. Add one below.
                      </div>
                    ) : (
                      addresses.map((a) => (
                        <div key={a.id} className="rounded-xl border bg-white p-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="text-sm font-extrabold">
                                {a.is_default ? "Default" : "Address"}
                              </div>
                              <div className="mt-1 text-xs text-slate-600">
                                {a.formatted_address}
                              </div>
                              <div className="mt-1 text-xs text-slate-600">
                                Town: <b className="text-slate-900">{a.town}</b>
                              </div>
                            </div>

                            <form action={setDefaultAddressById}>
                              <input type="hidden" name="address_id" value={a.id} />
                              <button
                                type="submit"
                                className="rounded-lg border px-3 py-1 text-sm font-semibold"
                                onClick={closeModal}
                              >
                                Deliver here
                              </button>
                            </form>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Add new address toggle */}
                  <div className="mt-4">
                    <button
                      type="button"
                      className="w-full rounded-xl border bg-white px-4 py-2 text-sm font-semibold"
                      onClick={() => setShowAddNew((v) => !v)}
                    >
                      Add New Address
                    </button>
                  </div>

                  {/* Add new address form */}
                  {showAddNew && (
                    <div className="mt-4 rounded-xl border bg-white p-3">
                      <div className="text-sm font-extrabold" style={{ color: "var(--brand)" }}>
                        Add new address
                      </div>

                      <form className="mt-2 grid gap-3" action={saveDefaultAddress}>
                        <label className="text-sm font-semibold">Full address</label>
                        <input
                          name="formatted_address"
                          value={addrInput}
                          onChange={(e) => setAddrInput(e.target.value)}
                          placeholder="e.g. Nakuru, Section 58, near …"
                          className="w-full rounded-xl border px-3 py-2 text-sm"
                          required
                        />

                        <label className="text-sm font-semibold">Town</label>
                        <input
                          name="town"
                          value={townInput}
                          onChange={(e) => setTownInput(e.target.value)}
                          placeholder="e.g. Nakuru"
                          className="w-full rounded-xl border px-3 py-2 text-sm"
                          required
                        />

                        <input type="hidden" name="lat" value={lat} />
                        <input type="hidden" name="lng" value={lng} />

                        <label className="text-sm font-semibold">Phone (optional)</label>
                        <input
                          name="phone"
                          value={phoneInput}
                          onChange={(e) => setPhoneInput(e.target.value)}
                          placeholder="e.g. +2547..."
                          className="w-full rounded-xl border px-3 py-2 text-sm"
                        />

                        <label className="text-sm font-semibold">Notes / landmark (optional)</label>
                        <input
                          name="notes"
                          value={notesInput}
                          onChange={(e) => setNotesInput(e.target.value)}
                          placeholder="e.g. near Total petrol station"
                          className="w-full rounded-xl border px-3 py-2 text-sm"
                        />

                        <button
                          type="submit"
                          className="rounded-xl px-4 py-2 text-sm font-semibold text-white"
                          style={{ background: "var(--brand)" }}
                          onClick={closeModal}
                        >
                          Save address (set default)
                        </button>
                      </form>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}