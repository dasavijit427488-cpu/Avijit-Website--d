"use client";

import React, {
  useEffect,
  useRef,
  useCallback,
  createContext,
  ReactNode,
} from "react";

export interface CanvasContextType {
  containerRef: React.RefObject<HTMLDivElement | null>;
  totalFrames: number;
}

export const CanvasContext = createContext<CanvasContextType>({
  containerRef: { current: null },
  totalFrames: 479,
});

interface CanvasSequenceProps {
  totalFrames?: number;
  initialPreloadCount?: number;
  framePrefix?: string;
  frameExtension?: string;
  className?: string;
  containerHeight?: string;
  children?: ReactNode;
}

const TOTAL_FRAMES_DEFAULT = 240;
const MOBILE_FRAMES_COUNT = 160;
const MOBILE_PREFIX = "/frames-mobile/frame_";

export default function CanvasSequence({
  totalFrames = TOTAL_FRAMES_DEFAULT,
  initialPreloadCount = 48,
  framePrefix = "/frames-opt/frame_",
  frameExtension = ".webp",
  className = "",
  containerHeight = "550vh",
  children,
}: CanvasSequenceProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);

  // Adaptive resolution profile: portrait phones use crisp 1080x1080 center frames + off-thread ImageBitmap, desktop uses 1920x1080 frames
  const isMobileRef = useRef<boolean>(false);
  const activeTotalRef = useRef<number>(totalFrames);
  const activePrefixRef = useRef<string>(framePrefix);

  const imagesRef = useRef<(HTMLImageElement | ImageBitmap | null)[]>([]);
  const isLoadedMapRef = useRef<boolean[]>([]);
  const isPendingMapRef = useRef<boolean[]>([]);

  const currentTargetFrameRef = useRef<number>(1);
  const lastDrawnFrameRef = useRef<number>(-1);
  const fallbackImgRef = useRef<HTMLImageElement | null>(null);
  const bgInFlightRef = useRef<number>(0);
  const priorityInFlightRef = useRef<number>(0);
  const priorityControllersRef = useRef<Map<number, AbortController>>(new Map());
  const isScrollingRef = useRef<boolean>(false);

  const getFramePath = useCallback(
    (index: number) => {
      const padded = String(index).padStart(4, "0");
      return `${activePrefixRef.current}${padded}${frameExtension}?v=clean7`;
    },
    [frameExtension]
  );

  const getCanvasContext = useCallback(() => {
    if (ctxRef.current) return ctxRef.current;
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (ctx) {
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = isMobileRef.current ? "low" : "medium";
      ctxRef.current = ctx;
    }
    return ctx;
  }, []);

  const drawFrameImage = useCallback(
    (img: HTMLImageElement | ImageBitmap, frameIndex: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const nw = "naturalWidth" in img ? img.naturalWidth : img.width;
      const nh = "naturalHeight" in img ? img.naturalHeight : img.height;
      if (!nw || !nh) return;

      const ctx = getCanvasContext();
      if (!ctx) return;

      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;

      const imgRatio = nw / nh;
      const canvasRatio = canvasWidth / canvasHeight;

      let sx = 0;
      let sy = 0;
      let sw = nw;
      let sh = nh;
      let drawWidth = canvasWidth;
      let drawHeight = canvasHeight;
      let offsetX = 0;
      let offsetY = 0;

      if (isMobileRef.current) {
        // Source-cropped blit on mobile: zero off-screen pixel overdraw
        if (canvasRatio > imgRatio) {
          sh = nw / canvasRatio;
          sy = (nh - sh) / 2;
        } else {
          sw = nh * canvasRatio;
          sx = (nw - sw) / 2;
        }
        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvasWidth, canvasHeight);
      } else {
        if (canvasRatio > imgRatio) {
          drawWidth = canvasWidth;
          drawHeight = canvasWidth / imgRatio;
          offsetY = (canvasHeight - drawHeight) / 2;
        } else {
          drawHeight = canvasHeight;
          drawWidth = canvasHeight * imgRatio;
          offsetX = (canvasWidth - drawWidth) / 2;
        }

        ctx.drawImage(img, 0, 0, nw, nh, offsetX, offsetY, drawWidth, drawHeight);
      }

      lastDrawnFrameRef.current = frameIndex;

      if (fallbackImgRef.current && fallbackImgRef.current.style.display !== "none") {
        fallbackImgRef.current.style.display = "none";
      }
    },
    [getCanvasContext]
  );

  // VRAM safeguard: evicts & closes distant ImageBitmaps outside active window on both mobile & desktop
  const evictDistantFrames = useCallback((centerFrame: number) => {
    const total = activeTotalRef.current;
    const keepRadius = isMobileRef.current ? 65 : 85;
    for (let i = 1; i <= total; i++) {
      if (Math.abs(i - centerFrame) > keepRadius && imagesRef.current[i]) {
        const item = imagesRef.current[i];
        if (item && "close" in item && typeof item.close === "function") {
          item.close();
        }
        imagesRef.current[i] = null;
        isLoadedMapRef.current[i] = false;
      }
    }
  }, []);

  const loadImage = useCallback(
    (index: number, isPriority: boolean = false): Promise<HTMLImageElement | ImageBitmap | null> => {
      const total = activeTotalRef.current;
      if (index < 1 || index > total) return Promise.resolve(null);
      if (imagesRef.current[index] && isLoadedMapRef.current[index]) {
        return Promise.resolve(imagesRef.current[index]);
      }
      if (isPendingMapRef.current[index]) return Promise.resolve(null);

      // Cancel stale scroll-priority fetches >18 frames away so current scroll position never waits behind old requests
      if (isPriority) {
        for (const [pendingIdx, ctrl] of priorityControllersRef.current.entries()) {
          if (Math.abs(pendingIdx - currentTargetFrameRef.current) > 18) {
            ctrl.abort();
            priorityControllersRef.current.delete(pendingIdx);
          }
        }
      }

      const maxBgConcurrent = isMobileRef.current ? 2 : 3;
      const maxPriorityConcurrent = isMobileRef.current ? 4 : 5;
      if (!isPriority && bgInFlightRef.current >= maxBgConcurrent) {
        return Promise.resolve(null);
      }
      if (isPriority && priorityInFlightRef.current >= maxPriorityConcurrent) {
        return Promise.resolve(null);
      }

      isPendingMapRef.current[index] = true;
      const counterRef = isPriority ? priorityInFlightRef : bgInFlightRef;
      counterRef.current++;

      const url = getFramePath(index);

      // Off-main-thread WebP decoding via createImageBitmap eliminates UI/scroll decode lag on both Mobile & Desktop
      if (typeof createImageBitmap === "function") {
        const controller = isPriority ? new AbortController() : null;
        if (controller) priorityControllersRef.current.set(index, controller);

        return fetch(url, controller ? { signal: controller.signal } : undefined)
          .then((res) => {
            if (!res.ok) throw new Error("Frame fetch failed");
            return res.blob();
          })
          .then((blob) => createImageBitmap(blob))
          .then((bitmap) => {
            if (controller) priorityControllersRef.current.delete(index);
            counterRef.current = Math.max(0, counterRef.current - 1);
            isPendingMapRef.current[index] = false;
            imagesRef.current[index] = bitmap;
            isLoadedMapRef.current[index] = true;
            return bitmap;
          })
          .catch(() => {
            if (controller) priorityControllersRef.current.delete(index);
            counterRef.current = Math.max(0, counterRef.current - 1);
            isPendingMapRef.current[index] = false;
            return null;
          });
      }

      return new Promise((resolve) => {
        const img = new Image();
        img.decoding = "async";
        img.src = url;

        const done = (ok: boolean) => {
          counterRef.current = Math.max(0, counterRef.current - 1);
          isPendingMapRef.current[index] = false;
          if (ok) {
            imagesRef.current[index] = img;
            isLoadedMapRef.current[index] = true;
            resolve(img);
          } else {
            resolve(null);
          }
        };

        img.onload = () => {
          if (typeof img.decode === "function") {
            img.decode().then(() => done(true)).catch(() => done(true));
          } else {
            done(true);
          }
        };
        img.onerror = () => done(false);
      });
    },
    [getFramePath]
  );

  const lastPreloadedCenterRef = useRef<number>(-1);
  const lastEvictCenterRef = useRef<number>(1);
  const lastDirRef = useRef<number>(1);

  const preloadAhead = useCallback(
    (centerFrame: number, dir: number) => {
      if (Math.abs(centerFrame - lastPreloadedCenterRef.current) < 1) return;
      lastPreloadedCenterRef.current = centerFrame;

      const total = activeTotalRef.current;
      const sign = dir >= 0 ? 1 : -1;
      const lookAhead = isMobileRef.current ? 4 : 5;

      for (let i = 1; i <= lookAhead; i++) {
        const idx = centerFrame + i * sign;
        if (idx >= 1 && idx <= total && !isLoadedMapRef.current[idx] && !isPendingMapRef.current[idx]) {
          loadImage(idx, false);
        }
      }

      if (Math.abs(centerFrame - lastEvictCenterRef.current) > 20) {
        lastEvictCenterRef.current = centerFrame;
        evictDistantFrames(centerFrame);
      }
    },
    [loadImage, evictDistantFrames]
  );

  const renderFrame = useCallback(
    (targetFrame: number) => {
      if (targetFrame === lastDrawnFrameRef.current) return;
      const dir = targetFrame >= currentTargetFrameRef.current ? 1 : -1;
      lastDirRef.current = dir;
      currentTargetFrameRef.current = targetFrame;

      preloadAhead(targetFrame, dir);

      const exact = imagesRef.current[targetFrame];
      if (exact && isLoadedMapRef.current[targetFrame]) {
        drawFrameImage(exact, targetFrame);
        return;
      }

      loadImage(targetFrame, true).then((loaded) => {
        if (loaded && Math.abs(currentTargetFrameRef.current - targetFrame) <= 3) {
          drawFrameImage(loaded, targetFrame);
        }
      });

      // Outward nearest-keyframe search across full sequence guarantees instant zero-freeze visual response
      const total = activeTotalRef.current;
      for (let step = 1; step < total; step++) {
        const back = targetFrame - step * dir;
        if (
          back >= 1 &&
          back <= total &&
          imagesRef.current[back] &&
          isLoadedMapRef.current[back]
        ) {
          drawFrameImage(imagesRef.current[back]!, back);
          return;
        }
        const ahead = targetFrame + step * dir;
        if (
          ahead >= 1 &&
          ahead <= total &&
          imagesRef.current[ahead] &&
          isLoadedMapRef.current[ahead]
        ) {
          drawFrameImage(imagesRef.current[ahead]!, ahead);
          return;
        }
      }
    },
    [drawFrameImage, loadImage, preloadAhead]
  );

  // Ignore minor mobile URL address bar height changes (<140px) so scrolling never triggers canvas reallocations
  const lastAllocatedSizeRef = useRef<{ w: number; h: number }>({ w: 0, h: 0 });

  const handleResize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rawW = window.innerWidth;
    const rawH = window.innerHeight;
    const isPortraitPhone = rawW < 768 && rawH >= rawW;
    const isMob = isMobileRef.current;

    // Portrait mobile matches 1080p center pixels ~1:1 (620x1180) for maximum crispness & 60fps fill-rate
    const dpr = isPortraitPhone
      ? Math.min(window.devicePixelRatio || 1, 1.45)
      : rawW < 768
        ? 1.25
        : Math.min(window.devicePixelRatio || 1, 2);
    const width = Math.min(Math.round(rawW * dpr), isPortraitPhone ? 620 : 1920);
    const height = Math.min(Math.round(rawH * dpr), isPortraitPhone ? 1180 : 1080);

    const prev = lastAllocatedSizeRef.current;
    const widthChanged = Math.abs(width - prev.w) > 2;
    const bigHeightJump = Math.abs(height - prev.h) > 140;

    if (!prev.w || widthChanged || bigHeightJump) {
      lastAllocatedSizeRef.current = { w: width, h: height };
      canvas.width = width;
      canvas.height = height;
      if (ctxRef.current) {
        ctxRef.current.imageSmoothingEnabled = true;
        ctxRef.current.imageSmoothingQuality = isMob ? "low" : "medium";
      }

      const currentFrame = lastDrawnFrameRef.current > 0 ? lastDrawnFrameRef.current : 1;
      const img = imagesRef.current[currentFrame];
      if (img && isLoadedMapRef.current[currentFrame]) {
        drawFrameImage(img, currentFrame);
      }
    }
  }, [drawFrameImage]);

  useEffect(() => {
    const isMob =
      typeof window !== "undefined" &&
      window.innerWidth < 768 &&
      window.innerHeight >= window.innerWidth;
    isMobileRef.current = isMob;
    activeTotalRef.current = isMob ? MOBILE_FRAMES_COUNT : totalFrames;
    activePrefixRef.current = isMob ? MOBILE_PREFIX : framePrefix;

    const total = activeTotalRef.current;
    imagesRef.current = new Array(total + 1).fill(null);
    isLoadedMapRef.current = new Array(total + 1).fill(false);
    isPendingMapRef.current = new Array(total + 1).fill(false);

    let isCancelled = false;
    let triggerEarlyPreload: (() => void) | null = null;

    const runOctavePreload = async () => {
      // Wait briefly for initial paint & hero controls unless the user scrolls/touches immediately
      await new Promise<void>((resolve) => {
        const timer = setTimeout(() => {
          cleanup();
          resolve();
        }, 320);
        const wakeup = () => {
          clearTimeout(timer);
          cleanup();
          resolve();
        };
        const cleanup = () => {
          window.removeEventListener("scroll", wakeup);
          window.removeEventListener("touchstart", wakeup);
          window.removeEventListener("wheel", wakeup);
        };
        triggerEarlyPreload = wakeup;
        window.addEventListener("scroll", wakeup, { once: true, passive: true });
        window.addEventListener("touchstart", wakeup, { once: true, passive: true });
        window.addEventListener("wheel", wakeup, { once: true, passive: true });
      });
      if (isCancelled) return;

      const first = await loadImage(1, true);
      if (isCancelled) return;
      if (first) drawFrameImage(first, 1);

      const seen = new Set<number>([1]);
      const queue: number[] = [];
      const push = (idx: number) => {
        const clamped = Math.min(total, Math.max(1, idx));
        if (!seen.has(clamped)) {
          seen.add(clamped);
          queue.push(clamped);
        }
      };

      const openSlice = 6;
      for (let i = 1; i <= openSlice; i++) push(i);
      const keyStep = Math.max(1, Math.floor(total / 16));
      for (let i = 1; i <= total; i += keyStep) push(i);
      for (let i = 1; i <= total; i += 4) push(i);
      for (let i = 1; i <= total; i += 2) push(i);
      for (let i = 1; i <= total; i += 1) push(i);

      const batchSize = isMob ? 2 : 3;
      const pauseMs = isMob ? 32 : 28;

      for (let i = 0; i < queue.length; i += batchSize) {
        if (isCancelled) return;
        while (isScrollingRef.current && !isCancelled) {
          await new Promise((r) => setTimeout(r, 120));
        }
        if (isCancelled) return;
        await Promise.all(queue.slice(i, i + batchSize).map((idx) => loadImage(idx, false)));
        await new Promise((r) => setTimeout(r, pauseMs));
      }
    };

    const controllers = priorityControllersRef.current;
    runOctavePreload();

    return () => {
      isCancelled = true;
      if (triggerEarlyPreload) triggerEarlyPreload();
      for (const ctrl of controllers.values()) {
        ctrl.abort();
      }
      controllers.clear();
      for (let i = 0; i < imagesRef.current.length; i++) {
        const item = imagesRef.current[i];
        if (item && "close" in item && typeof item.close === "function") {
          item.close();
        }
      }
    };
  }, [totalFrames, initialPreloadCount, framePrefix, loadImage, drawFrameImage]);

  // Direct Passive Scroll + Touch Guard (ignores mobile URL bar bounce resize)
  useEffect(() => {
    handleResize();
    window.addEventListener("resize", handleResize, { passive: true });

    let containerTop = 0;
    let scrollable = 1;
    let lastMeasuredW = 0;
    let rafPending = false;
    let idleTimer: ReturnType<typeof setTimeout> | null = null;

    const measure = () => {
      const el = containerRef.current;
      if (!el) return;
      const curW = window.innerWidth;
      // Only re-measure scrollable span when orientation/width changes (ignores 60px mobile URL bar jitter)
      if (!lastMeasuredW || Math.abs(curW - lastMeasuredW) > 2) {
        lastMeasuredW = curW;
        containerTop = el.offsetTop;
        scrollable = Math.max(el.offsetHeight - window.innerHeight, 1);
      }
    };

    const syncFrameFromScroll = () => {
      rafPending = false;
      const y = (window.scrollY || window.pageYOffset) - containerTop;
      if (y < -window.innerHeight || y > scrollable + window.innerHeight) return;

      const total = activeTotalRef.current;
      const progress = Math.max(0, Math.min(1, y / scrollable));
      const target = Math.min(
        total,
        Math.max(1, Math.round(progress * (total - 1)) + 1)
      );
      renderFrame(target);
    };

    const markScrolling = () => {
      isScrollingRef.current = true;
      if (idleTimer) clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        isScrollingRef.current = false;
      }, 180);

      if (!rafPending) {
        rafPending = true;
        requestAnimationFrame(syncFrameFromScroll);
      }
    };

    measure();
    window.addEventListener("resize", measure, { passive: true });
    window.addEventListener("scroll", markScrolling, { passive: true });
    syncFrameFromScroll();

    return () => {
      if (idleTimer) clearTimeout(idleTimer);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", markScrolling);
    };
  }, [handleResize, renderFrame]);

  return (
    <CanvasContext.Provider
      value={{
        containerRef,
        totalFrames,
      }}
    >
      <div
        id="canvas-sequence-container"
        ref={containerRef}
        className={`relative w-full ${className}`}
        style={{ height: containerHeight, touchAction: "pan-y" }}
      >
        <div className="sticky top-0 h-[100lvh] sm:h-[100dvh] w-full overflow-hidden bg-black flex items-center justify-center pointer-events-none">
          <picture className="contents">
            <source media="(max-width: 767px)" srcSet="/frames-mobile/frame_0001.webp?v=clean7" />
            <img
              ref={fallbackImgRef}
              src="/frames-opt/frame_0001.webp?v=clean7"
              alt="Avijit Villa"
              fetchPriority="high"
              decoding="sync"
              className="absolute inset-0 z-[2] w-full h-full object-cover pointer-events-none"
            />
          </picture>

          <canvas
            ref={canvasRef}
            className="w-full h-full block object-cover pointer-events-none relative z-[1] will-change-transform"
            style={{
              imageRendering: "auto",
              transform: "translate3d(0, 0, 0)",
            }}
          />

          <div className="relative z-[3] contents">{children}</div>
        </div>
      </div>
    </CanvasContext.Provider>
  );
}
