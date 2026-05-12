import "./globals.css";
import Header from "../components/Header";
import Footer from "../components/Footer";
import AskLocationOnVisit from "../components/AskLocationOnVisit";

export const metadata = {
  title: "Jamaa Supermarket",
  description: "Online ordering",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900">
        <AskLocationOnVisit />
        <Header />
        <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
        <Footer />
      </body>
    </html>
  );
}