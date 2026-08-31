import RealSetupJourney from "./RealSetupJourney";

export const metadata = { title: "Connect WISMO" };

export default function ConnectMailboxPage() {
  return <RealSetupJourney configured={Boolean(process.env.NEXT_PUBLIC_CONVEX_URL)} />;
}
