"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useSiteConfig } from "@/context/SiteConfigContext";
import {
  getImageFramingStyle,
  type ImageFraming,
} from "@/lib/defaultSiteConfig";

const isDynamicSrc = (src: string) =>
  src.startsWith("/api/") ||
  src.startsWith("http://") ||
  src.startsWith("https://") ||
  src.startsWith("data:");

export interface LuxuryPhotoFrameProps {
  slotKey: string;
  src: string;
  alt: string;
  sizes: string;
  priority?: boolean;
  defaultPosX?: number;
  defaultPosY?: number;
  defaultZoom?: number;
  outerClassName?: string;
  innerHeightClass?: string;
}

export default function LuxuryPhotoFrame({
  slotKey,
  src,
  alt,
  sizes,
  priority = false,
  defaultPosX = 50,
  defaultPosY = 50,
  defaultZoom = 100,
  outerClassName = "",
  innerHeightClass = "aspect-[4/3]",
}: LuxuryPhotoFrameProps) {
  const { config } = useSiteConfig();
  const [tilt, setTilt] = useState<{ rx: number; ry: number }>({ rx: 0, ry: 0 });

  const framing: ImageFraming | undefined = config.design?.imageFraming?.[slotKey];
  const borderStyle = framing?.borderStyle ?? "gold-classic";
  const rawMotion = framing?.motionStyle ?? "inherit";
  const resolvedMotion =
    rawMotion === "inherit"
      ? config.design?.animation?.defaultImageHover ?? "hover-zoom"
      : rawMotion;

  const captionText = framing?.captionText?.trim() ?? "";
  const captionPos = framing?.captionPosition ?? "bottom-left";

  const borderClasses =
    borderStyle === "gold-double"
      ? "bg-white/90 p-2 sm:p-2.5 border-2 border-[#b58b28] ring-2 ring-[#f2ca50]/45 shadow-[0_20px_55px_rgba(140,110,45,0.24)]"
      : borderStyle === "glass-glow"
        ? "bg-white/65 md:backdrop-blur-md p-1.5 sm:p-2 border border-[#f2ca50]/75 shadow-[0_0_32px_rgba(212,175,55,0.38)]"
        : borderStyle === "minimal"
          ? "bg-white/95 p-1 border border-stone-200 shadow-md"
          : borderStyle === "none"
            ? "bg-transparent p-0 border-0 shadow-none"
            : "bg-white/85 p-1.5 sm:p-2 border border-[#c9a84c]/40 shadow-[0_18px_45px_rgba(140,110,45,0.16)] hover:shadow-[0_24px_60px_rgba(140,110,45,0.26)]";

  const motionClasses =
    resolvedMotion === "float-3d"
      ? "animate-float-3d"
      : resolvedMotion === "pulse-glow"
        ? "animate-pulse-gold"
        : resolvedMotion === "hover-zoom" || resolvedMotion === "3d-tilt"
          ? "hover:-translate-y-1.5"
          : "";

  const captionPosClasses =
    captionPos === "bottom-center"
      ? "bottom-3 left-1/2 -translate-x-1/2 text-center"
      : captionPos === "top-left"
        ? "top-3 left-3 text-left"
        : captionPos === "center"
          ? "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center"
          : "bottom-3 left-3 text-left";

  const enableTilt = resolvedMotion === "3d-tilt";
  const isCleanStaticFrame = src.startsWith("/frames/");
  const resolvedSrc = isCleanStaticFrame && !src.includes("?") ? `${src}?v=clean5` : src;

  return (
    <div
      onMouseMove={
        enableTilt
          ? (e) => {
              const r = e.currentTarget.getBoundingClientRect();
              const x = (e.clientX - r.left) / r.width - 0.5;
              const y = (e.clientY - r.top) / r.height - 0.5;
              setTilt({ rx: -y * 10, ry: x * 12 });
            }
          : undefined
      }
      onMouseLeave={enableTilt ? () => setTilt({ rx: 0, ry: 0 }) : undefined}
      style={{
        perspective: enableTilt ? "1000px" : undefined,
      }}
      className={`group relative rounded-2xl overflow-hidden transition-all duration-500 ${borderClasses} ${motionClasses} ${outerClassName}`}
    >
      <div
        style={
          enableTilt
            ? {
                transform: `rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`,
                transition: "transform 0.22s ease-out",
                transformStyle: "preserve-3d",
              }
            : undefined
        }
        className={`relative w-full ${innerHeightClass} rounded-xl overflow-hidden`}
      >
        <Image
          src={resolvedSrc}
          alt={alt}
          fill
          unoptimized={isDynamicSrc(src) || isCleanStaticFrame}
          sizes={sizes}
          quality={85}
          priority={priority}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          style={getImageFramingStyle(config, slotKey, defaultPosX, defaultPosY, defaultZoom)}
          className={`object-cover transition-transform duration-700 ease-out md:brightness-105 md:contrast-105 ${
            resolvedMotion === "hover-zoom" ? "group-hover:scale-105" : ""
          }`}
        />

        {borderStyle === "gold-double" && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-1.5 rounded-lg border border-[#f2ca50]/65"
          />
        )}

        {captionText && (
          <div
            className={`absolute z-10 max-w-[85%] px-3.5 py-1.5 rounded-xl bg-[#15120d]/78 backdrop-blur-md border border-[#d4af37]/60 text-[#fff9ec] text-xs sm:text-sm font-medium tracking-wide shadow-lg pointer-events-none ${captionPosClasses}`}
          >
            {captionText}
          </div>
        )}
      </div>
    </div>
  );
}

