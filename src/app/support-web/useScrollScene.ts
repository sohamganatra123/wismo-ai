"use client";
import { useEffect, useState } from "react";
export function useScrollScene() {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    let frame = 0;
    const update = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(() => { const max = document.documentElement.scrollHeight - innerHeight; setProgress(max > 0 ? Math.min(1, scrollY / max) : 0); }); };
    update(); addEventListener("scroll", update, { passive: true }); addEventListener("resize", update);
    return () => { cancelAnimationFrame(frame); removeEventListener("scroll", update); removeEventListener("resize", update); };
  }, []);
  const scene = progress < .1 ? 0 : progress < .25 ? 1 : progress < .36 ? 2 : progress < .62 ? 3 : progress < .76 ? 4 : progress < .88 ? 5 : progress < .96 ? 6 : 7;
  return { progress, scene };
}
