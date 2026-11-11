"use client";

import React, { useEffect, useRef, useState } from "react";
import { getLenis } from "@/hooks/useLenis";
import { useSiteConfig } from "@/context/SiteConfigContext";
import {
  FONT_STACKS,
  getImageFramingStyle,
  type SitePageId,
} from "@/lib/defaultSiteConfig";

export interface HeroOverlayProps {
  onInquireClick?: () => void;
}

type ActiveSection = SitePageId;

export default function HeroOverlay({ onInquireClick }: HeroOverlayProps) {
  const { config } = useSiteConfig();
  const { brand, hero, design } = config;
  const headerRef = useRef<HTMLElement | null>(null);
  const heroRef = useRef<HTMLDivElement | null>(null);
  const [activeSection, setActiveSection] = useState<ActiveSection>("residence");
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  const isBrightHeader = activeSection !== "residence";

  const scrollToFrame = (targetFrame: number) => {
    setMobileMenuOpen(false);
    const container = document.getElementById("canvas-sequence-container");
    if (!container) return;

    const scrollable = container.offsetHeight - window.innerHeight;
    if (scrollable <= 0) return;

    const progress = Math.max(0, Math.min(1, (targetFrame - 1) / (2392 - 1)));
    const targetY = container.offsetTop + progress * scrollable;

    const lenis = getLenis();
    if (lenis) {
      lenis.scrollTo(targetY, { duration: 1.0 });
    } else {
      window.scrollTo({ top: targetY, behavior: "smooth" });
    }
  };

  const scrollToSection = (sectionId: string) => {
    setMobileMenuOpen(false);
    const targetEl = document.getElementById(sectionId);
    if (!targetEl) return;

    const lenis = getLenis();
    if (lenis) {
      lenis.scrollTo(targetEl, { offset: -20, duration: 1.0 });
    } else {
      targetEl.scrollIntoView({ behavior: "smooth" });
    }
  };

  const sectionLabels: Record<ActiveSection, string> = {
    residence: brand.navResidenceLabel,
    materiality: brand.navMaterialityLabel,
    masterplan: brand.navMasterplanLabel,
    contact: brand.navContactLabel,
  };

  const pageOrder: SitePageId[] = design?.pageOrder?.length
    ? design.pageOrder
    : ["residence", "materiality", "masterplan", "contact"];

  const orderedNavItems = pageOrder.map((id) => ({
    id,
    label: sectionLabels[id],
    action: () =>
      id === "residence" ? scrollToFrame(1) : scrollToSection(id),
  }));

  useEffect(() => {
    let ticking = false;
    let isScrolledClass = false;
    let lastMeasuredW = 0;
    let cachedCanvasTop = 0;
    let cachedViewportH = typeof window !== "undefined" ? window.innerHeight : 800;
    let cachedSections: { id: ActiveSection; top: number; bottom: number }[] = [];

    const getDocRange = (elId: string) => {
      const el = document.getElementById(elId);
      if (!el) return null;
      const baseScroll = window.scrollY || window.pageYOffset;
      const rect = el.getBoundingClientRect();
      return {
        top: rect.top + baseScroll,
        bottom: rect.bottom + baseScroll,
      };
    };

    const measureRanges = (force = false) => {
      const curW = window.innerWidth;
      if (!force && lastMeasuredW && Math.abs(curW - lastMeasuredW) <= 2) {
        return;
      }
      lastMeasuredW = curW;
      cachedViewportH = window.innerHeight;

      const canvasEl = document.getElementById("canvas-sequence-container");
      cachedCanvasTop = canvasEl ? canvasEl.offsetTop : 0;

      const nextSections: { id: ActiveSection; top: number; bottom: number }[] = [];
      const rRes = getDocRange("canvas-sequence-container");
      if (rRes) nextSections.push({ id: "residence", ...rRes });
      const rMat = getDocRange("materiality");
      if (rMat) nextSections.push({ id: "materiality", ...rMat });
      const rMas = getDocRange("masterplan");
      if (rMas) nextSections.push({ id: "masterplan", ...rMas });
      const rCon = getDocRange("contact");
      if (rCon) nextSections.push({ id: "contact", ...rCon });
      nextSections.sort((a, b) => a.top - b.top);
      cachedSections = nextSections;
    };

    const updateOnScroll = () => {
      const scrollY = window.scrollY || window.pageYOffset;

      if (headerRef.current) {
        const shouldScrolled = scrollY > 35;
        if (shouldScrolled !== isScrolledClass) {
          isScrolledClass = shouldScrolled;
          headerRef.current.classList.toggle("header-scrolled", shouldScrolled);
          headerRef.current.classList.toggle("header-top", !shouldScrolled);
        }
      }

      // Fade Hero headline gracefully using cached container top (zero layout reflow on scroll)
      if (heroRef.current) {
        if (!cachedSections.length) {
          heroRef.current.style.visibility = "hidden";
          heroRef.current.style.opacity = "0";
        } else {
          const canvasRectTop = cachedCanvasTop - scrollY;
          const pastCanvasTop = -canvasRectTop;
          const isBeforeCanvas = canvasRectTop > cachedViewportH * 0.45;
          const fadeProgress = Math.min(1, Math.max(0, pastCanvasTop / 180));
          const opacity = isBeforeCanvas ? 0 : Math.max(0, 1 - fadeProgress * 1.15);

          if (opacity <= 0) {
            if (heroRef.current.style.visibility !== "hidden") {
              heroRef.current.style.opacity = "0";
              heroRef.current.style.pointerEvents = "none";
              heroRef.current.style.visibility = "hidden";
            }
          } else {
            const isMobileViewport = window.innerWidth < 640;
            const effectiveOffsetX = isMobileViewport ? 0 : (design?.heroOffsetX ?? 0);
            const effectiveOffsetY = isMobileViewport ? 0 : (design?.heroOffsetY ?? 0);
            const translateY = -fadeProgress * 55;
            heroRef.current.style.opacity = String(opacity);
            heroRef.current.style.transform = `translate3d(${effectiveOffsetX}px, ${translateY + effectiveOffsetY}px, 0)`;
            heroRef.current.style.pointerEvents = opacity < 0.05 ? "none" : "auto";
            heroRef.current.style.visibility = "visible";
          }
        }
      }

      // Detect active section dynamically using cached section bounds
      const probeDocY = scrollY + cachedViewportH * 0.42;
      let nextActive: ActiveSection = cachedSections[0]?.id ?? "residence";
      for (const s of cachedSections) {
        if (probeDocY >= s.top) {
          nextActive = s.id;
        }
      }
      setActiveSection((prev) => {
        if (prev === nextActive) return prev;
        return nextActive;
      });

      ticking = false;
    };

    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(updateOnScroll);
        ticking = true;
      }
    };

    const handleResize = () => {
      measureRanges(false);
      updateOnScroll();
    };

    measureRanges(true);
    const remeasureTimer = setTimeout(() => {
      measureRanges(true);
      updateOnScroll();
    }, 350);
    const lateRemeasureTimer = setTimeout(() => {
      measureRanges(true);
      updateOnScroll();
    }, 1200);
    window.addEventListener("resize", handleResize, { passive: true });
    window.addEventListener("scroll", handleScroll, { passive: true });
    updateOnScroll();

    return () => {
      clearTimeout(remeasureTimer);
      clearTimeout(lateRemeasureTimer);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleScroll);
    };
  }, [pageOrder, design?.heroOffsetX, design?.heroOffsetY]);

  // Dynamic Browser Address Bar URL Sync when navigating / scrolling sections
  const initialMountTimeRef = useRef<number>(Date.now());
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (design?.dynamicUrlSync === false) return;

    const pathname = window.location.pathname.toLowerCase();
    // Allow initial deep-link auto-scroll (~650ms) to finish before overwriting non-root deep URLs
    if (pathname !== "/" && Date.now() - initialMountTimeRef.current < 650) {
      return;
    }

    const pageMeta = design?.pages?.[activeSection];
    let targetPath = pageMeta?.urlPath?.trim() || "/";
    if (!targetPath.startsWith("/")) {
      targetPath = "/" + targetPath;
    }
    const safePath = targetPath
      .split("/")
      .map((seg, i) => (i === 0 ? "" : encodeURIComponent(decodeURIComponent(seg))))
      .join("/");

    if (window.location.pathname !== safePath && !window.location.pathname.startsWith("/admin")) {
      window.history.replaceState(null, "", safePath);
    }
  }, [activeSection, design?.dynamicUrlSync, design?.pages]);

  return (
    <>
      {/* 1. Slightly Translucent Dual-Theme Architectural Header (Clearly Visible Yet See-Through) */}
      <header
        ref={headerRef}
        className="header-top fixed top-0 left-0 right-0 z-40 px-3 sm:px-8 md:px-12 pt-3 sm:pt-4 transition-colors duration-300 ease-out select-none pointer-events-none"
      >
        <div
          className={`header-capsule max-w-6xl mx-auto transition-colors duration-300 ease-out px-4 sm:px-6 md:px-10 py-2.5 sm:py-3 flex items-center justify-between pointer-events-auto ${
            isBrightHeader
              ? "rounded-2xl bg-white/55 backdrop-blur-md border border-[#b58b28]/45 shadow-[0_8px_28px_rgba(140,110,45,0.14)]"
              : "rounded-full bg-black/45 border border-white/25 hover:border-amber-300/45 shadow-[0_8px_24px_rgba(0,0,0,0.4)]"
          }`}
        >
          {/* Left: Brand Monogram & Bespoke Architectural Crest */}
          <button
            type="button"
            onClick={() => scrollToFrame(1)}
            className="flex items-center gap-2.5 sm:gap-3 group cursor-pointer text-left"
          >
            <div
              className={`relative w-9 h-9 sm:w-10 sm:h-10 rounded-full overflow-hidden border-[1.5px] transition-all duration-300 group-hover:scale-105 shrink-0 ${
                isBrightHeader
                  ? "border-[#8b6914]/85 ring-2 ring-[#b58b28]/25 shadow-[0_4px_12px_rgba(140,104,24,0.28)]"
                  : "border-amber-300/80 ring-2 ring-amber-300/25 shadow-[0_4px_14px_rgba(212,175,55,0.35)]"
              }`}
            >
              <img
                src={brand.headerLogoUrl || "/images/avijit-header-dp.jpg"}
                alt={brand.brandMiddleText}
                style={getImageFramingStyle(config, "brand.headerLogo", 50, 50, 100)}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 rounded-full shadow-[inset_0_1.5px_2px_rgba(255,255,255,0.45),inset_0_-2px_4px_rgba(0,0,0,0.35)]"
              />
            </div>
            {/* Prominently Capitalized Brand Monogram */}
            <div className="flex items-baseline gap-0.5 sm:gap-1 select-none">
              <span
                className={`font-display text-base sm:text-xl font-black leading-none transition-colors ${
                  isBrightHeader
                    ? "text-[#8b6914]"
                    : "text-amber-300 drop-shadow-[0_2px_10px_rgba(0,0,0,0.85)]"
                }`}
              >
                {brand.brandFirstLetter}
              </span>
              <span
                className={`font-display text-[10px] sm:text-xs font-bold tracking-[0.18em] sm:tracking-[0.2em] leading-none transition-colors ${
                  isBrightHeader
                    ? "text-[#1c1812]"
                    : "text-[#fbf6ee] drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]"
                }`}
              >
                {brand.brandMiddleText}
              </span>
              <span
                className={`font-display text-[11px] sm:text-sm font-black tracking-[0.22em] sm:tracking-[0.28em] uppercase ml-1 leading-none transition-colors ${
                  isBrightHeader
                    ? "text-[#9c7212]"
                    : "text-gold-gradient drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)]"
                }`}
              >
                {brand.brandLastWord}
              </span>
            </div>
          </button>

          {/* Desktop Navigation (md and above) */}
          <nav
            className={`hidden md:flex items-center gap-6 lg:gap-8 font-tech text-[11px] uppercase tracking-[0.22em] ${
              isBrightHeader
                ? "text-[#2c2419]"
                : "text-[#f5efe6] drop-shadow-[0_2px_8px_rgba(0,0,0,0.95)]"
            }`}
          >
            {orderedNavItems.map((item) => {
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={item.action}
                  className={`transition-all duration-300 relative group cursor-pointer uppercase py-1.5 ${
                    isBrightHeader
                      ? isActive
                        ? "text-[#8b6914] font-bold"
                        : "hover:text-[#8b6914]"
                      : isActive
                        ? "text-amber-300 font-semibold"
                        : "hover:text-amber-200"
                  }`}
                >
                  <span>{item.label}</span>
                  <span
                    className={`absolute bottom-0 left-0 h-[1.5px] transition-all duration-300 ${
                      isBrightHeader
                        ? "bg-gradient-to-r from-[#8b6914] to-[#d4af37]"
                        : "bg-gradient-to-r from-amber-400 to-amber-200"
                    } ${isActive ? "w-full" : "w-0 group-hover:w-full"}`}
                  />
                </button>
              );
            })}
          </nav>

          {/* Mobile Controls (< md): Transparent Active Badge + Clean Menu Toggle */}
          <div className="flex md:hidden items-center gap-2">
            <span
              className={`text-[9px] font-tech uppercase tracking-[0.16em] px-2.5 py-1 rounded-full border bg-transparent ${
                isBrightHeader
                  ? "border-[#8b6914]/60 text-[#8b6914] font-semibold"
                  : "border-amber-300/45 text-amber-200 drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)]"
              }`}
            >
              {sectionLabels[activeSection]}
            </span>

            <button
              type="button"
              aria-label="Toggle Navigation Menu"
              aria-expanded={mobileMenuOpen}
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className={`w-9 h-9 rounded-full flex items-center justify-center border transition-all cursor-pointer bg-transparent ${
                isBrightHeader
                  ? "border-[#8b6914]/60 text-[#1c1812]"
                  : "border-white/25 text-amber-200"
              }`}
            >
              {mobileMenuOpen ? (
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 8h16M4 16h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Clean Transparent Mobile Dropdown Menu */}
        <div
          className={`md:hidden max-w-6xl mx-auto mt-2 overflow-hidden transition-all duration-300 pointer-events-auto ${
            mobileMenuOpen ? "max-h-72 opacity-100" : "hidden max-h-0 opacity-0 pointer-events-none"
          }`}
        >
          <div
            className={`rounded-2xl p-3 flex flex-col gap-1.5 border ${
              mobileMenuOpen ? "backdrop-blur-md" : ""
            } ${
              isBrightHeader
                ? "bg-white/45 border-[#c9a84c]/55 text-[#1c1812]"
                : "bg-black/45 border-amber-300/30 text-[#f5ede0]"
            }`}
          >
            {orderedNavItems.map((item) => {
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={item.action}
                  className={`w-full text-left px-4 py-2.5 rounded-xl font-tech text-xs uppercase tracking-[0.2em] flex items-center justify-between transition-all cursor-pointer ${
                    isBrightHeader
                      ? isActive
                        ? "border border-[#b58b28]/60 text-[#8b6914] font-bold"
                        : "hover:bg-white/30 text-[#2c2419]"
                      : isActive
                        ? "border border-amber-300/45 text-amber-300 font-semibold"
                        : "hover:bg-white/10 text-[#f5efe6]"
                  }`}
                >
                  <span>{item.label}</span>
                  <span className="text-[10px] opacity-70">{isActive ? "Active" : "→"}</span>
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* 2. Responsive Hero Section: Customizable Position, Text Alignment & Font Style */}
      {(() => {
        const placement = design?.heroPlacement ?? "top-left";
        const align = design?.heroTextAlign ?? "left";
        const resFont = design?.pages?.residence?.pageFont ?? "inherit";
        const heroColors = design?.colors;
        const hasCustomHeroTitle =
          heroColors?.heroTitleColor &&
          heroColors.heroTitleColor.toLowerCase() !== "#f2ca50";

        const isBottomPlacement =
          placement === "bottom-left" ||
          placement === "bottom-right" ||
          placement === "bottom-center";

        const containerPosClass =
          placement === "center"
            ? "justify-center items-start sm:justify-center sm:items-center sm:pb-16"
            : placement === "top-right"
              ? "justify-center items-start sm:justify-start sm:items-end sm:pb-8"
              : placement === "bottom-left"
                ? "justify-center items-start sm:justify-end sm:items-start sm:pb-16"
                : placement === "bottom-right"
                  ? "justify-center items-start sm:justify-end sm:items-end sm:pb-16"
                  : placement === "bottom-center"
                    ? "justify-center items-start sm:justify-end sm:items-center sm:pb-16"
                    : "justify-center items-start sm:justify-start sm:items-start sm:pb-8";

        const textAlignClass =
          align === "center"
            ? "text-center mx-auto"
            : align === "right"
              ? "text-right ml-auto"
              : "text-left";

        const badgeJustify =
          align === "center"
            ? "justify-center"
            : align === "right"
              ? "justify-end"
              : "justify-start";

        return (
          <div
            ref={heroRef}
            className={`fixed inset-0 z-30 pointer-events-none select-none flex flex-col ${containerPosClass} pt-16 pb-16 sm:pt-32 md:pt-36 lg:pt-40 px-4 sm:px-12 md:px-20 lg:px-24 will-change-[transform,opacity] ${
              resFont !== "inherit" ? "section-custom-font" : ""
            }`}
            style={{
              transform: "translate3d(0, 0, 0)",
              ...(resFont !== "inherit"
                ? ({ "--section-font": FONT_STACKS[resFont] } as React.CSSProperties)
                : {}),
            }}
          >
            <div
              className={`max-w-[330px] sm:max-w-xl md:max-w-2xl ${textAlignClass} ${
                isBottomPlacement ? "mt-0 sm:mt-auto mb-0" : "mt-0 mb-0"
              }`}
            >
              {/* Subtitle Accent (Clean, no pointing dots) */}
              <div className={`flex items-center mb-2.5 sm:mb-3 ${badgeJustify}`}>
                <span className="text-[10px] sm:text-[11px] uppercase tracking-[0.24em] sm:tracking-[0.3em] text-amber-200/90 font-semibold font-body">
                  {hero.badgeText}
                </span>
              </div>

              {/* Monumental Display Title */}
              <h1
                style={
                  hasCustomHeroTitle
                    ? {
                        color: heroColors?.heroTitleColor,
                        WebkitTextFillColor: heroColors?.heroTitleColor,
                        backgroundImage: "none",
                      }
                    : undefined
                }
                className="font-display text-[28px] xs:text-[32px] sm:text-5xl md:text-6xl lg:text-[68px] font-bold tracking-[0.04em] sm:tracking-[0.05em] uppercase text-gold-gradient mb-3 sm:mb-4 drop-shadow-[0_2px_6px_rgba(0,0,0,0.85)] sm:drop-shadow-[0_8px_30px_rgba(0,0,0,0.9)] leading-[1.12] sm:leading-[1.08]"
              >
                {hero.headlineLine1} <br />
                <span className="text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.75)] sm:drop-shadow-[0_4px_25px_rgba(255,255,255,0.35)]">
                  {hero.headlineHighlight}
                </span>{" "}
                {hero.headlineLine2}
              </h1>

              {/* Poetic Luxury Statement */}
              <p
                style={heroColors?.heroTextColor ? { color: heroColors.heroTextColor } : undefined}
                className="font-editorial-italic text-sm sm:text-xl md:text-2xl text-[#f5ede0] font-light leading-relaxed mb-3.5 sm:mb-4 tracking-wide drop-shadow-[0_1px_4px_rgba(0,0,0,0.88)] sm:drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)]"
              >
                &ldquo;{hero.poeticQuote}&rdquo;
              </p>

              <p className={`font-body text-[10px] sm:text-xs text-amber-200/85 font-normal tracking-[0.14em] sm:tracking-[0.16em] uppercase mb-3 sm:mb-5 flex flex-wrap items-center gap-1.5 sm:gap-2 ${badgeJustify}`}>
                <span>{hero.tagLeft}</span>
                <span className="text-amber-400/60">•</span>
                <span>{hero.tagRight}</span>
              </p>

              <div
                className={`w-12 sm:w-16 h-[1.5px] bg-gradient-to-r from-amber-400 via-amber-300 to-transparent mb-2 sm:mb-3 ${
                  align === "center" ? "mx-auto" : align === "right" ? "ml-auto" : ""
                }`}
              />
            </div>

            {/* Animated Scroll Indicator */}
            <div className="absolute bottom-5 sm:bottom-8 left-4 sm:left-12 md:left-20 lg:left-24 flex items-center gap-3">
              <div className="w-5 h-8 rounded-full border border-white/20 flex items-start justify-center p-1">
                <div className="w-1 h-2 rounded-full bg-amber-400 animate-bounce" />
              </div>
              <span className="font-body text-[10px] tracking-[0.2em] uppercase text-[#cfc8bd] font-normal">
                {hero.scrollHint}
              </span>
            </div>
          </div>
        );
      })()}
    </>
  );
}
