"use client";

import React, { useEffect, useRef } from "react";
import Image from "next/image";
import { useSiteConfig } from "@/context/SiteConfigContext";

interface Sculpture3DConfig {
  id: number;
  kind: "diamond" | "helix" | "chevron" | "compass";
  baseX: string;
  baseY: string;
  size: number;
  floatSpeed: number;
  rotSpeedX: number;
  rotSpeedY: number;
  scrollTravel: number;
  mobileHide?: boolean;
}

const FAST_3D_SCULPTURES: Sculpture3DConfig[] = [
  { id: 1, kind: "diamond", baseX: "2.5%", baseY: "14%", size: 108, floatSpeed: 1.5, rotSpeedX: 58, rotSpeedY: 88, scrollTravel: 480 },
  { id: 2, kind: "compass", baseX: "86%", baseY: "15%", size: 126, floatSpeed: 1.4, rotSpeedX: 66, rotSpeedY: 96, scrollTravel: -540 },
  { id: 3, kind: "helix", baseX: "4%", baseY: "50%", size: 118, floatSpeed: 1.7, rotSpeedX: 72, rotSpeedY: 110, scrollTravel: 580 },
  { id: 4, kind: "chevron", baseX: "87%", baseY: "52%", size: 112, floatSpeed: 1.6, rotSpeedX: 62, rotSpeedY: 94, scrollTravel: -520 },
  { id: 5, kind: "diamond", baseX: "85%", baseY: "80%", size: 102, floatSpeed: 1.8, rotSpeedX: 76, rotSpeedY: 115, scrollTravel: 460 },
  { id: 6, kind: "compass", baseX: "3.5%", baseY: "80%", size: 114, floatSpeed: 1.55, rotSpeedX: 64, rotSpeedY: 90, scrollTravel: -560 },
  { id: 7, kind: "helix", baseX: "48%", baseY: "10%", size: 96, floatSpeed: 1.45, rotSpeedX: 68, rotSpeedY: 102, scrollTravel: 440, mobileHide: true },
];

