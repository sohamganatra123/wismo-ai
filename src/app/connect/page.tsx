import type { Metadata } from "next";
import WaitlistForm from "./WaitlistForm";

export const metadata: Metadata = {
  title: "Join Wismo.ai early access",
  description: "Request early access to Wismo for Shopify support teams. Start with one work email; permissions and connection details come later.",
  alternates: { canonical: "/connect" },
};

export default function ConnectMailboxPage() {
  return <WaitlistForm configured={Boolean(process.env.NEXT_PUBLIC_CONVEX_URL)} />;
}
