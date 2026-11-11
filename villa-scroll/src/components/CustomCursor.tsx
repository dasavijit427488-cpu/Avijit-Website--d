"use client";

import React, { useEffect, useRef, useState } from "react";
import gsap from "gsap";

export default function CustomCursor() {
  const dotRef = useRef<HTMLDivElement | null>(null);
  const ringRef = useRef<HTMLDivElement | null>(null);
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const [isVisible, setIsVisible] = useState<boolean>(false);

  useEffect(() => {
    // Disable on touch devices
    if (
      typeof window === "undefined" ||
      window.matchMedia("(pointer: coarse)").matches
    ) {
      return;
    }

    const dot = dotRef.current;
    const ring = ringRef.current;
    if (!dot || !ring) return;

    // Use gsap.quickTo for high-performance 60 FPS hardware-accelerated tracking
    const setDotX = gsap.quickTo(dot, "x", { duration: 0.08, ease: "power3.out" });
    const setDotY = gsap.quickTo(dot, "y", { duration: 0.08, ease: "power3.out" });
    const setRingX = gsap.quickTo(ring, "x", { duration: 0.28, ease: "power2.out" });
    const setRingY = gsap.quickTo(ring, "y", { duration: 0.28, ease: "power2.out" });

    const handleMouseMove = (e: MouseEvent) => {
      if (!isVisible) setIsVisible(true);
      setDotX(e.clientX);
      setDotY(e.clientY);
      setRingX(e.clientX);
      setRingY(e.clientY);
    };

    const handleMouseLeave = () => {
      setIsVisible(false);
    };

    const handleMouseEnter = () => {
      setIsVisible(true);
    };

    // Detect hover over clickable elements to enlarge the cursor ring
    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      const interactive = target.closest(
        "a, button, [role='button'], input, .cursor-pointer"
      );
      setIsHovered(!!interactive);
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    document.addEventListener("mouseleave", handleMouseLeave);
    document.addEventListener("mouseenter", handleMouseEnter);
    document.addEventListener("mouseover", handleMouseOver, { passive: true });

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseleave", handleMouseLeave);
      document.removeEventListener("mouseenter", handleMouseEnter);
      document.removeEventListener("mouseover", handleMouseOver);
    };
  }, [isVisible]);

  return (
    <>
      {/* Precision Center Dot */}
      <div
        ref={dotRef}
        className={`fixed top-0 left-0 pointer-events-none z-50 -translate-x-1/2 -translate-y-1/2 rounded-full transition-opacity duration-300 ${
          isVisible ? "opacity-100" : "opacity-0"
        } ${isHovered ? "w-1.5 h-1.5 bg-emerald-300" : "w-1 h-1 bg-white"}`}
        style={{ willChange: "transform" }}
      />

      {/* Smooth Trailing Luxury Ring */}
      <div
        ref={ringRef}
        className={`fixed top-0 left-0 pointer-events-none z-50 -translate-x-1/2 -translate-y-1/2 rounded-full border transition-all duration-300 ease-out ${
          isVisible ? "opacity-100" : "opacity-0"
        } ${
          isHovered
            ? "w-12 h-12 border-emerald-400/80 bg-emerald-500/10 backdrop-blur-[1px] shadow-[0_0_15px_rgba(52,211,153,0.3)]"
            : "w-8 h-8 border-white/30 bg-transparent"
        }`}
        style={{ willChange: "transform" }}
      />
    </>
  );
}

