import type { Metadata } from "next";
import PrototypeWorkbench from "./PrototypeWorkbench";

export const metadata: Metadata = {
  title: "Working prototype · WISMO",
  description: "Test WISMO's Gmail and orders.csv decision workflow.",
};

export default function PrototypePage() {
  return <PrototypeWorkbench />;
}
