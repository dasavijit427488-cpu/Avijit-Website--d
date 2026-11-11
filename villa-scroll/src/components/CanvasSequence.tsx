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

const TOTAL_FRAMES_DEFAULT = 479;
const MOBILE_FRAMES_COUNT = 240;
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
  const inFlightCountRef = useRef<number>(0);
  const isScrollingRef = useRef<boolean>(false);

  const getFramePath = useCallback(
    (index: number) => {
      const padded = String(index).padStart(4, "0");
      const v = isMobileRef.current ? "clean4" : "clean3";
      return `${activePrefixRef.current}${padded}${frameExtension}?v=${v}`;
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
      ctx.imageSmoothingQuality = isMobileRef.current ? "low" : "high";
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

  // Mobile VRAM safeguard: evicts & closes distant ImageBitmaps outside ±55 frames (~110 active frames)
  const evictDistantMobileFrames = useCallback((centerFrame: number) => {
    if (!isMobileRef.current) return;
    const total = activeTotalRef.current;
    const keepRadius = 55;
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

      const maxBgConcurrent = isMobileRef.current ? 3 : 4;
      const maxPriorityConcurrent = isMobileRef.current ? 5 : 12;
      if (!isPriority && inFlightCountRef.current >= maxBgConcurrent) {
        return Promise.resolve(null);
      }
      if (isPriority && inFlightCountRef.current >= maxPriorityConcurrent) {
        return Promise.resolve(null);
      }

      isPendingMapRef.current[index] = true;
      inFlightCountRef.current++;

      const url = getFramePath(index);

      // Mobile off-main-thread WebP decoding via createImageBitmap eliminates UI/scroll decode lag
      if (isMobileRef.current && typeof createImageBitmap === "function") {
        return fetch(url)
          .then((res) => {
            if (!res.ok) throw new Error("Frame fetch failed");
            return res.blob();
          })
          .then((blob) => createImageBitmap(blob))
          .then((bitmap) => {
            inFlightCountRef.current = Math.max(0, inFlightCountRef.current - 1);
            isPendingMapRef.current[index] = false;
            imagesRef.current[index] = bitmap;
            isLoadedMapRef.current[index] = true;
            return bitmap;
          })
          .catch(() => {
            inFlightCountRef.current = Math.max(0, inFlightCountRef.current - 1);
            isPendingMapRef.current[index] = false;
            return null;
          });
      }

      return new Promise((resolve) => {
        const img = new Image();
        img.decoding = "async";
        img.src = url;

        const done = (ok: boolean) => {
          inFlightCountRef.current = Math.max(0, inFlightCountRef.current - 1);
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
      const lookAhead = isMobileRef.current ? 5 : 8;

      for (let i = 1; i <= lookAhead; i++) {
        const idx = centerFrame + i * sign;
        if (idx >= 1 && idx <= total && !isLoadedMapRef.current[idx] && !isPendingMapRef.current[idx]) {
          loadImage(idx, false);
        }
      }

      const evictStep = isMobileRef.current ? 24 : 40;
      if (isMobileRef.current && Math.abs(centerFrame - lastEvictCenterRef.current) > evictStep) {
        lastEvictCenterRef.current = centerFrame;
        evictDistantMobileFrames(centerFrame);
      }
    },
    [loadImage, evictDistantMobileFrames]
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
        if (loaded && Math.abs(currentTargetFrameRef.current - targetFrame) <= 2) {
          drawFrameImage(loaded, targetFrame);
        }
      });

      const total = activeTotalRef.current;
      for (let step = 1; step <= 20; step++) {
        const candidate = targetFrame - step * dir;
        if (
          candidate >= 1 &&
          candidate <= total &&
          imagesRef.current[candidate] &&
          isLoadedMapRef.current[candidate] &&
          (lastDrawnFrameRef.current < 1 ||
            (dir > 0 ? candidate >= lastDrawnFrameRef.current : candidate <= lastDrawnFrameRef.current))
        ) {
          drawFrameImage(imagesRef.current[candidate]!, candidate);
          break;
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
        ctxRef.current.imageSmoothingQuality = isMob ? "low" : "high";
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

      const preloadLowerSectionAssets = () => {
        [
          "/images/white-marble.jpg",
          "/images/house-view-1.jpg",
          "/images/house-view-2.jpg",
          "/images/house-view-3.jpg",
          "/images/house-view-4.jpg",
          "/images/house-view-5.jpg",
        ].forEach((src) => {
          const bgImg = new Image();
          bgImg.decoding = "async";
          bgImg.src = src;
        });
      };

      if (!isMob) {
        preloadLowerSectionAssets();
      } else {
        setTimeout(() => {
          if (!isCancelled) preloadLowerSectionAssets();
        }, 2500);
      }

      const seen = new Set<number>([1]);
      const queue: number[] = [];
      const push = (idx: number) => {
        const clamped = Math.min(total, Math.max(1, idx));
        if (!seen.has(clamped)) {
          seen.add(clamped);
          queue.push(clamped);
        }
      };

      const openSlice = isMob ? 24 : Math.min(initialPreloadCount, total);
      for (let i = 1; i <= openSlice; i++) push(i);
      for (let i = 1; i <= total; i += 8) push(i);
      for (let i = 1; i <= total; i += 4) push(i);
      for (let i = 1; i <= total; i += 2) push(i);
      for (let i = 1; i <= total; i += 1) push(i);

      const batchSize = isMob ? 3 : 4;
      const pauseMs = isMob ? 16 : 16;

      for (let i = 0; i < queue.length; i += batchSize) {
        if (isCancelled) return;
        while (isScrollingRef.current && !isCancelled) {
          await new Promise((r) => setTimeout(r, isMob ? 45 : 180));
        }
        if (isCancelled) return;
        await Promise.all(queue.slice(i, i + batchSize).map((idx) => loadImage(idx, false)));
        await new Promise((r) => setTimeout(r, pauseMs));
      }
    };

    runOctavePreload();

    return () => {
      isCancelled = true;
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
      if (!isMobileRef.current && ctxRef.current && ctxRef.current.imageSmoothingQuality !== "low") {
        ctxRef.current.imageSmoothingQuality = "low";
      }
      if (idleTimer) clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        isScrollingRef.current = false;
        if (!isMobileRef.current && ctxRef.current) {
          ctxRef.current.imageSmoothingQuality = "high";
          const settledFrame = lastDrawnFrameRef.current;
          const img = settledFrame > 0 ? imagesRef.current[settledFrame] : null;
          if (img && isLoadedMapRef.current[settledFrame]) {
            drawFrameImage(img, settledFrame);
          }
        }
      }, 200);

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
          <img
            ref={fallbackImgRef}
            src="/frames-opt/frame_0001.webp?v=clean3"
            alt="Avijit Villa"
            fetchPriority="high"
            decoding="sync"
            className="absolute inset-0 z-[2] w-full h-full object-cover pointer-events-none"
          />

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
