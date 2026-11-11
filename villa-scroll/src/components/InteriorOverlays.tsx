"use client";

import React, { useEffect, useRef, useContext } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { CanvasContext } from "./CanvasSequence";
import { useSiteConfig } from "@/context/SiteConfigContext";
import { FONT_STACKS, type RoomPosition } from "@/lib/defaultSiteConfig";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export interface InteriorRoom {
  id: string;
  tag: string;
  subtitle: string;
  title: string;
  description: string;
  specs: string;
  position: RoomPosition;
  enterStart: number;
  enterEnd: number;
  exitStart: number;
  exitEnd: number;
}

export const INTERIOR_ROOMS: InteriorRoom[] = [
  {
    id: "entrance",
    tag: "ATRIUM",
    subtitle: "The Art of Arrival",
    title: "The Grand Entrance",
    description:
      "A soaring double-height portal framed in Roman travertine and floor-to-ceiling glass, introducing quiet monumentality.",
    specs: "4.5m Pivot Door • Recessed Ambient Halo",
    position: "bottom-left",
    enterStart: 0.03,
    enterEnd: 0.06,
    exitStart: 0.23,
    exitEnd: 0.26,
  },
  {
    id: "kitchen",
    tag: "CULINARY ATELIER",
    subtitle: "The Culinary Atelier",
    title: "Sculptural Kitchen",
    description:
      "Bookmatched Calacatta marble monolithic island paired with smoked oak millwork and integrated induction surfaces.",
    specs: "Gaggenau 400 Series • Hidden Scullery",
    position: "bottom-right",
    enterStart: 0.28,
    enterEnd: 0.31,
    exitStart: 0.48,
    exitEnd: 0.51,
  },
  {
    id: "bedroom",
    tag: "MASTER SUITE",
    subtitle: "The Twilight Sanctuary",
    title: "Master Bedroom Suite",
    description:
      "Floating platform king framed by acoustic slatted wall paneling, automated solar shading, and a private dawn veranda.",
    specs: "Sunrise Orientation • Dressing Suite",
    position: "bottom-left",
    enterStart: 0.52,
    enterEnd: 0.55,
    exitStart: 0.63,
    exitEnd: 0.66,
  },
  {
    id: "bathroom",
    tag: "MINERAL SPA",
    subtitle: "The Mineral Spa",
    title: "Monolithic Bathroom",
    description:
      "Freestanding honed basalt soaking tub surrounded by frameless glass that looks out onto a private bamboo sanctuary.",
    specs: "Rain Canopy • Heated Limestone",
    position: "bottom-right",
    enterStart: 0.67,
    enterEnd: 0.69,
    exitStart: 0.73,
    exitEnd: 0.75,
  },
  {
    id: "garden",
    tag: "ZENITH GARDEN",
    subtitle: "The Zenith Horizon",
    title: "Zenith Garden & Pool",
    description:
      "Linear heated reflection pool flanked by sculpted Mediterranean flora, sun lounge, and a sunken evening fire hearth.",
    specs: "Heated Saline • Fire Hearth",
    position: "bottom-left",
    enterStart: 0.76,
    enterEnd: 0.79,
    exitStart: 0.96,
    exitEnd: 1.0,
  },
];

