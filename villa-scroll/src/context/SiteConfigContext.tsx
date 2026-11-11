"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
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

export function SiteConfigProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<SiteConfig>(DEFAULT_SITE_CONFIG);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  const refreshConfig = useCallback(async () => {
    try {
      const res = await fetch("/api/site-config", { cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        if (json?.ok && json?.config) {
          setConfig(json.config);
          if (typeof document !== "undefined" && json.config?.brand?.siteTitle) {
            document.title = json.config.brand.siteTitle;
          }
        }
      }
    } catch {
      // Keep current/default config gracefully
    } finally {
      setIsLoaded(true);
    }
  }, []);

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
    refreshConfig();

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        refreshConfig();
      }
    };
    window.addEventListener("focus", refreshConfig);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      window.removeEventListener("focus", refreshConfig);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [refreshConfig]);

  return (
    <SiteConfigContext.Provider value={{ config, isLoaded, setConfig, refreshConfig }}>
      {children}
    </SiteConfigContext.Provider>
  );
}

export function useSiteConfig() {
  return useContext(SiteConfigContext);
}

