"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useSiteConfig } from "@/context/SiteConfigContext";
import { FONT_STACKS } from "@/lib/defaultSiteConfig";
import { getAnimationSpeedFactor, getMotionOffset } from "@/lib/animationHelpers";
import LuxuryPhotoFrame from "./LuxuryPhotoFrame";

export interface MaterialitySectionProps {
  onInquireClick?: () => void;
}

const isDynamicSrc = (src: string) =>
  src.startsWith("/api/") || src.startsWith("http://") || src.startsWith("https://") || src.startsWith("data:");

export default function MaterialitySection({ onInquireClick }: MaterialitySectionProps) {
  const { config } = useSiteConfig();
  const mat = config.materiality;
  const pageDesign = config.design?.pages?.materiality;
  const pageFont = pageDesign?.pageFont ?? "inherit";
  const textAlign = pageDesign?.textAlign ?? "left";
  const alignClass =
    textAlign === "center"
      ? "text-center"
      : textAlign === "right"
        ? "text-right"
        : "text-left";

  const sectionRef = useRef<HTMLElement | null>(null);
  const topHeaderRef = useRef<HTMLDivElement | null>(null);
  const topViewsRef = useRef<HTMLDivElement | null>(null);
  const volumesHeaderRef = useRef<HTMLDivElement | null>(null);
  const volumesGridRef = useRef<HTMLDivElement | null>(null);
  const platesImagesRef = useRef<HTMLDivElement | null>(null);
  const platesNarrativeRef = useRef<HTMLDivElement | null>(null);
  const exteriorHeaderRef = useRef<HTMLDivElement | null>(null);
  const exteriorGridRef = useRef<HTMLDivElement | null>(null);
  const quoteCardRef = useRef<HTMLDivElement | null>(null);

  const defaultExteriors = useMemo(
    () => mat.exteriorPool.slice(0, 4).map((item, origIdx) => ({ ...item, origIdx })),
    [mat.exteriorPool]
  );
  const [shuffledExteriors, setShuffledExteriors] = useState<typeof defaultExteriors | null>(null);
  const randomExteriors = shuffledExteriors ?? defaultExteriors;

  // Sync exterior house views whenever pool has >4 options on client mount
  useEffect(() => {
    if (mat.exteriorPool.length <= 4) {
      return;
    }
    const timer = setTimeout(() => {
      const indexed = mat.exteriorPool.map((item, origIdx) => ({ ...item, origIdx }));
      const shuffled = [...indexed].sort(() => Math.random() - 0.5);
      setShuffledExteriors(shuffled.slice(0, 4));
    }, 0);
    return () => clearTimeout(timer);
  }, [mat.exteriorPool]);

  const anim = config.design?.animation;

  useEffect(() => {
    if (typeof window !== "undefined") {
      gsap.registerPlugin(ScrollTrigger);
    }

    const el = sectionRef.current;
    if (!el) return;

    if (anim && !anim.enabled) {
      return;
    }

    const spd = getAnimationSpeedFactor(anim);

    const ctx = gsap.context(() => {
      const replayTrigger = (triggerEl: Element | null) => ({
        trigger: triggerEl,
        start: "top 92%",
        toggleActions: "play none none none",
      });

      const animEl = (
        target: gsap.TweenTarget,
        triggerEl: Element | null,
        defFrom: { x?: number; y?: number },
        dur: number,
        staggerVal?: number
      ) => {
        const off = getMotionOffset(anim, defFrom);
        gsap.fromTo(
          target,
          { opacity: 0, x: off.x, y: off.y, scale: off.scale, force3D: true },
          {
            opacity: 1,
            x: 0,
            y: 0,
            scale: 1,
            force3D: true,
            duration: dur * spd,
            ...(staggerVal ? { stagger: staggerVal * spd } : {}),
            ease: "power3.out",
            scrollTrigger: replayTrigger(triggerEl),
          }
        );
      };

      if (topHeaderRef.current) {
        animEl(topHeaderRef.current.children, topHeaderRef.current, { y: 44 }, 0.48, 0.06);
      }
      if (topViewsRef.current) {
        animEl(topViewsRef.current.children, topViewsRef.current, { y: 48 }, 0.5, 0.06);
      }
      if (volumesHeaderRef.current) {
        animEl(volumesHeaderRef.current.children, volumesHeaderRef.current, { x: 56 }, 0.48, 0.06);
      }
      if (volumesGridRef.current) {
        animEl(volumesGridRef.current.children, volumesGridRef.current, { x: 58 }, 0.5, 0.06);
      }
      if (platesImagesRef.current) {
        const imageCards = platesImagesRef.current.querySelectorAll(".plate-anim-card");
        animEl(imageCards, platesImagesRef.current, { x: 56 }, 0.5, 0.06);
      }
      if (platesNarrativeRef.current) {
        animEl(platesNarrativeRef.current, platesNarrativeRef.current, { x: 64 }, 0.52);
      }
      if (exteriorHeaderRef.current) {
        animEl(exteriorHeaderRef.current.children, exteriorHeaderRef.current, { x: -56 }, 0.48, 0.05);
      }
      if (exteriorGridRef.current) {
        animEl(exteriorGridRef.current.children, exteriorGridRef.current, { x: -58 }, 0.5, 0.05);
      }
      if (quoteCardRef.current) {
        animEl(quoteCardRef.current, quoteCardRef.current, { x: -58 }, 0.5);
      }
    }, el);

    return () => {
      ctx.revert();
    };
  }, [anim?.enabled, anim?.speed, anim?.directionMode]);

  return (
    <section
      ref={sectionRef}
      id="materiality"
      className={`relative z-20 w-full bg-transparent text-[#1f1b15] overflow-hidden border-t border-[#c9a84c]/30 font-playfair ${
        pageFont !== "inherit" ? "section-custom-font" : ""
      } ${alignClass}`}
      style={
        pageFont !== "inherit"
          ? ({ "--section-font": FONT_STACKS[pageFont] } as React.CSSProperties)
          : undefined
      }
    >
      <div className="relative z-10 flex flex-col w-full">
        {/* 1. MONOGRAPH HEADER & 3 PURE 4K LUXURY HOUSE VIEWS (No Overlay Icons/Text on Photos) */}
        <div className="relative w-full px-4 sm:px-6 md:px-20 pt-14 sm:pt-20 pb-12 sm:pb-16">
          <div className="max-w-7xl mx-auto">
            {/* Editorial Header Block */}
            <div ref={topHeaderRef} className="flex flex-col lg:flex-row items-start lg:items-end justify-between gap-6 sm:gap-9 mb-8 sm:mb-12">
              <div className={`max-w-3xl ${textAlign === "center" ? "mx-auto" : textAlign === "right" ? "ml-auto" : ""}`}>
                <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-white/80 backdrop-blur-md border border-[#c9a84c]/45 text-[#8c6812] mb-3 sm:mb-4 shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-[#c9a84c]" />
                  <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.18em] sm:tracking-[0.2em]">
                    {mat.monographBadge}
                  </span>
                </div>

                <h2 className="text-3xl sm:text-5xl lg:text-[68px] font-medium uppercase tracking-[0.03em] leading-[1.1] text-[#1c1812]">
                  {mat.titleLine1} <br />
                  <span className="italic font-normal text-[#8b6914] text-2xl sm:text-5xl">
                    {mat.titleItalic}
                  </span>
                </h2>

                <p className={`text-sm sm:text-xl text-[#4a4236] italic max-w-2xl mt-2.5 sm:mt-3 leading-relaxed ${textAlign === "center" ? "mx-auto" : ""}`}>
                  {mat.introText}
                </p>
              </div>

              {/* Clean Coordinate & Architect Summary Card */}
              <div className="flex flex-col gap-2 p-5 sm:p-6 bg-white/80 rounded-2xl border border-[#c9a84c]/40 shadow-[0_14px_38px_rgba(140,110,45,0.12)] w-full lg:w-auto lg:min-w-[320px] md:backdrop-blur-md">
                {mat.summaryRows.map((row, idx) => {
                  const isLast = idx === mat.summaryRows.length - 1;
                  return (
                    <div
                      key={`${row.label}-${idx}`}
                      className={`flex justify-between items-center text-sm ${
                        isLast ? "pt-1.5" : "py-1.5 border-b border-[#c9a84c]/20"
                      }`}
                    >
                      <span className="text-[#6e6454]">{row.label}</span>
                      <span
                        className={`${
                          isLast ? "text-[#8b6914]" : "text-[#1f1b15]"
                        } font-medium tracking-wide`}
                      >
                        {row.value}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 3 Luxury House Photographs */}
            <div ref={topViewsRef} className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {mat.topViews.map((view, idx) => (
                <LuxuryPhotoFrame
                  key={`${view.src}-${idx}`}
                  slotKey={`materiality.topView.${idx}`}
                  src={view.src}
                  alt={view.alt}
                  sizes="(max-width: 768px) 100vw, 33vw"
                  innerHeightClass="aspect-[4/3]"
                />
              ))}
            </div>
          </div>
        </div>

        {/* 2. REDESIGNED AIRY WHITE-GOLD ARCHITECTURAL VOLUMES STRIP */}
        <div className="w-full px-4 sm:px-6 md:px-20 py-12 sm:py-16 bg-white/30 md:backdrop-blur-[2px] border-y border-[#c9a84c]/25">
          <div className="max-w-7xl mx-auto">
            <div ref={volumesHeaderRef} className="flex flex-col md:flex-row md:items-end justify-between mb-8 sm:mb-12 gap-4 sm:gap-6">
              <div>
                <span className="text-xs uppercase tracking-[0.22em] text-[#8b6914] font-semibold block mb-1.5 sm:mb-2">
                  {mat.volumesKicker}
                </span>
                <h3 className="text-2xl sm:text-4xl font-medium text-[#1c1812]">
                  {mat.volumesTitle}
                </h3>
              </div>
              <p className="text-sm sm:text-base text-[#4a4236] max-w-md leading-relaxed">
                {mat.volumesSubtitle}
              </p>
            </div>

            <div
              ref={volumesGridRef}
              style={{ perspective: "1000px" }}
              className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-[#c9a84c]/30 bg-white/75 rounded-3xl border border-[#c9a84c]/35 shadow-[0_16px_45px_rgba(140,110,45,0.1)] overflow-hidden"
            >
              {mat.volumeCards.map((card, idx) => (
                <div
                  key={`${card.tag}-${idx}`}
                  className="group p-8 sm:p-10 flex flex-col justify-between gap-4 hover:bg-[#fcf8ef]/95 transition-all duration-500 hover:-translate-y-1"
                >
                  <div>
                    <span className="text-xs uppercase tracking-[0.2em] text-[#8b6914] font-semibold">
                      {card.tag}
                    </span>
                    <div className="text-4xl sm:text-5xl text-[#1c1812] font-medium mt-3 mb-2 group-hover:text-[#8b6914] transition-colors duration-300">
                      {card.value} <span className="text-xl text-[#8b6914]">{card.unit}</span>
                    </div>
                    <h4 className="text-xl font-semibold text-[#1f1b15] mb-2">
                      {card.title}
                    </h4>
                    <p className="text-sm text-[#574e40] leading-relaxed">
                      {card.description}
                    </p>
                  </div>
                  <div className="pt-4 border-t border-[#c9a84c]/20 text-xs text-[#8b6914] font-semibold uppercase tracking-wider flex items-center justify-between">
                    <span>{card.footer}</span>
                    <span className="w-6 h-[1.5px] bg-[#c9a84c]/40 group-hover:w-12 transition-all duration-500" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 3. PURE PHOTOGRAPHIC PLATES + BEDROCK NARRATIVE */}
        <div id="materiality-plates" className="w-full px-4 sm:px-6 md:px-20 py-12 sm:py-20 relative">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-10 items-center">
            {/* Left 7 Cols: 3 Clean Photographs With Smooth Animations */}
            <div ref={platesImagesRef} className="lg:col-span-7 flex flex-col gap-4 sm:gap-6">
              <LuxuryPhotoFrame
                slotKey="materiality.plateLarge"
                src={mat.plateLarge.src}
                alt={mat.plateLarge.alt}
                sizes="(max-width: 1024px) 100vw, 58vw"
                defaultPosX={50}
                defaultPosY={50}
                defaultZoom={100}
                outerClassName="plate-anim-card"
                innerHeightClass="h-[230px] sm:h-[400px] md:h-[440px]"
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <LuxuryPhotoFrame
                  slotKey="materiality.plateSmallLeft"
                  src={mat.plateSmallLeft.src}
                  alt={mat.plateSmallLeft.alt}
                  sizes="(max-width: 640px) 100vw, 30vw"
                  defaultPosX={50}
                  defaultPosY={50}
                  defaultZoom={100}
                  outerClassName="plate-anim-card"
                  innerHeightClass="h-52"
                />

                <LuxuryPhotoFrame
                  slotKey="materiality.plateSmallRight"
                  src={mat.plateSmallRight.src}
                  alt={mat.plateSmallRight.alt}
                  sizes="(max-width: 640px) 100vw, 30vw"
                  defaultPosX={50}
                  defaultPosY={50}
                  defaultZoom={100}
                  outerClassName="plate-anim-card"
                  innerHeightClass="h-52"
                />
              </div>
            </div>

            {/* Right 5 Cols: Clean Narrative */}
            <div
              ref={platesNarrativeRef}
              className="lg:col-span-5 flex flex-col justify-center space-y-4 sm:space-y-6 lg:pl-4 bg-white/75 md:backdrop-blur-md p-6 sm:p-10 rounded-3xl border border-[#c9a84c]/35 shadow-[0_18px_45px_rgba(140,110,45,0.12)]"
            >
              <div className="text-xs uppercase tracking-[0.2em] text-[#8b6914] font-semibold">
                {mat.narrativeKicker}
              </div>

              <h3 className="text-2xl sm:text-4xl font-medium text-[#1c1812] leading-tight">
                {mat.narrativeTitle}
              </h3>

              <p className="text-base text-[#4a4236] leading-relaxed">
                {mat.narrativeParagraph1}
              </p>

              <p className="text-base text-[#4a4236] leading-relaxed">
                {mat.narrativeParagraph2}
              </p>

              <div className="space-y-3 pt-4 border-t border-[#c9a84c]/25 text-sm">
                {mat.narrativeSpecs.map((spec, idx) => (
                  <div
                    key={`${spec.label}-${idx}`}
                    className="flex justify-between items-center py-2 px-4 rounded-xl bg-[#faf6ed] border border-[#c9a84c]/25 hover:border-[#b58b28] transition-colors"
                  >
                    <span className="text-[#574e40]">{spec.label}</span>
                    <span className="text-[#8b6914] font-medium tracking-wide">{spec.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 4. RANDOMIZED LUXURY EXTERIOR PERSPECTIVES */}
        <div className="w-full px-4 sm:px-6 md:px-20 py-12 sm:py-16 bg-white/30 md:backdrop-blur-[2px] border-y border-[#c9a84c]/25">
          <div className="max-w-7xl mx-auto">
            <div ref={exteriorHeaderRef} className="flex flex-col md:flex-row md:items-end justify-between gap-3 sm:gap-4 mb-7 sm:mb-10">
              <div>
                <span className="text-xs uppercase tracking-[0.22em] text-[#8b6914] font-semibold block mb-1.5 sm:mb-2">
                  {mat.exteriorKicker}
                </span>
                <h3 className="text-2xl sm:text-4xl font-medium text-[#1c1812]">
                  {mat.exteriorTitle}
                </h3>
              </div>
              <p className="text-sm text-[#4a4236] max-w-md">
                {mat.exteriorSubtitle}
              </p>
            </div>

            <div
              ref={exteriorGridRef}
              style={{ perspective: "1000px" }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6"
            >
              {randomExteriors.map((view, idx) => (
                <LuxuryPhotoFrame
                  key={`${view.src}-${idx}`}
                  slotKey={`materiality.exterior.${view.origIdx}`}
                  src={view.src}
                  alt={view.alt}
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  defaultPosX={50}
                  defaultPosY={50}
                  defaultZoom={100}
                  innerHeightClass="aspect-[4/3]"
                />
              ))}
            </div>
          </div>
        </div>

        {/* 5. LEFT-ALIGNED ARCHITECT QUOTATION */}
        <div className="relative w-full px-4 sm:px-6 md:px-20 py-12 sm:py-20">
          <div className="max-w-7xl mx-auto">
            <div ref={quoteCardRef} className={`max-w-4xl bg-white/80 md:backdrop-blur-md rounded-3xl p-6 sm:p-12 border border-[#c9a84c]/40 shadow-[0_20px_50px_rgba(140,110,45,0.14)] flex flex-col ${textAlign === "center" ? "mx-auto items-center text-center" : textAlign === "right" ? "ml-auto items-end text-right" : "items-start text-left"}`}>
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#faf6ed] border border-[#c9a84c]/45 mb-4 sm:mb-6 flex items-center justify-center text-[#8b6914]">
                <svg className="w-5 h-5 sm:w-6 sm:h-6" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M10 7H6a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h2v2a2 2 0 0 1-2 2H5v2h1a4 4 0 0 0 4-4V7zm10 0h-4a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h2v2a2 2 0 0 1-2 2h-1v2h1a4 4 0 0 0 4-4V7z" />
                </svg>
              </div>
              <blockquote className="text-xl sm:text-3xl lg:text-[38px] text-[#1c1812] italic font-normal leading-snug border-l-2 border-[#c9a84c] pl-4 sm:pl-6">
                &ldquo;{mat.quoteText}&rdquo;
              </blockquote>
              <div className="mt-8 pl-6 flex flex-col items-start">
                <span className="text-lg sm:text-xl font-semibold text-[#8b6914] tracking-wider uppercase">
                  {mat.quoteAuthor}
                </span>
                <span className="text-xs text-[#6e6454] uppercase mt-1 tracking-widest">
                  {mat.quoteRole}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
