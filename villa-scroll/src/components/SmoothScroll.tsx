"use client";

import React, { ReactNode } from "react";
import { useLenis } from "@/hooks/useLenis";
import "lenis/dist/lenis.css";

interface SmoothScrollProps {
  children: ReactNode;
}

/**
 * Global smooth scroll provider wrapping the application with Lenis
 */
export default function SmoothScroll({ children }: SmoothScrollProps) {
  useLenis();
  return <>{children}</>;
}
