"use client";

import { track } from "@vercel/analytics";
import Link from "next/link";
import type { ReactNode } from "react";

export function TrackedCta({
  href,
  location,
  className,
  children,
}: {
  href: "/connect";
  location: "navigation" | "hero" | "final";
  className: string;
  children: ReactNode;
}) {
  return (
    <Link
      className={className}
      href={href}
      onClick={() => track("CTA Click", { destination: href, location })}
    >
      {children}
    </Link>
  );
}
