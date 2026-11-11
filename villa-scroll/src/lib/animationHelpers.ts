import type { AnimationConfig } from "@/lib/defaultSiteConfig";

export function getAnimationSpeedFactor(anim?: AnimationConfig): number {
  const spd = anim?.speed ?? "normal";
  if (spd === "slow") return 1.55;
  if (spd === "fast") return 0.55;
  return 1.0;
}

export function getMotionOffset(
  anim: AnimationConfig | undefined,
  defaultFrom: { x?: number; y?: number; scale?: number }
): { x: number; y: number; scale: number } {
  const mode = anim?.directionMode ?? "default";
  if (mode === "bottom-to-top") return { x: 0, y: 52, scale: 1 };
  if (mode === "left-to-right") return { x: -56, y: 0, scale: 1 };
  if (mode === "right-to-left") return { x: 56, y: 0, scale: 1 };
  if (mode === "zoom-in") return { x: 0, y: 12, scale: 0.92 };
  return {
    x: defaultFrom.x ?? 0,
    y: defaultFrom.y ?? 0,
    scale: defaultFrom.scale ?? 1,
  };
}

