"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useSiteConfig } from "@/context/SiteConfigContext";
import {
  FONT_STACKS,
  getImageFramingStyle,
  type LevelKey,
} from "@/lib/defaultSiteConfig";
import { getAnimationSpeedFactor, getMotionOffset } from "@/lib/animationHelpers";
import LuxuryPhotoFrame from "./LuxuryPhotoFrame";

export interface FloorplanExplorerProps {
  onInquireClick?: () => void;
}

const isDynamicSrc = (src: string) =>
  src.startsWith("/api/") || src.startsWith("http://") || src.startsWith("https://") || src.startsWith("data:");

export default function FloorplanExplorer({ onInquireClick }: FloorplanExplorerProps) {
  const { config } = useSiteConfig();
  const mp = config.masterplan;
  const pageDesign = config.design?.pages?.masterplan;
  const pageFont = pageDesign?.pageFont ?? "inherit";
  const textAlign = pageDesign?.textAlign ?? "left";
  const alignClass =
    textAlign === "center"
      ? "text-center"
      : textAlign === "right"
        ? "text-right"
        : "text-left";

  const sectionRef = useRef<HTMLElement | null>(null);
  const heroHeaderRef = useRef<HTMLDivElement | null>(null);
  const heroStageRef = useRef<HTMLDivElement | null>(null);
  const zonesHeaderRef = useRef<HTMLDivElement | null>(null);
  const zonesGridRef = useRef<HTMLDivElement | null>(null);
  const levelSystemRef = useRef<HTMLDivElement | null>(null);
  const levelDetailRef = useRef<HTMLDivElement | null>(null);
  const ecoLeftRef = useRef<HTMLDivElement | null>(null);
  const ecoBentoRef = useRef<HTMLDivElement | null>(null);
  const landSummaryRef = useRef<HTMLDivElement | null>(null);

  const [activeLevel, setActiveLevel] = useState<LevelKey>("00");
  const [tilt, setTilt] = useState<{ rx: number; ry: number }>({ rx: 0, ry: 0 });

  const anim = config.design?.animation;

  useEffect(() => {
    if (typeof window !== "undefined") {
      gsap.registerPlugin(ScrollTrigger);
    }

    const el = sectionRef.current;
    if (!el) return;
    if (anim && !anim.enabled) return;

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
        staggerOrDelay?: { stagger?: number; delay?: number }
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
            ...(staggerOrDelay?.stagger ? { stagger: staggerOrDelay.stagger * spd } : {}),
            ...(staggerOrDelay?.delay ? { delay: staggerOrDelay.delay * spd } : {}),
            ease: "power3.out",
            scrollTrigger: replayTrigger(triggerEl),
          }
        );
      };

      if (heroHeaderRef.current) {
        animEl(heroHeaderRef.current.children, heroHeaderRef.current, { x: -54 }, 0.48, { stagger: 0.05 });
      }
      if (heroStageRef.current) {
        animEl(heroStageRef.current, heroStageRef.current, { x: 56 }, 0.5);
      }
      if (zonesHeaderRef.current && zonesHeaderRef.current.children.length >= 2) {
        animEl(zonesHeaderRef.current.children[0], zonesHeaderRef.current, { x: -50 }, 0.46);
        animEl(zonesHeaderRef.current.children[1], zonesHeaderRef.current, { x: 50 }, 0.46);
      }
      if (zonesGridRef.current) {
        Array.from(zonesGridRef.current.children).forEach((card, idx) => {
          animEl(card, zonesGridRef.current, { x: idx < 2 ? -54 : 54 }, 0.48, { delay: idx * 0.03 });
        });
      }
      if (levelSystemRef.current) {
        animEl(levelSystemRef.current.children, levelSystemRef.current, { y: 46 }, 0.48, { stagger: 0.05 });
      }
      if (ecoLeftRef.current) {
        animEl(ecoLeftRef.current, ecoLeftRef.current, { x: -56 }, 0.5);
      }
      if (ecoBentoRef.current) {
        Array.from(ecoBentoRef.current.children).forEach((cell, idx) => {
          animEl(cell, ecoBentoRef.current, { x: idx % 2 === 0 ? -44 : 54 }, 0.48, { delay: idx * 0.03 });
        });
      }
      if (landSummaryRef.current) {
        Array.from(landSummaryRef.current.children).forEach((col, idx) => {
          animEl(col, landSummaryRef.current, { x: idx < 2 ? -48 : 48 }, 0.46, { delay: idx * 0.03 });
        });
      }
    }, el);

    return () => {
      ctx.revert();
    };
  }, [anim?.enabled, anim?.speed, anim?.directionMode]);

  // Subtle transition animation whenever user selects a different wing
  useEffect(() => {
    if (!levelDetailRef.current) return;
    gsap.fromTo(
      levelDetailRef.current,
      { opacity: 0.45, y: 8 },
      { opacity: 1, y: 0, duration: 0.3, ease: "power2.out" }
    );
  }, [activeLevel]);

  const handleViewportMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const xPct = (e.clientX - rect.left) / rect.width - 0.5;
    const yPct = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({
      rx: -yPct * 5,
      ry: xPct * 6,
    });
  };

  const resetViewportTilt = () => setTilt({ rx: 0, ry: 0 });
  const currentLevel = mp.levels[activeLevel];

  return (
    <section
      ref={sectionRef}
      id="masterplan"
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
        {/* 1. MASTERPLAN HEADER & CLEAN 3D PERSPECTIVE STAGE */}
        <div className="relative w-full px-4 sm:px-6 md:px-20 pt-14 sm:pt-20 pb-8 sm:pb-12">
          <div className="max-w-7xl mx-auto">
            <div ref={heroHeaderRef} className={`flex flex-col max-w-3xl mb-7 sm:mb-10 ${textAlign === "center" ? "mx-auto" : textAlign === "right" ? "ml-auto" : ""}`}>
              <div className="inline-flex items-center gap-2 mb-2.5 sm:mb-3">
                <span className="w-2 h-2 rounded-full bg-[#c9a84c]" />
                <span className="text-xs text-[#8b6914] uppercase tracking-[0.22em] font-semibold">
                  {mp.heroKicker}
                </span>
              </div>
              <h2 className="text-3xl sm:text-5xl lg:text-[52px] font-medium text-[#1c1812] tracking-tight leading-tight">
                {mp.heroTitle}
              </h2>
              <p className="text-sm sm:text-lg text-[#4a4236] mt-2.5 sm:mt-3 max-w-2xl leading-relaxed">
                {mp.heroSubtitle}
              </p>
            </div>

            {/* Clean 3D Interactive Estate Showcase */}
            <div ref={heroStageRef}>
              <LuxuryPhotoFrame
                slotKey="masterplan.heroImage"
                src={mp.heroImage}
                alt={mp.heroImageAlt}
                sizes="100vw"
                outerClassName="rounded-2xl sm:rounded-3xl"
                innerHeightClass="h-[220px] sm:h-[400px] md:h-[520px]"
              />
            </div>
          </div>
        </div>

        {/* 2. FOUR SOVEREIGN ZONES */}
        <div className="w-full px-4 sm:px-6 md:px-20 py-10 sm:py-14 relative">
          <div className="max-w-7xl mx-auto">
            <div ref={zonesHeaderRef} className="flex flex-col md:flex-row md:items-end justify-between mb-7 sm:mb-10 gap-3 sm:gap-4">
              <div>
                <span className="text-xs text-[#8b6914] uppercase tracking-[0.2em] font-semibold">
                  {mp.zonesKicker}
                </span>
                <h2 className="text-2xl sm:text-4xl font-medium text-[#1c1812] mt-1">
                  {mp.zonesTitle}
                </h2>
              </div>
              <p className="text-sm text-[#4a4236] max-w-md leading-relaxed">
                {mp.zonesSubtitle}
              </p>
            </div>

            <div
              ref={zonesGridRef}
              style={{ perspective: "1200px" }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-7"
            >
              {mp.zoneCards.map((zone, zoneIdx) => {
                const isSelected = activeLevel === zone.id;
                return (
                  <div
                    key={zone.id}
                    onClick={() => setActiveLevel(zone.id)}
                    className={`group relative flex flex-col rounded-[26px] overflow-hidden transition-all duration-700 ease-out cursor-pointer p-2.5 md:backdrop-blur-md bg-gradient-to-b from-white/95 via-[#fdfbf6]/90 to-[#f9f3e4]/90 border ${
                      isSelected
                        ? "border-[#b58b28] ring-2 ring-[#c9a84c]/30 shadow-[0_26px_60px_rgba(140,110,45,0.26)] -translate-y-2.5"
                        : "border-[#c9a84c]/35 hover:border-[#b58b28] hover:-translate-y-2.5 shadow-[0_16px_40px_rgba(140,110,45,0.12)] hover:shadow-[0_24px_55px_rgba(140,110,45,0.22)]"
                    }`}
                  >
                    {/* Top Subtle Gold Hairline Accent */}
                    <div
                      className={`absolute top-0 left-6 right-6 h-[2px] rounded-full bg-gradient-to-r from-transparent via-[#d4af37] to-transparent transition-opacity duration-500 ${
                        isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                      }`}
                    />

                    {/* Photo Framed with Customizable Border, 3D Effect & Overlay Text */}
                    <LuxuryPhotoFrame
                      slotKey={`masterplan.zone.${zoneIdx}`}
                      src={zone.image}
                      alt={zone.title}
                      sizes="(max-width: 768px) 100vw, 25vw"
                      defaultPosX={50}
                      defaultPosY={50}
                      defaultZoom={100}
                      outerClassName="rounded-[18px]"
                      innerHeightClass="h-56"
                    />

                    {/* Refined Luxury Content Block */}
                    <div className="px-4 pt-5 pb-4 flex flex-col flex-grow justify-start">
                      <h3 className="text-[21px] font-medium tracking-wide text-[#1c1812] leading-snug mb-2.5 group-hover:text-[#8b6914] transition-colors duration-300">
                        {zone.title}
                      </h3>
                      <div className="w-10 h-[1.5px] bg-[#c9a84c]/55 mb-3 group-hover:w-16 transition-all duration-500" />
                      <p className="text-sm text-[#574e40] leading-relaxed">
                        {zone.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* 3. ARCHITECTURAL WING SYSTEM */}
        <div className="w-full px-4 sm:px-6 md:px-20 py-12 sm:py-16 relative border-y border-[#c9a84c]/25 bg-white/30 md:backdrop-blur-[2px]">
          <div ref={levelSystemRef} className="max-w-7xl mx-auto flex flex-col gap-6 sm:gap-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 sm:gap-4">
              <div>
                <span className="text-xs text-[#8b6914] uppercase tracking-[0.2em] font-semibold">
                  {mp.wingsKicker}
                </span>
                <h2 className="text-2xl sm:text-4xl font-medium text-[#1c1812] mt-1">
                  {mp.wingsTitle}
                </h2>
              </div>
              <div className="text-xs text-[#6e6454] flex items-center gap-2 font-semibold uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full bg-[#c9a84c]" />
                <span>{mp.wingsSubtitle}</span>
              </div>
            </div>

            {/* Wing Buttons Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3.5 bg-white/80 p-2 sm:p-2.5 rounded-2xl border border-[#c9a84c]/30 shadow-md">
              {(["-1", "00", "01", "02"] as LevelKey[]).map((key) => {
                const lvl = mp.levels[key];
                const isActive = activeLevel === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setActiveLevel(key)}
                    className={`text-left px-3 py-3 sm:px-5 sm:py-4 rounded-xl transition-all duration-500 cursor-pointer ${
                      isActive
                        ? "bg-gradient-to-r from-[#d4af37] to-[#f2ca50] text-[#2b2000] shadow-lg font-bold scale-[1.01]"
                        : "bg-[#faf6ed] hover:bg-[#f5ebd6] hover:-translate-y-0.5 border border-[#c9a84c]/20 text-[#1c1812]"
                    }`}
                  >
                    <div className={`text-[10px] sm:text-xs font-bold uppercase tracking-wider ${isActive ? "text-[#3c2f00]" : "text-[#8b6914]"}`}>
                      {lvl.label}
                    </div>
                    <div className="text-xs sm:text-sm mt-1 font-semibold leading-snug">
                      {lvl.shortTitle}
                    </div>
                    <div className={`text-[10px] sm:text-xs mt-0.5 ${isActive ? "text-[#4a3900]" : "text-[#6e6454]"}`}>
                      {lvl.elevationLine}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Dynamic Wing Detailed Stage */}
            <div ref={levelDetailRef} className="rounded-2xl sm:rounded-3xl p-4 sm:p-10 shadow-xl flex flex-col lg:flex-row gap-6 sm:gap-8 items-center bg-white/85 md:backdrop-blur-md border border-[#c9a84c]/35">
              {/* Interactive Blueprint Graphic */}
              <div className="w-full lg:w-3/5 bg-[#faf6ed] p-3.5 sm:p-6 rounded-xl sm:rounded-2xl border border-[#c9a84c]/30 flex flex-col justify-between shadow-inner">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                  <span className="text-xs text-[#8b6914] font-bold uppercase tracking-wider">
                    {currentLevel.code}
                  </span>
                  <span className="text-xs text-[#6e6454] bg-white px-2.5 py-0.5 rounded border border-[#c9a84c]/25">
                    Scale 1:200
                  </span>
                </div>

                <div className="relative w-full aspect-[16/9] flex items-center justify-center overflow-hidden rounded-xl bg-white border border-[#c9a84c]/20">
                  <svg className="w-full h-full text-[#b58b28] transition-all duration-500" fill="none" viewBox="0 0 600 320">
                    <defs>
                      <pattern height="30" id="masterplanBrightGrid" patternUnits="userSpaceOnUse" width="30">
                        <path d="M 30 0 L 0 0 0 30" fill="none" stroke="currentColor" strokeOpacity="0.16" strokeWidth="0.6" />
                      </pattern>
                    </defs>
                    <rect fill="url(#masterplanBrightGrid)" height="100%" width="100%" />
                    <path
                      d="M 80,180 L 180,80 L 460,80 L 520,150 L 490,260 L 160,260 Z"
                      fill="#f2ca50"
                      fillOpacity="0.12"
                      stroke="#8b6914"
                      strokeWidth="1.8"
                    />
                    <path
                      d="M 120,170 L 190,110 L 430,110 L 470,160 L 450,230 L 180,230 Z"
                      stroke="#b58b28"
                      strokeDasharray="4 2"
                      strokeWidth="1.2"
                    />
                    <rect fill="#f2ca50" fillOpacity="0.22" height="50" rx="4" stroke="#8b6914" strokeWidth="1.6" width="220" x="220" y="190" />
                    <text fill="#574000" fontFamily="Playfair Display, serif" fontSize="10" fontWeight="600" textAnchor="middle" x="330" y="220">
                      {currentLevel.featText}
                    </text>
                    <rect fill="#faf6ed" height="50" stroke="#8b6914" strokeWidth="1" width="160" x="240" y="125" />
                    <text fill="#1c1812" fontFamily="Playfair Display, serif" fontSize="11" fontWeight="700" textAnchor="middle" x="320" y="153">
                      {currentLevel.coreText}
                    </text>
                    <circle cx="150" cy="140" r="28" stroke="#8b6914" strokeDasharray="3 3" strokeWidth="1.4" />
                    <circle cx="150" cy="140" r="22" stroke="#b58b28" strokeWidth="1" />
                    <text fill="#8b6914" fontFamily="Playfair Display, serif" fontSize="13" fontWeight="700" textAnchor="middle" x="150" y="145">
                      {currentLevel.circleLetter}
                    </text>
                    <text fill="#6e6454" fontFamily="Playfair Display, serif" fontSize="10" textAnchor="middle" x="285" y="285">
                      {currentLevel.cadSpan}
                    </text>
                  </svg>
                </div>
              </div>

              {/* Level Details Metadata */}
              <div className="w-full lg:w-2/5 flex flex-col gap-4 sm:gap-5">
                <div>
                  <span className="inline-block bg-[#faf6ed] border border-[#c9a84c]/45 px-3.5 py-1 rounded-full text-[#8b6914] text-xs font-semibold mb-2">
                    {currentLevel.badge}
                  </span>
                  <h3 className="text-2xl sm:text-[34px] font-medium text-[#1c1812]">
                    {currentLevel.title}
                  </h3>
                  <p className="text-sm sm:text-base text-[#4a4236] mt-2 leading-relaxed">
                    {currentLevel.desc}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <div className="bg-[#faf6ed] border border-[#c9a84c]/30 p-3 sm:p-4 rounded-xl">
                    <span className="text-[11px] sm:text-xs text-[#6e6454] block">Floor Area</span>
                    <span className="text-xl sm:text-2xl text-[#8b6914] font-medium tracking-wide">{currentLevel.area}</span>
                  </div>
                  <div className="bg-[#faf6ed] border border-[#c9a84c]/30 p-3 sm:p-4 rounded-xl">
                    <span className="text-[11px] sm:text-xs text-[#6e6454] block">Ceiling Height</span>
                    <span className="text-xl sm:text-2xl text-[#1c1812] font-medium tracking-wide">{currentLevel.height}</span>
                  </div>
                  <div className="bg-[#faf6ed] border border-[#c9a84c]/30 p-3 sm:p-4 rounded-xl">
                    <span className="text-[11px] sm:text-xs text-[#6e6454] block">Water Element</span>
                    <span className="text-xs sm:text-sm text-[#1c1812] font-medium tracking-wide">{currentLevel.water}</span>
                  </div>
                  <div className="bg-[#faf6ed] border border-[#c9a84c]/30 p-3 sm:p-4 rounded-xl">
                    <span className="text-[11px] sm:text-xs text-[#6e6454] block">Primary Material</span>
                    <span className="text-xs sm:text-sm text-[#1c1812] font-medium tracking-wide">{currentLevel.material}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 4. ENVIRONMENTAL & BIOPHILIC HARMONY */}
        <div className="w-full px-4 sm:px-6 md:px-20 py-12 sm:py-16 relative">
          <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-6 sm:gap-10 items-center">
            <div ref={ecoLeftRef} className="w-full lg:w-5/12 flex flex-col bg-white/80 md:backdrop-blur-md p-6 sm:p-8 rounded-3xl border border-[#c9a84c]/35 shadow-lg hover:shadow-[0_20px_50px_rgba(140,110,45,0.16)] transition-shadow duration-500">
              <span className="text-xs text-[#8b6914] uppercase tracking-[0.2em] font-medium mb-2">
                {mp.ecoKicker}
              </span>
              <h2 className="text-2xl sm:text-[36px] font-medium text-[#1c1812] leading-tight">
                {mp.ecoTitle}
              </h2>
              <p className="text-sm sm:text-base text-[#4a4236] mt-3 sm:mt-4 leading-relaxed">
                {mp.ecoDescription}
              </p>

              <div className="mt-6 sm:mt-8 flex flex-col gap-3 sm:gap-4">
                {mp.ecoFeatures.map((feat, idx) => (
                  <div
                    key={`${feat.title}-${idx}`}
                    className="p-3.5 sm:p-4 rounded-xl bg-[#faf6ed] border border-[#c9a84c]/25 hover:border-[#b58b28] hover:translate-x-1 transition-all duration-300"
                  >
                    <h4 className="text-sm sm:text-base text-[#1c1812] font-medium tracking-wide">
                      {feat.title}
                    </h4>
                    <p className="text-xs sm:text-sm text-[#574e40] mt-0.5">{feat.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            <div ref={ecoBentoRef} className="w-full lg:w-7/12 grid grid-cols-2 gap-3.5 sm:gap-6">
              {mp.ecoBentoCards.map((card, idx) =>
                card.isRing ? (
                  <div
                    key={`${card.title}-${idx}`}
                    className="group rounded-2xl sm:rounded-3xl p-4 sm:p-8 flex flex-col items-center text-center md:backdrop-blur-md bg-white/85 border border-[#c9a84c]/35 shadow-lg hover:-translate-y-1.5 hover:border-[#b58b28] hover:shadow-[0_22px_50px_rgba(140,110,45,0.2)] transition-all duration-500"
                  >
                    <div className="relative w-20 h-20 sm:w-32 sm:h-32 flex items-center justify-center my-1 sm:my-2 group-hover:scale-105 transition-transform duration-500">
                      <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                        <circle className="text-[#eee6d5]" cx="60" cy="60" fill="none" r="50" stroke="currentColor" strokeWidth="8" />
                        <circle
                          className={idx % 2 === 0 ? "text-[#c9a84c]" : "text-[#b58b28]"}
                          cx="60"
                          cy="60"
                          fill="none"
                          r="50"
                          stroke="currentColor"
                          strokeDasharray="314"
                          strokeDashoffset={idx % 2 === 0 ? "0" : "6"}
                          strokeLinecap="round"
                          strokeWidth="8"
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-lg sm:text-2xl text-[#8b6914] font-medium tracking-wide">
                          {card.topValue}
                        </span>
                        <span className="text-[8px] sm:text-[10px] text-[#6e6454] uppercase tracking-wider">
                          {card.topLabel}
                        </span>
                      </div>
                    </div>
                    <h3 className="text-sm sm:text-lg text-[#1c1812] font-medium tracking-wide mt-1.5 sm:mt-2">
                      {card.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-[#574e40] mt-1 leading-snug">
                      {card.desc}
                    </p>
                  </div>
                ) : (
                  <div
                    key={`${card.title}-${idx}`}
                    className="group rounded-2xl sm:rounded-3xl p-4 sm:p-8 flex flex-col justify-between md:backdrop-blur-md bg-white/85 border border-[#c9a84c]/35 shadow-lg hover:-translate-y-1.5 hover:border-[#b58b28] hover:shadow-[0_22px_50px_rgba(140,110,45,0.2)] transition-all duration-500"
                  >
                    <span className="text-[10px] sm:text-xs text-[#8b6914] font-medium uppercase tracking-wider">
                      {card.topLabel}
                    </span>
                    <div className="mt-3 sm:mt-4">
                      <div className="text-xl sm:text-3xl text-[#1c1812] font-medium tracking-wide group-hover:text-[#8b6914] transition-colors">
                        {card.topValue}
                      </div>
                      <p className="text-xs sm:text-sm text-[#574e40] mt-1 leading-snug">
                        {card.desc}
                      </p>
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        </div>

        {/* 5. ARCHITECTURAL LAND SUMMARY STRIP */}
        <div className="w-full px-4 sm:px-6 md:px-20 pb-14 sm:pb-20">
          <div ref={landSummaryRef} className="max-w-7xl mx-auto rounded-2xl sm:rounded-3xl bg-white/85 md:backdrop-blur-md p-6 sm:p-8 md:p-12 border border-[#c9a84c]/40 shadow-[0_18px_45px_rgba(140,110,45,0.12)] grid grid-cols-2 md:grid-cols-4 gap-5 sm:gap-8 text-center md:text-left">
            {mp.landSummaryStats.map((stat, idx) => (
              <div key={`${stat.label}-${idx}`}>
                <span className="text-[10px] sm:text-xs uppercase tracking-widest text-[#8b6914] font-medium block mb-1">
                  {stat.label}
                </span>
                <div className="text-xl sm:text-3xl font-medium tracking-wide text-[#1c1812]">
                  {stat.value}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
