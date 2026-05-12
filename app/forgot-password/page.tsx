"use client";

import Link from "next/link";
import { useState } from "react";
import { createClient } from "../../lib/supabase/client";

export default function ForgotPasswordPage() {
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function sendReset(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setMsg(null);

    const redirectTo = `${window.location.origin}/reset-password`;

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });

    if (error) return setErr(error.message);
    setMsg("Password reset link sent. Check your email.");
  }

  return (
    <div className="mx-auto max-w-md">
      <h1 className="text-lg font-extrabold" style={{ color: "var(--brand)" }}>
        Reset password
      </h1>
      <p className="mt-1 text-sm text-slate-600">
        Enter your email and we’ll send you a reset link.
      </p>

      <form onSubmit={sendReset} className="mt-4 rounded-xl border bg-white p-4 shadow-sm">
        <label className="text-sm font-semibold">Email</label>
        <input
          className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        {err && <div className="mt-3 text-sm text-red-600">{err}</div>}
        {msg && <div className="mt-3 text-sm text-green-700">{msg}</div>}

        <button
          className="mt-4 w-full rounded-lg px-4 py-2 text-sm font-semibold text-white"
          style={{ background: "var(--brand)" }}
        >
          Send reset link
        </button>

        <div className="mt-3 text-sm">
          Back to <Link className="underline" href="/login">Login</Link>
        </div>
      </form>
    </div>
  );
}