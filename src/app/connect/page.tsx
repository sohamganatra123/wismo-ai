import type { Metadata } from "next";
import { redirect } from "next/navigation";
import WaitlistForm from "./WaitlistForm";

export const metadata: Metadata = {
  title: "Join Wismo.ai early access",
  description: "Request early access to Wismo for Shopify support teams. Start with one work email; permissions and connection details come later.",
  alternates: { canonical: "/connect" },
};

export default async function ConnectMailboxPage({
  searchParams,
}: {
  searchParams: Promise<{ gmail?: string; reason?: string }>;
}) {
  const params = await searchParams;
  const query = new URLSearchParams();
  if (params.gmail) query.set("gmail", params.gmail);
  if (params.reason) query.set("reason", params.reason);
  if (query.size > 0) redirect(`/setup?${query.toString()}`);
  return <WaitlistForm configured={Boolean(process.env.NEXT_PUBLIC_CONVEX_URL)} />;
}
