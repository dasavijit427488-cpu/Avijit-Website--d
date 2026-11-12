"use client";

import React, { useEffect, useRef } from "react";
import Image from "next/image";

interface StudioObject3D {
  id: number;
  kind: "wire-cube" | "gyro-rings" | "glass-prism" | "gold-spire";
  left: string;
  top: string;
  size: number;
  speed: number;
  rxSpeed: number;
  rySpeed: number;
  hideOnMobile?: boolean;
}

const STUDIO_3D_OBJECTS: StudioObject3D[] = [
  { id: 1, kind: "wire-cube", left: "3%", top: "12%", size: 96, speed: 1.15, rxSpeed: 34, rySpeed: 52 },
  { id: 2, kind: "gyro-rings", left: "86%", top: "14%", size: 118, speed: 1.0, rxSpeed: 42, rySpeed: -58 },
  { id: 3, kind: "glass-prism", left: "4%", top: "54%", size: 104, speed: 1.25, rxSpeed: -36, rySpeed: 48, hideOnMobile: true },
  { id: 4, kind: "gold-spire", left: "87%", top: "58%", size: 100, speed: 1.1, rxSpeed: 30, rySpeed: 64 },
  { id: 5, kind: "gyro-rings", left: "82%", top: "84%", size: 92, speed: 1.3, rxSpeed: -40, rySpeed: 54, hideOnMobile: true },
  { id: 6, kind: "wire-cube", left: "6%", top: "82%", size: 88, speed: 1.2, rxSpeed: 38, rySpeed: -46, hideOnMobile: true },
];