export default function InteriorOverlays({
  rooms,
}: {
  rooms?: InteriorRoom[];
}) {
  const { config } = useSiteConfig();
  const activeRooms = rooms ?? config.rooms;
  const roomsPlacement = config.design?.roomsPlacement ?? "desktop-alternating";
  const roomsTextAlign = config.design?.roomsTextAlign ?? "left";
  const resFont = config.design?.pages?.residence?.pageFont ?? "inherit";
  const roomColors = config.design?.colors;
  const hasCustomRoomTitle =
    roomColors?.roomTitleColor &&
    roomColors.roomTitleColor.toLowerCase() !== "#f2ca50";

  const { containerRef } = useContext(CanvasContext);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      gsap.registerPlugin(ScrollTrigger);
    }
    const triggerEl = containerRef.current;
    if (!triggerEl) return;

    const isDesktop = typeof window !== "undefined" && window.innerWidth >= 640;

    cardRefs.current.forEach((card) => {
      if (card) {
        gsap.set(card, {
          opacity: 0,
          x: 0,
          y: 24,
          pointerEvents: "none",
        });
      }
    });

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: triggerEl,
          start: "top top",
          end: "bottom bottom",
          scrub: true,
        },
      });

      activeRooms.forEach((room, index) => {
        const card = cardRefs.current[index];
        if (!card) return;

        const enterStart = room.enterStart * 100;
        const enterEnd = room.enterEnd * 100;
        const exitStart = room.exitStart * 100;
        const exitEnd = room.exitEnd * 100;

        // Desktop: Alternate entering from Left (even index) & Right (odd index); Mobile stays Top-Left (vertical fade)
        let fromX = 0;
        if (isDesktop) {
          if (roomsPlacement === "desktop-alternating") {
            fromX = index % 2 === 0 ? -64 : 64;
          } else if (roomsPlacement === "top-right" || roomsPlacement === "bottom-right") {
            fromX = 64;
          } else if (roomsPlacement === "top-left" || roomsPlacement === "bottom-left") {
            fromX = -64;
          } else {
            fromX =
              room.position === "top-right" || room.position === "bottom-right"
                ? 64
                : -64;
          }
        }

        tl.fromTo(
          card,
          {
            opacity: 0,
            x: fromX,
            y: isDesktop ? 8 : 18,
            scale: isDesktop ? 0.98 : 1,
            force3D: true,
            pointerEvents: "none",
          },
          {
            opacity: 1,
            x: 0,
            y: 0,
            scale: 1,
            force3D: true,
            pointerEvents: "auto",
            ease: "power3.out",
            duration: enterEnd - enterStart,
          },
          enterStart
        );

        tl.to(
          card,
          {
            opacity: 0,
            x: isDesktop ? (fromX !== 0 ? fromX * -0.35 : 0) : 0,
            y: isDesktop ? -6 : -12,
            scale: isDesktop ? 0.98 : 1,
            force3D: true,
            pointerEvents: "none",
            ease: "power2.in",
            duration: exitEnd - exitStart,
          },
          exitStart
        );
      });
    });

    return () => {
      ctx.revert();
    };
  }, [containerRef, activeRooms, roomsPlacement]);

  return (
    <div
      className={`absolute inset-0 pointer-events-none z-30 select-none ${
        resFont !== "inherit" ? "section-custom-font" : ""
      }`}
      style={
        resFont !== "inherit"
          ? ({ "--section-font": FONT_STACKS[resFont] } as React.CSSProperties)
          : undefined
      }
    >
      {activeRooms.map((room, idx) => {
        const isOdd = idx % 2 === 1;

        let posClasses = "";
        let isRightOnDesktop = false;

        if (roomsPlacement === "desktop-alternating") {
          // Mobile (<640px) stays fixed Bottom-Left; Computer (sm+) stays Bottom and alternates Left <-> Right
          posClasses = isOdd
            ? "bottom-8 left-5 right-5 sm:left-auto sm:right-12 md:right-20 lg:right-24 sm:bottom-12 md:bottom-14"
            : "bottom-8 left-5 right-5 sm:right-auto sm:left-12 md:left-20 lg:left-24 sm:bottom-12 md:bottom-14";
          isRightOnDesktop = isOdd;
        } else {
          const effectivePos: RoomPosition =
            roomsPlacement === "per-room"
              ? room.position
              : (roomsPlacement as RoomPosition);

          posClasses =
            effectivePos === "top-right"
              ? "bottom-8 sm:bottom-auto sm:top-32 md:top-36 left-5 right-5 sm:left-auto sm:right-12 md:right-20 lg:right-24"
              : effectivePos === "bottom-left"
                ? "bottom-8 sm:bottom-12 md:bottom-14 left-5 right-5 sm:right-auto sm:left-12 md:left-20 lg:left-24"
                : effectivePos === "bottom-right"
                  ? "bottom-8 sm:bottom-12 md:bottom-14 left-5 right-5 sm:left-auto sm:right-12 md:right-20 lg:right-24"
                  : "bottom-8 sm:bottom-auto sm:top-32 md:top-36 left-5 right-5 sm:right-auto sm:left-12 md:left-20 lg:left-24";

          isRightOnDesktop =
            effectivePos === "top-right" || effectivePos === "bottom-right";
        }

        const desktopAlignClass =
          roomsTextAlign === "center"
            ? "text-center items-center"
            : roomsTextAlign === "right"
              ? "text-right items-end"
              : isRightOnDesktop
                ? "text-left items-start sm:text-right sm:items-end"
                : "text-left items-start";

        const dividerAlignClass =
          roomsTextAlign === "center"
            ? "mx-auto"
            : roomsTextAlign === "right"
              ? "ml-auto"
              : isRightOnDesktop
                ? "sm:ml-auto"
                : "";

        return (
          <div
            key={room.id}
            ref={(el) => {
              cardRefs.current[idx] = el;
            }}
            style={{ opacity: 0, pointerEvents: "none" }}
            className={`absolute ${posClasses} sm:w-auto sm:max-w-xl md:max-w-2xl`}
          >
            {/* Open Frameless Hero-Matched Architectural Typography */}
            <div className={`relative flex flex-col ${desktopAlignClass}`}>
              {/* Soft Ambient Radial Scrim (GPU blur on desktop, zero-blur radial gradient on mobile) */}
              <div
                aria-hidden="true"
                className="pointer-events-none -inset-4 sm:-inset-6 absolute rounded-full bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0.42)_0%,rgba(0,0,0,0)_72%)] sm:bg-none sm:bg-black/30 sm:blur-xl -z-10"
              />

              {/* Clean Category Subtitle (No dots, no numbers, no pill border) */}
              <span className="text-[10px] sm:text-[11px] uppercase tracking-[0.26em] sm:tracking-[0.3em] text-amber-200/90 font-semibold font-body mb-2 drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)] sm:drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)]">
                {room.subtitle}
              </span>

              {/* Monumental Hero-Matched Display Title */}
              <h3
                style={
                  hasCustomRoomTitle
                    ? {
                        color: roomColors?.roomTitleColor,
                        WebkitTextFillColor: roomColors?.roomTitleColor,
                        backgroundImage: "none",
                      }
                    : undefined
                }
                className="font-display text-3xl sm:text-5xl md:text-[54px] font-bold uppercase tracking-[0.04em] text-gold-gradient mb-3.5 leading-[1.08] drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)] sm:drop-shadow-[0_8px_30px_rgba(0,0,0,0.95)]"
              >
                {room.title}
              </h3>

              {/* Clean Poetic Architectural Statement + Subtle Divider Bar */}
              <p
                style={roomColors?.roomTextColor ? { color: roomColors.roomTextColor } : undefined}
                className="font-editorial-italic text-sm sm:text-xl md:text-[22px] text-[#f5ede0] font-light leading-relaxed tracking-wide drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)] sm:drop-shadow-[0_2px_14px_rgba(0,0,0,0.98)] max-w-xl mb-4"
              >
                &ldquo;{room.description}&rdquo;
              </p>

              <div
                className={`w-14 sm:w-16 h-[1.5px] bg-gradient-to-r from-amber-400 via-amber-300 to-transparent ${dividerAlignClass}`}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
