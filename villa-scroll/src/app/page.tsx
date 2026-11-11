"use client";

import React, { useEffect, useMemo, useState } from "react";
import CanvasSequence from "@/components/CanvasSequence";
import HeroOverlay from "@/components/HeroOverlay";
import InteriorOverlays from "@/components/InteriorOverlays";
import FloatingNav from "@/components/FloatingNav";
import VisualEffects from "@/components/VisualEffects";
import MarbleScrollBackdrop from "@/components/MarbleScrollBackdrop";
import MaterialitySection from "@/components/MaterialitySection";
import FloorplanExplorer from "@/components/FloorplanExplorer";
import ContactSection from "@/components/ContactSection";
import InquiryModal from "@/components/InquiryModal";
import { useSiteConfig } from "@/context/SiteConfigContext";
import type { SitePageId } from "@/lib/defaultSiteConfig";

const TOTAL_FRAMES = 479;
const INITIAL_PRELOAD_COUNT = 60;

type RenderChunk =
  | { kind: "residence"; key: string }
  | { kind: "marble-group"; key: string; ids: Exclude<SitePageId, "residence">[] };

export default function Home() {
  const { config, isLoaded } = useSiteConfig();
  const [isInquiryOpen, setIsInquiryOpen] = useState<boolean>(false);

  // Support refreshing or opening any deep-link URL such as /The-Residence/Materiality
  useEffect(() => {
    if (typeof window === "undefined" || !isLoaded) return;
    const rawPath = decodeURIComponent(window.location.pathname).toLowerCase();
    if (rawPath === "/" || rawPath.startsWith("/admin")) return;

    const pages = config.design?.pages;
    let targetId: SitePageId | null = null;
    if (pages) {
      for (const id of ["contact", "masterplan", "materiality", "residence"] as SitePageId[]) {
        const cfgPath = (pages[id]?.urlPath || "").toLowerCase();
        if (cfgPath && rawPath === cfgPath) {
          targetId = id;
          break;
        }
      }
    }
    if (!targetId) {
      if (rawPath.includes("contact")) targetId = "contact";
      else if (rawPath.includes("masterplan")) targetId = "masterplan";
      else if (rawPath.includes("materiality")) targetId = "materiality";
    }

    if (targetId && targetId !== "residence") {
      const timer = setTimeout(() => {
        const el = document.getElementById(targetId as string);
        if (el) el.scrollIntoView({ behavior: "smooth" });
      }, 220);
      return () => clearTimeout(timer);
    }
  }, [isLoaded, config.design?.pages]);

  // Group consecutive light/marble sections under a shared MarbleScrollBackdrop
  const rawPageOrder = config.design?.pageOrder;
  const chunks = useMemo<RenderChunk[]>(() => {
    const pageOrder = rawPageOrder?.length
      ? rawPageOrder
      : (["residence", "materiality", "masterplan", "contact"] as SitePageId[]);
    const result: RenderChunk[] = [];
    for (const id of pageOrder) {
      if (id === "residence") {
        result.push({ kind: "residence", key: "residence" });
      } else {
        const last = result[result.length - 1];
        if (last && last.kind === "marble-group") {
          last.ids.push(id);
          last.key += `-${id}`;
        } else {
          result.push({ kind: "marble-group", key: `group-${id}`, ids: [id] });
        }
      }
    }
    return result;
  }, [rawPageOrder]);

  return (
    <main className="site-live-root relative min-h-screen bg-black text-white selection:bg-amber-400 selection:text-black">
      {/* Visual Polish: Screen Edge Vignette (Optimized GPU radial) */}
      <VisualEffects />

      {/* Floating Capsule Architectural Header & Residence Hero Overlay */}
      <HeroOverlay onInquireClick={() => setIsInquiryOpen(true)} />

      {/* Floating Progress Room Navigation (Fixed Right on Desktop) */}
      <FloatingNav totalFrames={TOTAL_FRAMES} />

      {/* Dynamically Ordered Website Pages */}
      {chunks.map((chunk) =>
        chunk.kind === "residence" ? (
          <CanvasSequence
            key={chunk.key}
            totalFrames={TOTAL_FRAMES}
            initialPreloadCount={INITIAL_PRELOAD_COUNT}
            framePrefix="/frames-opt/frame_"
            frameExtension=".webp"
            containerHeight="550vh"
          >
            <InteriorOverlays />
          </CanvasSequence>
        ) : (
          <div key={chunk.key} className="relative w-full bg-[#faf7f0]">
            <MarbleScrollBackdrop />
            {chunk.ids.map((sectionId) => {
              if (sectionId === "materiality") {
                return (
                  <MaterialitySection
                    key="materiality"
                    onInquireClick={() => setIsInquiryOpen(true)}
                  />
                );
              }
              if (sectionId === "masterplan") {
                return (
                  <FloorplanExplorer
                    key="masterplan"
                    onInquireClick={() => setIsInquiryOpen(true)}
                  />
                );
              }
              return <ContactSection key="contact" />;
            })}
          </div>
        )
      )}

      {/* Private Inquiry Modal */}
      <InquiryModal
        isOpen={isInquiryOpen}
        onClose={() => setIsInquiryOpen(false)}
      />
    </main>
  );
}