export default function AdminBackdrop3D() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const marbleRef = useRef<HTMLDivElement | null>(null);
  const objRefs = useRef<(HTMLDivElement | null)[]>([]);
  const orbTopRef = useRef<HTMLDivElement | null>(null);
  const orbBottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let rafId = 0;
    const start = performance.now();
    let scrollTarget = 0;
    let scrollSmooth = 0;

    const onScroll = () => {
      const maxScroll = Math.max(
        document.documentElement.scrollHeight - window.innerHeight,
        1
      );
      scrollTarget = Math.min(1, Math.max(0, (window.scrollY || 0) / maxScroll));
    };

    const tick = (now: number) => {
      const t = (now - start) * 0.001;
      scrollSmooth += (scrollTarget - scrollSmooth) * 0.1;

      // Gentle floating drift of bright Calacatta marble backdrop
      if (marbleRef.current) {
        const mx = Math.sin(t * 0.22) * 20;
        const my = Math.cos(t * 0.2) * 16 - scrollSmooth * 40;
        const scale = 1.06 + Math.sin(t * 0.16) * 0.02;
        marbleRef.current.style.transform = `translate3d(${mx.toFixed(1)}px, ${my.toFixed(1)}px, 0) scale(${scale.toFixed(3)})`;
      }

      if (orbTopRef.current) {
        const x = Math.sin(t * 0.4) * 32 + scrollSmooth * 45;
        const y = Math.cos(t * 0.35) * 24 + scrollSmooth * 60;
        orbTopRef.current.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
      }
      if (orbBottomRef.current) {
        const x = -Math.cos(t * 0.35) * 30 - scrollSmooth * 45;
        const y = Math.sin(t * 0.4) * 26 - scrollSmooth * 50;
        orbBottomRef.current.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
      }

      for (let i = 0; i < STUDIO_3D_OBJECTS.length; i++) {
        const node = objRefs.current[i];
        const cfg = STUDIO_3D_OBJECTS[i];
        if (!node || !cfg) continue;

        const floatX = Math.sin(t * cfg.speed + cfg.id) * 14;
        const floatY = Math.cos(t * cfg.speed * 0.85 + cfg.id * 1.4) * 18;
        const rx = t * cfg.rxSpeed + scrollSmooth * 240;
        const ry = t * cfg.rySpeed + scrollSmooth * 320;

        node.style.transform = `translate3d(${floatX.toFixed(2)}px, ${floatY.toFixed(2)}px, 0) rotateX(${rx.toFixed(1)}deg) rotateY(${ry.toFixed(1)}deg)`;
      }

      rafId = requestAnimationFrame(tick);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    rafId = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("scroll", onScroll);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
    >
      {/* 1. Bright Italian Calacatta White Marble Animated Texture */}
      <div
        ref={marbleRef}
        className="absolute -inset-10 will-change-transform"
        style={{ transform: "translate3d(0, 0, 0) scale(1.06)" }}
      >
        <Image
          src="/images/white-marble.jpg"
          alt="Bright White Luxury Calacatta Marble"
          fill
          sizes="100vw"
          quality={95}
          priority
          className="object-cover opacity-85 brightness-105 contrast-[1.02]"
        />
      </div>

      {/* 2. Soft Sunlit Ivory Translucent Veil */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#fffdfa]/60 via-[#faf5eb]/50 to-[#f6ede0]/65 backdrop-blur-[1px]" />

      {/* Subtle Architectural Blueprint Coordinate Grid */}
      <div
        className="absolute inset-0 opacity-25"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(181,139,40,0.12) 1px, transparent 1px), linear-gradient(to bottom, rgba(181,139,40,0.12) 1px, transparent 1px)",
          backgroundSize: "52px 52px",
        }}
      />

      {/* Soft Satin Champagne Ambient Glow Orbs */}
      <div
        ref={orbTopRef}
        className="absolute -top-24 -right-16 w-[440px] h-[440px] rounded-full blur-[110px] bg-gradient-to-br from-[#f2ca50]/30 via-[#fde8a6]/25 to-transparent will-change-transform"
      />
      <div
        ref={orbBottomRef}
        className="absolute -bottom-24 -left-20 w-[460px] h-[460px] rounded-full blur-[120px] bg-gradient-to-tr from-[#d4af37]/25 via-[#f5e7c6]/30 to-transparent will-change-transform"
      />

      {/* Brand-New Admin Studio 3D Sculptural Objects */}
      <div
        className="absolute inset-0 opacity-55 sm:opacity-75"
        style={{ perspective: "1000px", transformStyle: "preserve-3d" }}
      >
        {STUDIO_3D_OBJECTS.map((obj, idx) => (
          <div
            key={obj.id}
            ref={(el) => {
              objRefs.current[idx] = el;
            }}
            style={{
              left: obj.left,
              top: obj.top,
              width: obj.size,
              height: obj.size,
              transformStyle: "preserve-3d",
            }}
            className={`absolute will-change-transform scale-75 sm:scale-100 ${
              obj.hideOnMobile ? "hidden md:block" : "block"
            }`}
          >
            {/* 1. True 3D Isometric Cube Wireframe */}
            {obj.kind === "wire-cube" && (
              <div
                className="relative w-full h-full flex items-center justify-center"
                style={{ transformStyle: "preserve-3d" }}
              >
                {[
                  "translateZ(24px)",
                  "translateZ(-24px)",
                  "rotateY(90deg) translateZ(24px)",
                  "rotateY(-90deg) translateZ(24px)",
                  "rotateX(90deg) translateZ(24px)",
                  "rotateX(-90deg) translateZ(24px)",
                ].map((tf, fIdx) => (
                  <div
                    key={fIdx}
                    className="absolute w-12 h-12 rounded-md border-[1.8px] border-[#b58b28]/75 bg-[#f2ca50]/10 backdrop-blur-[2px]"
                    style={{ transform: tf }}
                  />
                ))}
                <div
                  className="w-4 h-4 rounded-full border border-[#fff8dc]"
                  style={{
                    background:
                      "radial-gradient(circle at 30% 30%, #ffffff 0%, #d4af37 65%, #78550e 100%)",
                  }}
                />
              </div>
            )}

            {/* 2. 3D Dual Orbiting Pearl Gyroscope */}
            {obj.kind === "gyro-rings" && (
              <div
                className="relative w-full h-full flex items-center justify-center"
                style={{ transformStyle: "preserve-3d" }}
              >
                <div
                  className="absolute inset-2 rounded-full border-[2.5px] border-[#b58b28]/80 shadow-[0_0_18px_rgba(212,175,55,0.28)]"
                  style={{ transform: "rotateX(65deg)" }}
                />
                <div
                  className="absolute inset-4 rounded-full border-[2.5px] border-[#1c1812]/45"
                  style={{ transform: "rotateY(65deg)" }}
                />
                <div
                  className="absolute inset-6 rounded-full border-2 border-[#d4af37]/90"
                  style={{ transform: "rotateX(-35deg) rotateY(35deg)" }}
                />
                <div
                  className="w-6 h-6 rounded-full shadow-md border border-white/80"
                  style={{
                    background:
                      "radial-gradient(circle at 30% 30%, #fffef7 0%, #f2ca50 55%, #8b6914 100%)",
                  }}
                />
              </div>
            )}

            {/* 3. 3D Stacked Translucent Architectural Monolith Slabs */}
            {obj.kind === "glass-prism" && (
              <div
                className="relative w-full h-full flex items-center justify-center"
                style={{ transformStyle: "preserve-3d" }}
              >
                {[-16, 0, 16].map((zOff, sIdx) => (
                  <div
                    key={sIdx}
                    className="absolute w-14 h-10 rounded-lg border border-[#b58b28]/75"
                    style={{
                      background:
                        sIdx === 1
                          ? "linear-gradient(135deg, rgba(255,255,255,0.85), rgba(242,202,80,0.45))"
                          : "linear-gradient(135deg, rgba(250,246,237,0.75), rgba(212,175,55,0.3))",
                      transform: `translateZ(${zOff}px) rotateZ(${sIdx * 18}deg)`,
                      boxShadow: "0 8px 20px rgba(140,105,20,0.16)",
                    }}
                  />
                ))}
              </div>
            )}

            {/* 4. 3D Faceted Golden Spire Octahedron */}
            {obj.kind === "gold-spire" && (
              <div
                className="relative w-full h-full flex items-center justify-center"
                style={{ transformStyle: "preserve-3d" }}
              >
                {[0, 60, 120].map((rot) => (
                  <div
                    key={rot}
                    className="absolute w-12 h-12 rounded-sm border-[1.8px] border-[#b58b28]/80"
                    style={{
                      background:
                        "linear-gradient(145deg, rgba(255,248,220,0.65) 0%, rgba(212,175,55,0.35) 100%)",
                      transform: `rotateY(${rot}deg) rotateZ(45deg)`,
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

