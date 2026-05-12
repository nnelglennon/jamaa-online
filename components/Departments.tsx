import Link from "next/link";

type Category = { id: number; name: string };

export default function Departments({
  categories,
  activeId,
}: {
  categories: Category[];
  activeId: number | null;
}) {
  function chipStyle(active: boolean) {
    return active
      ? { background: "var(--brand)", borderColor: "var(--brand)", color: "white" }
      : {};
  }

  return (
    <div className="mt-4">
      <div className="text-sm font-extrabold" style={{ color: "var(--brand)" }}>
        Departments
      </div>

      <div className="mt-2 flex gap-2 overflow-x-auto pb-2">
        <Link
          href="/"
          className="whitespace-nowrap rounded-full border px-3 py-1 text-sm"
          style={chipStyle(activeId === null)}
        >
          All
        </Link>

        {categories.map((c) => (
          <Link
            key={c.id}
            href={`/?cat=${c.id}`}
            className="whitespace-nowrap rounded-full border px-3 py-1 text-sm"
            style={chipStyle(activeId === c.id)}
          >
            {c.name}
          </Link>
        ))}
      </div>
    </div>
  );
}