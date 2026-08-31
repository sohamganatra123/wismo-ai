import type { Metadata } from "next";
import { IBM_Plex_Mono, Inter, Manrope } from "next/font/google";
import "./globals.css";

const display = Manrope({ subsets: ["latin"], variable: "--font-manrope", display: "swap" });
const body = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const data = IBM_Plex_Mono({ subsets: ["latin"], weight: ["500", "600"], variable: "--font-plex", display: "swap" });

export const metadata: Metadata = {
  title: "WISMO — Get delivery questions off your list",
  description: "Fast, accurate order updates for customers. Less manual investigation for Shopify support teams.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return <html lang="en"><body className={`${display.variable} ${body.variable} ${data.variable}`}>{children}</body></html>;
}
