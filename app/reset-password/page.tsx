"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../lib/supabase/client";

export default function ResetPasswordPage() {
  const supabase = createClient();
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // After user clicks email recovery link, Supabase should establish a session in browser.
    supabase.auth.getSession().then(({ data }) => {
      setReady(true);
      if (!data.session) {
        setErr("No recovery session found. Please request a new reset link.");
      }
    });
  }, [supabase]);

  async function updatePassword(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setMsg(null);

    const { error } = await supabase.auth.updateUser({ password });
    if (error) return setErr(error.message);

    setMsg("Password updated. Please login.");
    router.push("/login");
  }

  return (
    <div className="mx-auto max-w-md">
      <h1 className="text-lg font-extrabold" style={{ color: "var(--brand)" }}>
        Choose a new password
      </h1>

      <form onSubmit={updatePassword} className="mt-4 rounded-xl border bg-white p-4 shadow-sm">
        <label className="text-sm font-semibold">New password</label>
        <input
          className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
          placeholder="New password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={!ready}
        />

        {err && <div className="mt-3 text-sm text-red-600">{err}</div>}
        {msg && <div className="mt-3 text-sm text-green-700">{msg}</div>}

        <button
          className="mt-4 w-full rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          style={{ background: "var(--brand)" }}
          disabled={!ready}
        >
          Update password
        </button>

        <div className="mt-3 text-sm">
          Back to <Link className="underline" href="/login">Login</Link>
        </div>
      </form>
    </div>
  );
}