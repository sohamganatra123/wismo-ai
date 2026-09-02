import type { Metadata } from "next";
import RealSetupJourney from "../connect/RealSetupJourney";

export const metadata: Metadata = {
  title: "Set up WISMO",
  description: "Sign in, connect Gmail and Shopify, and finish the founder onboarding journey.",
  alternates: { canonical: "/setup" },
};

export default function SetupPage() {
  return <RealSetupJourney configured={Boolean(process.env.NEXT_PUBLIC_CONVEX_URL)} />;
}
