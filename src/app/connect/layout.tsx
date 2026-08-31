import { ConvexAuthNextjsServerProvider } from "@convex-dev/auth/nextjs/server";
import type { ReactNode } from "react";
import { ConvexClientProvider } from "./ConvexClientProvider";

export default function ConnectLayout({ children }: { children: ReactNode }) {
  if (!process.env.NEXT_PUBLIC_CONVEX_URL) return children;
  return <ConvexAuthNextjsServerProvider><ConvexClientProvider>{children}</ConvexClientProvider></ConvexAuthNextjsServerProvider>;
}
