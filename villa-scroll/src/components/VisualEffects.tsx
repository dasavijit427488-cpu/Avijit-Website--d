"use client";

import React from "react";

export default function VisualEffects() {
  return (
    <>
      {/* Soft Cinematic Screen-Edge Vignette (Desktop only — saves full-screen mobile alpha blend pass) */}
      <div
        className="hidden md:block fixed inset-0 pointer-events-none z-10 select-none"
        style={{
          background:
            "radial-gradient(circle at 50% 50%, rgba(0, 0, 0, 0) 60%, rgba(0, 0, 0, 0.4) 85%, rgba(0, 0, 0, 0.75) 100%)",
        }}
        aria-hidden="true"
      />
    </>
  );
}
