"use client";

import React, { useState, useEffect } from "react";
import { getLenis } from "@/hooks/useLenis";

export interface VillaRoom {
  id: string;
  name: string;
  startFrame: number;
  endFrame: number;
  sweetSpotFrame: number;
}

export const VILLA_ROOMS: VillaRoom[] = [
  { id: "entrance", name: "Entrance", startFrame: 50, endFrame: 600, sweetSpotFrame: 320 },
  { id: "kitchen", name: "Kitchen", startFrame: 610, endFrame: 1210, sweetSpotFrame: 960 },
  { id: "bedroom", name: "Bedroom", startFrame: 1220, endFrame: 1580, sweetSpotFrame: 1400 },
  { id: "bathroom", name: "Bathroom", startFrame: 1590, endFrame: 1795, sweetSpotFrame: 1720 },
  { id: "garden", name: "Garden", startFrame: 1800, endFrame: 2392, sweetSpotFrame: 2150 },
];

export interface FloatingNavProps {
  totalFrames?: number;
  rooms?: VillaRoom[];
}

export default function FloatingNav({
  totalFrames = 2392,
  rooms = VILLA_ROOMS,
}: FloatingNavProps) {
  const [activeRoom, setActiveRoom] = useState<VillaRoom | null>(null);
  const [isVisible, setIsVisible] = useState<boolean>(true);

  // High-precision zero-reflow active room detector
  useEffect(() => {
    let lastRoomId = "";
    let lastVisible = true;
    let containerTop = 0;
    let scrollable = 1;

    const measureContainer = () => {
      const container = document.getElementById("canvas-sequence-container");
      if (!container) return;
      containerTop = container.offsetTop;
      scrollable = Math.max(container.offsetHeight - window.innerHeight, 1);
    };

    const checkActiveRoom = () => {
      const scrolledInside = (window.scrollY || window.pageYOffset) - containerTop;
      const shouldBeVisible = scrolledInside >= -50 && scrolledInside <= scrollable + 50;

      if (shouldBeVisible !== lastVisible) {
        lastVisible = shouldBeVisible;
        setIsVisible(shouldBeVisible);
      }
      if (!shouldBeVisible) return;

      const progress = Math.max(0, Math.min(1, scrolledInside / scrollable));
      const scaledFrame = Math.round(progress * 2391) + 1;

      const current =
        rooms.find((r) => scaledFrame >= r.startFrame && scaledFrame <= r.endFrame) || null;

      const currentId = current ? current.id : "";
      if (currentId !== lastRoomId) {
        lastRoomId = currentId;
        setActiveRoom(current);
      }
    };

    measureContainer();
    window.addEventListener("resize", measureContainer, { passive: true });
    window.addEventListener("scroll", checkActiveRoom, { passive: true });
    checkActiveRoom();

    return () => {
      window.removeEventListener("resize", measureContainer);
      window.removeEventListener("scroll", checkActiveRoom);
    };
  }, [rooms, totalFrames]);

  const handleRoomClick = (room: VillaRoom) => {
    const container = document.getElementById("canvas-sequence-container");
    if (!container) return;

    const scrollable = container.offsetHeight - window.innerHeight;
    if (scrollable <= 0) return;

    const targetFrame = room.sweetSpotFrame;
    const progress = Math.max(0, Math.min(1, (targetFrame - 1) / 2391));
    const targetY = container.offsetTop + progress * scrollable;

    const lenis = getLenis();
    if (lenis) {
      lenis.scrollTo(targetY, {
        duration: 1.0,
      });
    } else {
      window.scrollTo({ top: targetY, behavior: "smooth" });
    }
  };

  if (!isVisible) return null;

  return (
    <aside
      className="fixed right-6 md:right-8 top-1/2 -translate-y-1/2 z-40 hidden md:flex flex-col items-end gap-4 pointer-events-none select-none"
      aria-label="Room Sequence Navigation"
    >
      {/* Room Markers List */}
      <div className="flex flex-col items-end gap-3.5 py-2">
        {rooms.map((room, idx) => {
          const isActive = activeRoom?.id === room.id;

          return (
            <button
              key={room.id}
              onClick={() => handleRoomClick(room)}
              className="pointer-events-auto group flex items-center gap-3 cursor-pointer py-1 focus:outline-none"
              aria-label={`Navigate to ${room.name}`}
            >
              {/* Room Name Label on Hover */}
              <span
                className={`text-[9px] uppercase tracking-[0.26em] font-tech transition-all duration-300 ${
                  isActive
                    ? "opacity-100 translate-x-0 text-amber-300 font-semibold drop-shadow-[0_0_8px_rgba(212,175,55,0.5)]"
                    : "opacity-0 -translate-x-1 group-hover:opacity-85 group-hover:translate-x-0 text-[#a8a196] font-normal"
                }`}
              >
                {room.name}
              </span>

              {/* Indicator Dot & Line */}
              <div className="flex items-center gap-1.5">
                <div
                  className={`transition-all duration-300 rounded-full ${
                    isActive
                      ? "w-6 h-[2px] bg-gradient-to-r from-amber-300 to-amber-100 shadow-[0_0_10px_rgba(223,194,153,0.8)]"
                      : "w-0 h-[2px] bg-transparent group-hover:w-2 group-hover:bg-amber-200/40"
                  }`}
                />
                <div
                  className={`transition-all duration-300 rounded-full ${
                    isActive
                      ? "w-2 h-2 bg-amber-300 shadow-[0_0_10px_rgba(223,194,153,0.9)] scale-125"
                      : "w-1.5 h-1.5 bg-white/25 group-hover:bg-amber-200/70 group-hover:scale-110"
                  }`}
                />
              </div>
            </button>
          );
        })}
      </div>
    </aside>
  );
}
