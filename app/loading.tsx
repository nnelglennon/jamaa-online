import Dots from "../components/Dots";

export default function Loading() {
  return (
    <div className="fixed inset-0 z-[80] grid place-items-center bg-white/70 backdrop-blur">
      <div className="rounded-2xl border bg-white px-5 py-4 shadow-sm">
        <div className="text-sm font-semibold text-slate-700">Loading</div>
        <div className="mt-2"><Dots /></div>
      </div>
    </div>
  );
}