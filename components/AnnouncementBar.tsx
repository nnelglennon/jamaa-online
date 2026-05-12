export default function AnnouncementBar() {
  const msg = process.env.SHOP_ANNOUNCEMENT || "";

  if (!msg.trim()) return null;

  return (
    <div className="border-b bg-amber-50">
      <div className="mx-auto max-w-6xl px-4 py-2 text-sm text-amber-900">
        <b>Notice:</b> {msg}
      </div>
    </div>
  );
}