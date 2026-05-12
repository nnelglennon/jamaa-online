export default function Dots({ size = "md" }: { size?: "sm" | "md" }) {
  const dot = size === "sm" ? "h-1.5 w-1.5" : "h-2 w-2";
  return (
    <span className="inline-flex items-center gap-1">
      <span className={`${dot} animate-bounce rounded-full bg-slate-900 [animation-delay:-0.2s]`} />
      <span className={`${dot} animate-bounce rounded-full bg-slate-900 [animation-delay:-0.1s]`} />
      <span className={`${dot} animate-bounce rounded-full bg-slate-900`} />
    </span>
  );
}