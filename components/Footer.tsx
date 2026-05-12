export default function Footer() {
  const email = process.env.SHOP_CONTACT_EMAIL || "shop@example.com";

  return (
    <footer className="mt-10 border-t bg-white">
      <div className="mx-auto max-w-6xl px-4 py-6 text-sm text-slate-600">
        <div className="font-semibold text-slate-900">Contact</div>
        <div>Email: {email}</div>
      </div>
    </footer>
  );
}