"use client";
import { useEffect, useState } from "react";

/**
 * True above the phone breakpoint (641 px and up). Phone-only disclosures start closed on a phone and
 * open everywhere else; before hydration the answer is "wide", so the static HTML shows everything.
 */
export function useWide(): boolean {
  const [wide, setWide] = useState(true);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 641px)");
    const apply = () => setWide(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);
  return wide;
}
