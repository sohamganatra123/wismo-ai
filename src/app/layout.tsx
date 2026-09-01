import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { Archivo, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const archivo = Archivo({ subsets: ["latin"], variable: "--font-archivo", display: "swap" });
const plexMono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-plex-mono", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL("https://wismo.ai"),
  title: "Wismo.ai — Autonomous WISMO resolution for Shopify",
  description: "Wismo finds the right Shopify order, verifies the newest courier status, and resolves ‘where is my order?’ emails. Autonomous sending unlocks by safety gate.",
  openGraph: {
    title: "Wismo.ai — Autonomous WISMO resolution",
    description: "The order question goes in. A verified answer comes out. Autonomous sending unlocks by safety gate.",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body className={`${archivo.variable} ${plexMono.variable}`}>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
