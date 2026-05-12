type OrderStatus =
  | "new"
  | "paid"
  | "picking"
  | "packed"
  | "out_for_delivery"
  | "delivered"
  | "cancelled";

export default function StatusPill({ status }: { status: string }) {
  const s = status as OrderStatus;

  const base =
    "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold border";

  const cls =
    s === "delivered"
      ? "bg-green-50 text-green-800 border-green-200"
      : s === "cancelled"
      ? "bg-rose-50 text-rose-800 border-rose-200"
      : s === "out_for_delivery"
      ? "bg-blue-50 text-blue-800 border-blue-200"
      : s === "packed" || s === "picking"
      ? "bg-amber-50 text-amber-900 border-amber-200"
      : s === "paid"
      ? "bg-emerald-50 text-emerald-800 border-emerald-200"
      : "bg-slate-50 text-slate-700 border-slate-200";

  return (
    <span className={`${base} ${cls}`}>
      {String(status).replaceAll("_", " ")}
    </span>
  );
}