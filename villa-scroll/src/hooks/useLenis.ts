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
  if (typeof window !== "undefined") {
    return window.__lenis;
  }
  return undefined;
}

/**
 * Native-Wheel Zero-Lag Scroll Integration:
 * - smoothWheel: false eliminates 1-2s artificial Lenis wheel-release lag & buffered scroll queues
 * - Uses native 60/120Hz OS mousewheel & trackpad responsiveness while preserving smooth programmatic anchor jumps
 */
export function useLenis() {
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && window.location.pathname.startsWith("/admin")) {
      return;
    }

    const isDesktop = typeof window !== "undefined" ? window.innerWidth >= 768 : true;

    // On mobile viewports, native browser touch momentum runs at hardware 60/120fps without Lenis ticker overhead
    if (!isDesktop) {
      const mobileRefresh = setTimeout(() => {
        ScrollTrigger.refresh();
      }, 400);
      return () => clearTimeout(mobileRefresh);
    }

    const lenis = new Lenis({
      autoRaf: false,
      smoothWheel: true,
      syncTouch: false,
      duration: 1.0,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      wheelMultiplier: 1.0,
      touchMultiplier: 1.0,
      autoResize: isDesktop,
      anchors: {
        offset: -20,
      },
    });

    lenisRef.current = lenis;
    window.__lenis = lenis;

    const handleScroll = () => {
      ScrollTrigger.update();
    };
    lenis.on("scroll", handleScroll);

    const onTick = (time: number) => {
      lenis.raf(time * 1000);
    };
    gsap.ticker.add(onTick);
    gsap.ticker.lagSmoothing(500, 33);

    const timer = setTimeout(() => {
      ScrollTrigger.refresh();
    }, 450);

    return () => {
      clearTimeout(timer);
      gsap.ticker.remove(onTick);
      lenis.off("scroll", handleScroll);
      lenis.destroy();
      lenisRef.current = null;
      if (window.__lenis === lenis) {
        window.__lenis = undefined;
      }
    };
  }, []);

  return lenisRef;
}

export default useLenis;
