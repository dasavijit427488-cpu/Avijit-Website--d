"use client";

import { useEffect, useRef } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
  ScrollTrigger.config({ ignoreMobileResize: true });
}

declare global {
  interface Window {
    __lenis?: Lenis;
  }
}

export function getLenis(): Lenis | undefined {
  return undefined;
}

/**
 * Native-Wheel Zero-Lag Scroll Integration:
 * - Native browser scrolling runs on the compositor thread with zero lag
 * - Programmatic smooth scrolling uses window.scrollTo({ top, behavior: "smooth" })
 */
export function useLenis() {
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      ScrollTrigger.update();
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    gsap.ticker.lagSmoothing(0);

    const timer = setTimeout(() => {
      ScrollTrigger.refresh();
    }, 450);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return lenisRef;
}

export default useLenis;
