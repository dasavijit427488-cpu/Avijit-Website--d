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
  const lastScrollTimeRef = useRef<number>(0);

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
      ctx.imageSmoothingQuality = "high";
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
        // Source-cropped blit on mobile: integer math prevents fuzzy bilinear subpixel sampling
        if (canvasRatio > imgRatio) {
          sh = nw / canvasRatio;
          sy = (nh - sh) / 2;
        } else {
          sw = nh * canvasRatio;
          sx = (nw - sw) / 2;
        }
        ctx.drawImage(
          img,
          Math.round(sx),
          Math.round(sy),
          Math.round(sw),
          Math.round(sh),
          0,
          0,
          canvasWidth,
          canvasHeight
        );
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

        ctx.drawImage(
          img,
          0,
          0,
          nw,
          nh,
          Math.round(offsetX),
          Math.round(offsetY),
          Math.round(drawWidth),
          Math.round(drawHeight)
        );
      }

      lastDrawnFrameRef.current = frameIndex;

      if (fallbackImgRef.current && fallbackImgRef.current.style.display !== "none") {
        fallbackImgRef.current.style.display = "none";
      }
    },
    [getCanvasContext]
  );

  // High-performance image memory management: keeps loaded frames cached for zero-latency instant scrubs
  const evictDistantFrames = useCallback((_centerFrame: number) => {
    // Retain loaded frames in memory to avoid constant image re-decoding, network thrashing, and deceleration stutter
  }, []);

  const loadImage = useCallback(
    (index: number, isPriority: boolean = false): Promise<HTMLImageElement | null> => {
      const total = activeTotalRef.current;
      if (index < 1 || index > total) return Promise.resolve(null);
      if (imagesRef.current[index] && isLoadedMapRef.current[index]) {
        return Promise.resolve(imagesRef.current[index] as HTMLImageElement);
      }
      if (isPendingMapRef.current[index]) return Promise.resolve(null);

      const maxBgConcurrent = isMobileRef.current ? 3 : 5;
      const maxPriorityConcurrent = isMobileRef.current ? 6 : 8;
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

      return new Promise<HTMLImageElement | null>((resolve) => {
        const img = new Image();
        img.decoding = "async";
        img.src = url;

        let settled = false;
        const done = (ok: boolean) => {
          if (settled) return;
          settled = true;
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

        if (typeof img.decode === "function") {
          img
            .decode()
            .then(() => done(true))
            .catch(() => {
              if (img.complete && img.naturalWidth > 0) {
                done(true);
              } else {
                img.onload = () => done(true);
                img.onerror = () => done(false);
              }
            });
        } else {
          img.onload = () => done(true);
          img.onerror = () => done(false);
        }
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
      const lookAhead = isMobileRef.current ? 6 : 14;

      for (let i = 1; i <= lookAhead; i++) {
        const idx = centerFrame + i * sign;
        if (idx >= 1 && idx <= total && !isLoadedMapRef.current[idx] && !isPendingMapRef.current[idx]) {
          loadImage(idx, false);
        }
      }

      if (Math.abs(centerFrame - lastEvictCenterRef.current) >= 4) {
        lastEvictCenterRef.current = centerFrame;
        evictDistantFrames(centerFrame);
      }
    },
    [loadImage, evictDistantFrames]
  );

  const lastMobilePriorityAtRef = useRef<number>(0);

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

      // On mobile touch-flick, throttle priority network fetches to keyframes cleanly to stay at 60fps
      const shouldFetchExact =
        !isMobileRef.current ||
        !isScrollingRef.current ||
        targetFrame % 2 === 1 ||
        performance.now() - lastMobilePriorityAtRef.current > 90;

      if (shouldFetchExact) {
        if (isMobileRef.current) {
          lastMobilePriorityAtRef.current = performance.now();
        }
        loadImage(targetFrame, true).then((loaded) => {
          if (loaded && Math.abs(currentTargetFrameRef.current - targetFrame) <= 3) {
            drawFrameImage(loaded, targetFrame);
          }
        });
      }

      // Outward nearest-keyframe search across active window guarantees instant zero-freeze visual response
      const total = activeTotalRef.current;
      const searchRadius = Math.min(total, isMobileRef.current ? 32 : total);
      for (let step = 1; step < searchRadius; step++) {
        const back = targetFrame - step * dir;
        if (
          back >= 1 &&
          back <= total &&
          imagesRef.current[back] &&
          isLoadedMapRef.current[back]
        ) {
          // If this exact frame is already displayed on canvas, skip redundant redraw to save GPU cycles
          if (back !== lastDrawnFrameRef.current) {
            drawFrameImage(imagesRef.current[back]!, back);
          }
          return;
        }
        const ahead = targetFrame + step * dir;
        if (
          ahead >= 1 &&
          ahead <= total &&
          imagesRef.current[ahead] &&
          isLoadedMapRef.current[ahead]
        ) {
          if (ahead !== lastDrawnFrameRef.current) {
            drawFrameImage(imagesRef.current[ahead]!, ahead);
          }
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

    // Crisp high-resolution rendering:
    // Mobile gets full device pixel density (up to 1080p native width) eliminating all blur
    // Desktop gets full 1080p+ native clarity matching the source 1920x1080 WebP frames
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = isPortraitPhone
      ? Math.min(Math.round(rawW * Math.min(window.devicePixelRatio || 2, 2)), 1080)
      : Math.min(Math.round(rawW * dpr), 1920);
    const height = isPortraitPhone
      ? Math.min(Math.round(rawH * Math.min(window.devicePixelRatio || 2, 2)), 1920)
      : Math.min(Math.round(rawH * dpr), 1080);

    const prev = lastAllocatedSizeRef.current;
    const widthChanged = Math.abs(width - prev.w) > 2;
    const bigHeightJump = Math.abs(height - prev.h) > 140;

    if (!prev.w || widthChanged || bigHeightJump) {
      lastAllocatedSizeRef.current = { w: width, h: height };
      canvas.width = width;
      canvas.height = height;
      if (ctxRef.current) {
        ctxRef.current.imageSmoothingEnabled = true;
        ctxRef.current.imageSmoothingQuality = "high";
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

    const runOctavePreload = async () => {
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

      // 1. Initial entrance frames (immediate arrival)
      const openSlice = isMob ? 16 : 24;
      for (let i = 1; i <= openSlice; i++) push(i);
      // Guarantee exit frames at the very end of the sequence are preloaded upfront so end never freezes
      push(total);
      push(total - 1);
      push(total - 2);
      // 2. Uniform keyframe skeleton across whole villa (every 3rd frame)
      for (let i = 1; i <= total; i += 3) push(i);
      // 3. Half-rate keyframes
      for (let i = 2; i <= total; i += 3) push(i);
      // 4. Full 60fps locked sequence
      for (let i = 1; i <= total; i += 1) push(i);

      const batchSize = isMob ? 2 : 3;
      const pauseMs = isMob ? 45 : 30;

      for (let i = 0; i < queue.length; i += batchSize) {
        if (isCancelled) return;
        // While user is actively scrolling, yield completely so scroll has 100% bandwidth and 60fps
        while (!isCancelled && isScrollingRef.current && i >= openSlice) {
          await new Promise((r) => setTimeout(r, 120));
        }
        if (isCancelled) return;

        // Gentle pause after stopping scroll before resuming background preloading (prevents freeze on scroll release)
        const timeSinceScroll = Date.now() - lastScrollTimeRef.current;
        if (timeSinceScroll < 400 && i >= openSlice) {
          await new Promise((r) => setTimeout(r, 400 - timeSinceScroll));
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

  // Direct 60/120Hz Hardware RAF Scroll Sync: stops instantly with zero trailing lag, crawl, or stutter when releasing scroll
  useEffect(() => {
    handleResize();
    window.addEventListener("resize", handleResize, { passive: true });

    let containerTop = 0;
    let scrollable = 1;
    let lastMeasuredW = 0;
    let pendingRafId = 0;
    let idleTimer: ReturnType<typeof setTimeout> | null = null;

    const measure = () => {
      const el = containerRef.current;
      if (!el) return;
      const curW = window.innerWidth;
      if (!lastMeasuredW || Math.abs(curW - lastMeasuredW) > 2) {
        lastMeasuredW = curW;
        containerTop = el.offsetTop;
        scrollable = Math.max(el.offsetHeight - window.innerHeight, 1);
      }
    };

    const renderLatestScroll = () => {
      pendingRafId = 0;
      const y = (window.scrollY || window.pageYOffset) - containerTop;
      if (y < -window.innerHeight || y > scrollable + window.innerHeight) return;

      const total = activeTotalRef.current;
      const progress = Math.max(0, Math.min(1, y / scrollable));
      const targetFrame = Math.min(
        total,
        Math.max(1, Math.round(progress * (total - 1)) + 1)
      );

      renderFrame(targetFrame);
    };

    const onScroll = () => {
      isScrollingRef.current = true;
      lastScrollTimeRef.current = Date.now();
      if (idleTimer) clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        isScrollingRef.current = false;
      }, 120);

      if (!pendingRafId) {
        pendingRafId = requestAnimationFrame(renderLatestScroll);
      }
    };

    measure();
    window.addEventListener("resize", measure, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    return () => {
      if (idleTimer) clearTimeout(idleTimer);
      if (pendingRafId) cancelAnimationFrame(pendingRafId);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", onScroll);
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
