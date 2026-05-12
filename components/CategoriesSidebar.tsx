import Link from "next/link";

type Category = { id: number; name: string };

export default function CategoriesSidebar({
  categories,
  activeId,
}: {
  categories: Category[];
  activeId: number | null;
}) {
  const activeStyle = {
    background: "var(--brand)",
    borderColor: "var(--brand)",
    color: "white",
  } as const;

  return (
    <aside className="rounded-2xl border bg-white p-3 shadow-sm">
      <div className="text-sm font-extrabold" style={{ color: "var(--brand)" }}>
        Categories
      </div>

      <div className="mt-3 grid gap-2">
        <Link
          href="/"
          className="rounded-xl border px-3 py-2 text-sm font-semibold"
          style={activeId === null ? activeStyle : {}}
        >
          All products
        </Link>

        {categories.map((c) => (
          <Link
            key={c.id}
            href={`/?cat=${c.id}`}
            className="rounded-xl border px-3 py-2 text-sm"
            style={activeId === c.id ? activeStyle : {}}
          >
            {c.name}
          </Link>
        ))}
      </div>

      <div className="mt-4 text-xs text-slate-600">
        Tip: your delivery location affects stock availability.
      </div>
    </aside>
  );
}