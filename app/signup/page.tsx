"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../lib/supabase/client";

export default function SignupPage() {
  const supabase = createClient();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);

  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setMsg(null);

    const { error } = await supabase.auth.signUp({ email, password });
    if (error) return setErr(error.message);

    setMsg("Account created. You can now log in.");
    router.push("/login");
  }

  return (
    <div className="mx-auto max-w-md">
      <h1 className="text-lg font-extrabold" style={{ color: "var(--brand)" }}>
        Sign up
      </h1>
      <p className="mt-1 text-sm text-slate-600">Create an account to get deliveries.</p>

      <form onSubmit={onSubmit} className="mt-4 rounded-xl border bg-white p-4 shadow-sm">
        <label className="text-sm font-semibold">Email</label>
        <input
          className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <label className="mt-3 block text-sm font-semibold">Password</label>
        <div className="relative mt-1">
          <input
            className="w-full rounded-lg border px-3 py-2 pr-16 text-sm"
            placeholder="Choose a strong password"
            type={showPw ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            type="button"
            onClick={() => setShowPw((v) => !v)}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full border bg-white px-3 py-1 text-xs font-semibold"
          >
            {showPw ? "Hide" : "Show"}
          </button>
        </div>

        {err && <div className="mt-3 text-sm text-red-600">{err}</div>}
        {msg && <div className="mt-3 text-sm text-green-700">{msg}</div>}

        <button
          className="mt-4 w-full rounded-lg px-4 py-2 text-sm font-semibold text-white"
          style={{ background: "var(--brand)" }}
        >
          Create account
        </button>

        <div className="mt-3 text-sm">
          Already have an account?{" "}
          <Link className="underline" href="/login">
            Login
          </Link>
        </div>
      </form>
    </div>
  );
}