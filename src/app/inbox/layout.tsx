import { ConvexAuthNextjsServerProvider } from "@convex-dev/auth/nextjs/server";
import { ConvexClientProvider } from "../connect/ConvexClientProvider";

export default function InboxLayout({ children }: { children: React.ReactNode }) {
  if (!process.env.NEXT_PUBLIC_CONVEX_URL) return children;
  return <ConvexAuthNextjsServerProvider><ConvexClientProvider>{children}</ConvexClientProvider></ConvexAuthNextjsServerProvider>;
}
