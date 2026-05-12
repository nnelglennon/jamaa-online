"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import Dots from "./Dots";

export default function LinkWithDots({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      className={className}
      onClick={() => startTransition(() => router.push(href))}
    >
      <span className="inline-flex items-center gap-2">
        {children}
        {pending && <Dots size="sm" />}
      </span>
    </button>
  );
}