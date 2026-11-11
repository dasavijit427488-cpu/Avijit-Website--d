"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  DEFAULT_SITE_CONFIG,
  FONT_STACKS,
  type SiteConfig,
} from "@/lib/defaultSiteConfig";

interface SiteConfigContextValue {
  config: SiteConfig;
  isLoaded: boolean;
  setConfig: React.Dispatch<React.SetStateAction<SiteConfig>>;
  refreshConfig: () => Promise<void>;
}

const SiteConfigContext = createContext<SiteConfigContextValue>({
  config: DEFAULT_SITE_CONFIG,
  isLoaded: false,
  setConfig: () => {},
  refreshConfig: async () => {},
});

const DEFAULT_CONFIG_JSON = JSON.stringify(DEFAULT_SITE_CONFIG);
export const PREVIEW_STORAGE_KEY = "villa_serverless_preview_config";
export const LIVE_CACHE_STORAGE_KEY = "villa_cached_live_config";
export const CONFIG_CHANNEL_NAME = "villa_config_sync";

export function SiteConfigProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<SiteConfig>(DEFAULT_SITE_CONFIG);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const lastConfigJsonRef = useRef<string>(DEFAULT_CONFIG_JSON);

  const applyConfigIfChanged = useCallback((nextCfg: SiteConfig) => {
    const nextSerialized = JSON.stringify(nextCfg);
    if (nextSerialized !== lastConfigJsonRef.current) {
      lastConfigJsonRef.current = nextSerialized;
      setConfig(nextCfg);
      if (typeof document !== "undefined" && nextCfg?.brand?.siteTitle) {
        document.title = nextCfg.brand.siteTitle;
      }
    }
  }, []);

  const refreshConfig = useCallback(async () => {
    try {
      const res = await fetch("/api/site-config", { cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        if (json?.ok && json?.config) {
          if (json.cloudSynced) {
            try {
              localStorage.removeItem(PREVIEW_STORAGE_KEY);
              localStorage.setItem(LIVE_CACHE_STORAGE_KEY, JSON.stringify(json.config));
            } catch {
              // Ignore storage restrictions
            }
            applyConfigIfChanged(json.config);
            return;
          }

          // Ephemeral serverless without Cloud KV yet: check same-browser published draft fallback
          let appliedLocal = false;
          try {
            const rawLocal = localStorage.getItem(PREVIEW_STORAGE_KEY);
            if (rawLocal) {
              const parsedLocal = JSON.parse(rawLocal) as SiteConfig;
              if (parsedLocal?.brand && parsedLocal?.hero) {
                applyConfigIfChanged(parsedLocal);
                appliedLocal = true;
              }
            }
          } catch {
            // Ignore malformed storage
          }

          if (!appliedLocal) {
            applyConfigIfChanged(json.config);
          }
        }
      }
    } catch {
      // Keep current/default config gracefully
    } finally {
      setIsLoaded(true);
    }
  }, [applyConfigIfChanged]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const design = config.design ?? DEFAULT_SITE_CONFIG.design;
    const root = document.documentElement.style;
    root.setProperty(
      "--active-display-font",
      FONT_STACKS[design.displayFont] ?? FONT_STACKS.cinzel
    );
    root.setProperty(
      "--active-heading-font",
      FONT_STACKS[design.headingFont] ?? FONT_STACKS.playfair
    );
    root.setProperty(
      "--active-body-font",
      FONT_STACKS[design.bodyFont] ?? FONT_STACKS.playfair
    );

    const colors = design.colors ?? DEFAULT_SITE_CONFIG.design.colors;
    root.setProperty("--site-accent", colors.accentColor);
    root.setProperty("--site-heading", colors.headingColor);
    root.setProperty("--site-body", colors.bodyColor);
    root.setProperty("--site-muted", colors.mutedColor);
    root.setProperty("--site-hero-title", colors.heroTitleColor);
    root.setProperty("--site-hero-text", colors.heroTextColor);
    root.setProperty("--site-room-title", colors.roomTitleColor);
    root.setProperty("--site-room-text", colors.roomTextColor);
  }, [config.design]);

  useEffect(() => {
    try {
      const cachedRaw =
        localStorage.getItem(PREVIEW_STORAGE_KEY) ||
        localStorage.getItem(LIVE_CACHE_STORAGE_KEY);
      if (cachedRaw) {
        const parsed = JSON.parse(cachedRaw) as SiteConfig;
        if (parsed?.brand && parsed?.hero) {
          applyConfigIfChanged(parsed);
        }
      }
    } catch {
      // Ignore storage restrictions
    }

    const initTimer = setTimeout(() => {
      void refreshConfig();
    }, 0);

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        void refreshConfig();
      }
    };
    window.addEventListener("focus", refreshConfig);
    document.addEventListener("visibilitychange", handleVisibility);

    let channel: BroadcastChannel | null = null;
    if (typeof BroadcastChannel !== "undefined") {
      channel = new BroadcastChannel(CONFIG_CHANNEL_NAME);
      channel.onmessage = (ev) => {
        if (ev?.data?.config) {
          applyConfigIfChanged(ev.data.config);
        }
      };
    }

    return () => {
      clearTimeout(initTimer);
      window.removeEventListener("focus", refreshConfig);
      document.removeEventListener("visibilitychange", handleVisibility);
      if (channel) channel.close();
    };
  }, [refreshConfig, applyConfigIfChanged]);

  return (
    <SiteConfigContext.Provider value={{ config, isLoaded, setConfig, refreshConfig }}>
      {children}
    </SiteConfigContext.Provider>
  );
}

export function useSiteConfig() {
  return useContext(SiteConfigContext);
}

