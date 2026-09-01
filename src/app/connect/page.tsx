import WaitlistForm from "./WaitlistForm";

export const metadata = { title: "WISMO Waitlist" };

export default function ConnectMailboxPage() {
  return <WaitlistForm configured={Boolean(process.env.NEXT_PUBLIC_CONVEX_URL)} />;
}