export default function MarbleScrollBackdrop({
  forceEnable3D = false,
}: {
  forceEnable3D?: boolean;
}) {
  const { config } = useSiteConfig();
  const animCfg = config.design?.animation;
  const show3dObjects = forceEnable3D ? true : (animCfg?.enable3dObjects ?? true);
  const objectsSpeedMult =
    animCfg?.objectsSpeed === "slow"
      ? 0.55
      : animCfg?.objectsSpeed === "fast"
        ? 1.75
        : 1.0;

  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const marbleImgRef = useRef<HTMLDivElement | null>(null);
  const flare1Ref = useRef<HTMLDivElement | null>(null);
  const flare2Ref = useRef<HTMLDivElement | null>(null);
  const objRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    let targetProgress = 0;
    let smoothedProgress = 0;
    let rafId = 0;
    let isInView = false;
    const startTime = performance.now();

    const readScrollTarget = () => {
      if (!isInView) return;
      const el = wrapperRef.current?.parentElement;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const totalScrollable = Math.max(el.offsetHeight - window.innerHeight, 1);
      const scrolledInside = Math.max(0, -rect.top);
      targetProgress = Math.min(1, Math.max(0, scrolledInside / totalScrollable));
    };

    const tick = (now: number) => {
      if (!isInView) {
        rafId = 0;
        return;
      }
      const elapsedSec = (now - startTime) * 0.001;

      // Brisk smoothed damping responds quickly without wheel jitter
      smoothedProgress += (targetProgress - smoothedProgress) * 0.14;

      if (marbleImgRef.current) {
        const scale = 1.06 + smoothedProgress * 0.12;
        const translateY = -smoothedProgress * 60;
        const translateX = Math.sin(smoothedProgress * Math.PI * 1.4) * 26;
        marbleImgRef.current.style.transform = `translate3d(${translateX.toFixed(2)}px, ${translateY.toFixed(2)}px, 0) scale(${scale.toFixed(4)})`;
      }

      if (flare1Ref.current) {
        const x = Math.sin(smoothedProgress * Math.PI) * 110;
        const y = smoothedProgress * 140;
        flare1Ref.current.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
      }

      if (flare2Ref.current) {
        const x = -Math.cos(smoothedProgress * Math.PI) * 90;
        const y = -smoothedProgress * 110;
        flare2Ref.current.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
      }

      for (let i = 0; i < FAST_3D_SCULPTURES.length; i++) {
        const node = objRefs.current[i];
        const cfg = FAST_3D_SCULPTURES[i];
        if (!node || !cfg) continue;

        const floatX = Math.sin(elapsedSec * cfg.floatSpeed * objectsSpeedMult + cfg.id * 1.3) * 22;
        const floatY =
          Math.cos(elapsedSec * cfg.floatSpeed * 0.9 * objectsSpeedMult + cfg.id) * 24 +
          smoothedProgress * cfg.scrollTravel * 0.55;
        const rx = elapsedSec * cfg.rotSpeedX * objectsSpeedMult + smoothedProgress * 460;
        const ry = elapsedSec * cfg.rotSpeedY * objectsSpeedMult + smoothedProgress * 620;

        node.style.transform = `translate3d(${floatX.toFixed(2)}px, ${floatY.toFixed(2)}px, 0) rotateX(${rx.toFixed(1)}deg) rotateY(${ry.toFixed(1)}deg)`;
      }

      rafId = requestAnimationFrame(tick);
    };

    const startRaf = () => {
      if (!rafId && isInView) {
        rafId = requestAnimationFrame(tick);
      }
    };

    const parentEl = wrapperRef.current?.parentElement;
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        isInView = Boolean(entry?.isIntersecting);
        if (isInView) {
          readScrollTarget();
          smoothedProgress = targetProgress;
          startRaf();
        } else if (rafId) {
          cancelAnimationFrame(rafId);
          rafId = 0;
        }
      },
      { rootMargin: "250px 0px" }
    );

    if (parentEl) {
      observer.observe(parentEl);
    }

    window.addEventListener("scroll", readScrollTarget, { passive: true });
    readScrollTarget();
    smoothedProgress = targetProgress;

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", readScrollTarget);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [objectsSpeedMult]);

  return (
    <div
      ref={wrapperRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-0 overflow-clip"
    >
      {/* Sticky Full-Viewport 4K Bright White Calacatta Gold Marble Canvas */}
      <div className="sticky top-0 h-screen w-full overflow-hidden bg-[#faf7f0]">
        {/* Parallax Bright White Marble Texture */}
        <div
          ref={marbleImgRef}
          className="absolute -inset-12 will-change-transform"
          style={{ transform: "translate3d(0, 0, 0) scale(1.06)" }}
        >
          <Image
            src="/images/white-marble.jpg"
            alt="Bright White Calacatta Gold Italian Marble Background"
            fill
            sizes="100vw"
            quality={95}
            loading="lazy"
            decoding="async"
            className="object-cover opacity-90 brightness-105 contrast-105"
          />
        </div>

        {/* Soft Ivory Translucent Veil */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#fffdf9]/45 via-[#faf6ed]/28 to-[#fffcf5]/45" />

        {/* Subtle Moving Sunlit Champagne & Warm Gold Orbs (zero-blur GPU radial gradients) */}
        <div
          ref={flare1Ref}
          className="hidden sm:block absolute -top-24 right-[10%] w-[560px] h-[560px] rounded-full bg-[radial-gradient(circle,rgba(242,202,80,0.22)_0%,rgba(255,230,153,0.12)_35%,transparent_72%)] will-change-transform"
        />
        <div
          ref={flare2Ref}
          className="hidden sm:block absolute bottom-[-10%] -left-20 w-[560px] h-[560px] rounded-full bg-[radial-gradient(circle,rgba(224,195,130,0.22)_0%,rgba(247,231,196,0.12)_35%,transparent_72%)] will-change-transform"
        />

        {/* Fast-Spinning New 3D Geometric & Sculptural Objects */}
        {show3dObjects && (
          <div
            className="absolute inset-0 overflow-hidden pointer-events-none"
            style={{ perspective: "1100px", transformStyle: "preserve-3d" }}
          >
            {FAST_3D_SCULPTURES.map((obj, idx) => (
              <div
                key={obj.id}
                ref={(el) => {
                  objRefs.current[idx] = el;
                }}
                style={{
                  left: obj.baseX,
                  top: obj.baseY,
                  width: obj.size,
                  height: obj.size,
                  transformStyle: "preserve-3d",
                }}
                className={`absolute will-change-transform scale-75 sm:scale-100 ${obj.mobileHide ? "hidden md:block" : "block opacity-80 sm:opacity-100"}`}
              >
                {/* 1. 3D Faceted Gold & Ivory Cut Diamond Prism */}
                {obj.kind === "diamond" && (
                  <div className="relative w-full h-full flex items-center justify-center" style={{ transformStyle: "preserve-3d" }}>
                    <div
                      className="w-16 h-16 rotate-45 border-2 border-[#fff7dc]/90 rounded-sm"
                      style={{
                        background: "linear-gradient(135deg, #fff6d1 0%, #e6be4a 45%, #7c580f 100%)",
                        boxShadow: "0 14px 32px rgba(139,105,20,0.34)",
                        transform: "rotateY(30deg) rotateZ(45deg)",
                      }}
                    />
                    <div
                      className="absolute w-16 h-16 rotate-45 border-2 border-[#c9a84c]/90 rounded-sm"
                      style={{
                        background: "linear-gradient(225deg, #3c2c12/80 0%, #b58b28/75 55%, #f7e3a4/90 100%)",
                        transform: "rotateY(-60deg) rotateZ(45deg)",
                      }}
                    />
                  </div>
                )}

                {/* 2. 3D Celestial Architectural Sunburst Compass */}
                {obj.kind === "compass" && (
                  <div className="relative w-full h-full flex items-center justify-center" style={{ transformStyle: "preserve-3d" }}>
                    <div className="absolute inset-1 rounded-full border-[3px] border-[#9e7216]/90" />
                    <div
                      className="absolute inset-4 rounded-full border-[3px] border-[#2e2313]/80"
                      style={{ transform: "rotateX(70deg)" }}
                    />
                    <div
                      className="absolute w-full h-[3px] bg-gradient-to-r from-transparent via-[#b58b28] to-transparent"
                      style={{ transform: "translateZ(8px)" }}
                    />
                    <div
                      className="absolute h-full w-[3px] bg-gradient-to-b from-transparent via-[#b58b28] to-transparent"
                      style={{ transform: "rotateY(45deg)" }}
                    />
                    <div
                      className="w-6 h-6 rotate-45 border border-[#fff7dc]"
                      style={{
                        background: "radial-gradient(circle, #fff8d6 0%, #c9a84c 70%, #684b0e 100%)",
                        transform: "translateZ(14px) rotate(45deg)",
                      }}
                    />
                  </div>
                )}

                {/* 3. 3D Double-Ribbon Gold Infinity Helix */}
                {obj.kind === "helix" && (
                  <div className="relative w-full h-full flex items-center justify-center" style={{ transformStyle: "preserve-3d" }}>
                    {[0, 45, 90, 135].map((angle) => (
                      <div
                        key={angle}
                        className="absolute inset-2 rounded-2xl border-[3px] border-[#b58b28]/85"
                        style={{
                          transform: `rotateX(${angle}deg) rotateY(${angle * 0.7}deg)`,
                        }}
                      />
                    ))}
                    <div
                      className="w-7 h-7 rounded-full border border-[#fff3c4]"
                      style={{
                        background: "radial-gradient(circle at 30% 30%, #ffffff 0%, #d4af37 55%, #543d09 100%)",
                      }}
                    />
                  </div>
                )}

                {/* 4. 3D Interlocking Golden Architectural Chevrons */}
                {obj.kind === "chevron" && (
                  <div className="relative w-full h-full flex flex-col items-center justify-center gap-2" style={{ transformStyle: "preserve-3d" }}>
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        className="w-16 h-5 rounded-md border border-[#fff4cc]/85"
                        style={{
                          background: "linear-gradient(90deg, #4b3815 0%, #d4af37 50%, #fce694 100%)",
                          transform: `translateZ(${(i - 1) * 18}px) rotateY(${i * 25}deg) skewX(-18deg)`,
                          boxShadow: "0 10px 22px rgba(105,76,12,0.28)",
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}