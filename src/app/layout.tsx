import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "WISMO — Delivery questions, investigated",
  description: "WISMO investigates where-is-my-order requests and prepares evidence-backed next actions for manager approval.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return <html lang="en"><body>{children}</body></html>;
}
