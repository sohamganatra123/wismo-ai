"use client";
import { useEffect, useState } from "react";
import type { EventSource, SupportSnapshot } from "./types";
const INITIAL: SupportSnapshot = { tickets: [], handled: 37, endToEnd: 84 };
export function useSupportSimulation(source: EventSource) {
  const [snapshot, setSnapshot] = useState(INITIAL);
  useEffect(() => { const unsubscribe = source.subscribe(setSnapshot); source.start(); return () => { unsubscribe(); source.stop(); }; }, [source]);
  return snapshot;
}
