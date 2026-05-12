"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../lib/supabase/client";

export default function LogoutPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    supabase.auth.signOut().finally(() => {
      router.push("/");
      router.refresh();
    });
  }, [router, supabase]);

  return <div className="p-6">Signing out...</div>;
}