"use client";

import React, { useState } from "react";
import {
  DEFAULT_SITE_CONFIG,
  FONT_LABELS,
  type AnimationDirectionMode,
  type AnimationSpeed,
  type ColorThemeConfig,
  type DesignConfig,
  type FontChoice,
  type HeroPlacement,
  type ImageMotionStyle,
  type PageFontChoice,
  type RoomsPlacement,
  type SiteConfig,
  type SitePageId,
  type TextAlignChoice,
} from "@/lib/defaultSiteConfig";
import { AdminSectionCard, FieldInput } from "./AdminHelpers";

const FONT_OPTIONS: { value: FontChoice; label: string }[] = (
  Object.keys(FONT_LABELS) as FontChoice[]
).map((key) => ({ value: key, label: FONT_LABELS[key] }));

const PAGE_FONT_OPTIONS: { value: PageFontChoice; label: string }[] = [
  { value: "inherit", label: "Inherit Global Website Font" },
  ...FONT_OPTIONS,
];

const HERO_PLACEMENTS: { value: HeroPlacement; label: string }[] = [
  { value: "top-left", label: "Top Left (Default)" },
  { value: "bottom-left", label: "Bottom Left" },
  { value: "bottom-right", label: "Bottom Right" },
  { value: "center", label: "Center Stage" },
  { value: "top-right", label: "Top Right" },
  { value: "bottom-center", label: "Bottom Center" },
];

const ROOMS_PLACEMENTS: { value: RoomsPlacement; label: string }[] = [
  {
    value: "desktop-alternating",
    label: "Desktop Bottom (Left ↔ Right) • Mobile Top-Left (Default)",
  },
  { value: "top-left", label: "All Devices: Top Left" },
  { value: "top-right", label: "All Devices: Top Right" },
  { value: "bottom-left", label: "All Devices: Bottom Left" },
  { value: "bottom-right", label: "All Devices: Bottom Right" },
  { value: "per-room", label: "Use Individual Room Position" },
];

const ALIGN_OPTIONS: TextAlignChoice[] = ["left", "center", "right"];

const PAGE_DESCRIPTIONS: Record<SitePageId, string> = {
  residence: "3D Scroll Architectural Walkthrough & Opening Hero",
  materiality: "Monograph, Stone Plates & House Views Gallery",
  masterplan: "Peninsula Grounds, Wings Blueprint & Eco Stats",
  contact: "Private Advisory, Direct Email Form & Location",
};

const COLOR_PRESETS: { name: string; swatch: string; colors: ColorThemeConfig }[] = [
  {
    name: "Champagne Gold (Original)",
    swatch: "#8b6914",
    colors: DEFAULT_SITE_CONFIG.design.colors,
  },
  {
    name: "Royal Emerald",
    swatch: "#0f766e",
    colors: {
      accentColor: "#0f766e",
      headingColor: "#0f2421",
      bodyColor: "#334e49",
      mutedColor: "#5b7570",
      heroTitleColor: "#6ee7b7",
      heroTextColor: "#ecfdf5",
      roomTitleColor: "#6ee7b7",
      roomTextColor: "#f0fdfa",
    },
  },
  {
    name: "Midnight Sapphire",
    swatch: "#1d4ed8",
    colors: {
      accentColor: "#1e40af",
      headingColor: "#0f172a",
      bodyColor: "#334155",
      mutedColor: "#64748b",
      heroTitleColor: "#93c5fd",
      heroTextColor: "#eff6ff",
      roomTitleColor: "#93c5fd",
      roomTextColor: "#f8fafc",
    },
  },
  {
    name: "Rose Bronze",
    swatch: "#9f3a4a",
    colors: {
      accentColor: "#9f3a4a",
      headingColor: "#261216",
      bodyColor: "#523239",
      mutedColor: "#7a585f",
      heroTitleColor: "#fda4af",
      heroTextColor: "#fff1f2",
      roomTitleColor: "#fda4af",
      roomTextColor: "#fff5f6",
    },
  },
  {
    name: "Obsidian Espresso",
    swatch: "#3f2e1e",
    colors: {
      accentColor: "#78350f",
      headingColor: "#14110f",
      bodyColor: "#3f3832",
      mutedColor: "#6b6259",
      heroTitleColor: "#fcd34d",
      heroTextColor: "#fefce8",
      roomTitleColor: "#fcd34d",
      roomTextColor: "#fef9c3",
    },
  },
];

type SubTab = "colors" | "fonts" | "pages" | "animations";

function ColorPickerField({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint: string;
  value: string;
  onChange: (hex: string) => void;
}) {
  return (
    <div className="p-3.5 rounded-xl bg-[#fcf9f2] border border-[#e5d5aa] flex flex-col gap-2">
      <div>
        <div className="text-[11px] uppercase tracking-wider font-bold text-[#8b6914]">
          {label}
        </div>
        <div className="text-[11px] text-[#6e6454]">{hint}</div>
      </div>
      <div className="flex items-center gap-2.5">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-10 h-10 rounded-lg border border-[#dcc484] bg-white cursor-pointer p-0.5 shrink-0"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 px-3 py-2 rounded-lg bg-white border border-[#dcc484] text-xs font-semibold text-[#1c1812]"
        />
      </div>
    </div>
  );
}

export function DesignAndLayoutEditor({
  draft,
  setDraft,
}: {
  draft: SiteConfig;
  setDraft: React.Dispatch<React.SetStateAction<SiteConfig>>;
}) {
  const [subTab, setSubTab] = useState<SubTab>("colors");
  const design = draft.design;
  const colors = design.colors ?? DEFAULT_SITE_CONFIG.design.colors;
  const anim = design.animation ?? DEFAULT_SITE_CONFIG.design.animation;

  const updateDesign = (patch: Partial<DesignConfig>) =>
    setDraft((prev) => ({
      ...prev,
      design: { ...prev.design, ...patch },
    }));

  const updateColors = (patch: Partial<ColorThemeConfig>) =>
    updateDesign({ colors: { ...colors, ...patch } });

  const updateAnim = (patch: Partial<typeof anim>) =>
    updateDesign({ animation: { ...anim, ...patch } });

  const getPageLabel = (id: SitePageId): string => {
    if (id === "residence") return draft.brand.navResidenceLabel;
    if (id === "materiality") return draft.brand.navMaterialityLabel;
    if (id === "masterplan") return draft.brand.navMasterplanLabel;
    return draft.brand.navContactLabel;
  };

  const setPageLabel = (id: SitePageId, label: string) =>
    setDraft((prev) => ({
      ...prev,
      brand: {
        ...prev.brand,
        ...(id === "residence" ? { navResidenceLabel: label } : {}),
        ...(id === "materiality" ? { navMaterialityLabel: label } : {}),
        ...(id === "masterplan" ? { navMasterplanLabel: label } : {}),
        ...(id === "contact" ? { navContactLabel: label } : {}),
      },
    }));

  const movePage = (index: number, direction: -1 | 1) => {
    const nextOrder = [...design.pageOrder];
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= nextOrder.length) return;
    const temp = nextOrder[index];
    nextOrder[index] = nextOrder[targetIndex];
    nextOrder[targetIndex] = temp;
    updateDesign({ pageOrder: nextOrder });
  };

  return (
    <div className="space-y-6">
      {/* Clean Sub-Tab Selector Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-2 rounded-2xl bg-white/88 backdrop-blur-xl border border-[#c9a84c]/55 shadow-md">
        {(
          [
            { id: "colors", label: "1. Text Colors" },
            { id: "fonts", label: "2. Fonts & Align" },
            { id: "pages", label: "3. Pages & Order" },
            { id: "animations", label: "4. Animations & 3D" },
          ] as { id: SubTab; label: string }[]
        ).map((t) => {
          const active = subTab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setSubTab(t.id)}
              className={`py-2.5 px-3 rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer transition-all ${
                active
                  ? "bg-[#15120d] text-[#f2ca50] shadow-md border border-[#d4af37]"
                  : "bg-[#faf6ed] text-[#4a4236] hover:bg-[#f2e7cf] border border-transparent"
              }`}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {/* SUB-TAB 1: WEBSITE TEXT COLORS */}
      {subTab === "colors" && (
        <div className="space-y-6">
          <AdminSectionCard
            title="1-Click Website Color Themes"
            subtitle="Pick a ready-made luxury color palette, or customize every individual color below."
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
              {COLOR_PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => updateColors(preset.colors)}
                  className="flex items-center gap-2.5 p-3 rounded-xl bg-[#fcf9f2] hover:bg-white border border-[#dcc484] hover:border-[#8b6914] text-left cursor-pointer transition-all"
                >
                  <span
                    className="w-6 h-6 rounded-full shrink-0 border border-black/15 shadow-sm"
                    style={{ backgroundColor: preset.swatch }}
                  />
                  <span className="text-xs font-bold text-[#1c1812] leading-tight">
                    {preset.name}
                  </span>
                </button>
              ))}
            </div>
          </AdminSectionCard>

          <AdminSectionCard
            title="Custom Text Colors Across All Sections"
            subtitle="Choose any color for headings, body text, accents, hero banner, and 3D room cards."
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3.5">
              <ColorPickerField
                label="Accent & Highlights"
                hint="Kickers, badges, architect name, phone/email highlights"
                value={colors.accentColor}
                onChange={(v) => updateColors({ accentColor: v })}
              />
              <ColorPickerField
                label="Main Headings"
                hint="Titles in Materiality, Masterplan & Contact"
                value={colors.headingColor}
                onChange={(v) => updateColors({ headingColor: v })}
              />
              <ColorPickerField
                label="Body & Descriptions"
                hint="Paragraphs, intro quotes & details"
                value={colors.bodyColor}
                onChange={(v) => updateColors({ bodyColor: v })}
              />
              <ColorPickerField
                label="Muted Labels"
                hint="Sub-captions & small stat labels"
                value={colors.mutedColor}
                onChange={(v) => updateColors({ mutedColor: v })}
              />
              <ColorPickerField
                label="Hero Headline Color"
                hint="Top 3D opening title accent color"
                value={colors.heroTitleColor}
                onChange={(v) => updateColors({ heroTitleColor: v })}
              />
              <ColorPickerField
                label="Hero Quote Color"
                hint="Poetic quote under Hero title"
                value={colors.heroTextColor}
                onChange={(v) => updateColors({ heroTextColor: v })}
              />
              <ColorPickerField
                label="3D Room Title Color"
                hint="Titles inside floating 3D room cards"
                value={colors.roomTitleColor}
                onChange={(v) => updateColors({ roomTitleColor: v })}
              />
              <ColorPickerField
                label="3D Room Body Color"
                hint="Descriptions inside 3D room cards"
                value={colors.roomTextColor}
                onChange={(v) => updateColors({ roomTextColor: v })}
              />
            </div>

            {/* Live Color Mini-Preview */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-xl bg-[#faf6ed] border border-[#dcc484] space-y-1">
                <div className="text-[10px] uppercase tracking-widest font-bold" style={{ color: colors.accentColor }}>
                  LIVE BRIGHT SECTION PREVIEW
                </div>
                <div className="text-xl font-bold" style={{ color: colors.headingColor }}>
                  Architectural Sanctuary Heading
                </div>
                <p className="text-xs leading-relaxed" style={{ color: colors.bodyColor }}>
                  Harmonious marble volumes and luminous natural gardens.
                </p>
                <div className="text-[10px]" style={{ color: colors.mutedColor }}>
                  Muted label &bull; Specification tag
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#110f0c] border border-[#c9a84c]/40 space-y-1">
                <div className="text-[10px] uppercase tracking-widest font-bold text-amber-300">
                  LIVE 3D HERO &amp; ROOM PREVIEW
                </div>
                <div className="text-xl font-bold" style={{ color: colors.heroTitleColor }}>
                  Welcome To Avijit&apos;s Property
                </div>
                <p className="text-xs italic leading-relaxed" style={{ color: colors.heroTextColor }}>
                  &ldquo;Sculpted from stone, silence, and sunrise.&rdquo;
                </p>
                <div className="text-[11px] font-semibold" style={{ color: colors.roomTitleColor }}>
                  Room Card: <span style={{ color: colors.roomTextColor }}>The Grand Entrance</span>
                </div>
              </div>
            </div>
          </AdminSectionCard>
        </div>
      )}

      {/* SUB-TAB 2: GLOBAL FONTS & TEXT POSITION */}
      {subTab === "fonts" && (
        <div className="space-y-6">
          <AdminSectionCard
            title="Global Website Font Styles"
            subtitle="Set the default font family used across the entire live website."
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <label className="flex flex-col gap-1.5">
                <span className="text-[11px] uppercase tracking-[0.14em] font-bold text-[#8b6914]">
                  Brand &amp; Hero Display Font
                </span>
                <select
                  value={design.displayFont}
                  onChange={(e) =>
                    updateDesign({ displayFont: e.target.value as FontChoice })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#faf6ed] border border-[#dcc484] text-sm text-[#1c1812]"
                >
                  {FONT_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-[11px] uppercase tracking-[0.14em] font-bold text-[#8b6914]">
                  Section Headings Font
                </span>
                <select
                  value={design.headingFont}
                  onChange={(e) =>
                    updateDesign({ headingFont: e.target.value as FontChoice })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#faf6ed] border border-[#dcc484] text-sm text-[#1c1812]"
                >
                  {FONT_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-[11px] uppercase tracking-[0.14em] font-bold text-[#8b6914]">
                  Descriptions &amp; Body Font
                </span>
                <select
                  value={design.bodyFont}
                  onChange={(e) =>
                    updateDesign({ bodyFont: e.target.value as FontChoice })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#faf6ed] border border-[#dcc484] text-sm text-[#1c1812]"
                >
                  {FONT_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </AdminSectionCard>

          <AdminSectionCard
            title="Hero & 3D Room Script Position Controls"
            subtitle="Choose where the opening Hero headline and the 3D Room Scripts (Entrance, Kitchen, Bedroom, Bathroom, Garden) sit on screen."
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="flex flex-col gap-1.5">
                <span className="text-[11px] uppercase tracking-[0.14em] font-bold text-[#8b6914]">
                  Hero Headline Placement
                </span>
                <select
                  value={design.heroPlacement}
                  onChange={(e) =>
                    updateDesign({ heroPlacement: e.target.value as HeroPlacement })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#faf6ed] border border-[#dcc484] text-sm text-[#1c1812]"
                >
                  {HERO_PLACEMENTS.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-[11px] uppercase tracking-[0.14em] font-bold text-[#8b6914]">
                  3D Room Script Screen Position
                </span>
                <select
                  value={design.roomsPlacement ?? "desktop-alternating"}
                  onChange={(e) =>
                    updateDesign({ roomsPlacement: e.target.value as RoomsPlacement })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#faf6ed] border border-[#dcc484] text-sm text-[#1c1812]"
                >
                  {ROOMS_PLACEMENTS.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </label>

              <div className="flex flex-col gap-1.5">
                <span className="text-[11px] uppercase tracking-[0.14em] font-bold text-[#8b6914]">
                  Hero Text Alignment
                </span>
                <div className="grid grid-cols-3 gap-1.5 bg-[#faf6ed] p-1 rounded-xl border border-[#dcc484]">
                  {ALIGN_OPTIONS.map((al) => (
                    <button
                      key={al}
                      type="button"
                      onClick={() => updateDesign({ heroTextAlign: al })}
                      className={`py-2 rounded-lg text-xs font-bold uppercase cursor-pointer ${
                        design.heroTextAlign === al
                          ? "bg-[#15120d] text-[#f2ca50]"
                          : "text-[#574e40] hover:bg-white"
                      }`}
                    >
                      {al}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="text-[11px] uppercase tracking-[0.14em] font-bold text-[#8b6914]">
                  3D Room Script Text Align
                </span>
                <div className="grid grid-cols-3 gap-1.5 bg-[#faf6ed] p-1 rounded-xl border border-[#dcc484]">
                  {ALIGN_OPTIONS.map((al) => (
                    <button
                      key={al}
                      type="button"
                      onClick={() => updateDesign({ roomsTextAlign: al })}
                      className={`py-2 rounded-lg text-xs font-bold uppercase cursor-pointer ${
                        design.roomsTextAlign === al
                          ? "bg-[#15120d] text-[#f2ca50]"
                          : "text-[#574e40] hover:bg-white"
                      }`}
                    >
                      {al}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <label className="flex flex-col gap-1">
                <div className="flex justify-between text-xs font-bold text-[#8b6914]">
                  <span>Hero Fine Horizontal Position (X)</span>
                  <span>{design.heroOffsetX} px</span>
                </div>
                <input
                  type="range"
                  min={-120}
                  max={120}
                  value={design.heroOffsetX}
                  onChange={(e) => updateDesign({ heroOffsetX: Number(e.target.value) })}
                  className="accent-[#8b6914]"
                />
              </label>

              <label className="flex flex-col gap-1">
                <div className="flex justify-between text-xs font-bold text-[#8b6914]">
                  <span>Hero Fine Vertical Position (Y)</span>
                  <span>{design.heroOffsetY} px</span>
                </div>
                <input
                  type="range"
                  min={-120}
                  max={120}
                  value={design.heroOffsetY}
                  onChange={(e) => updateDesign({ heroOffsetY: Number(e.target.value) })}
                  className="accent-[#8b6914]"
                />
              </label>
            </div>
          </AdminSectionCard>
        </div>
      )}

      {/* SUB-TAB 3: PAGES NAME, URL PATH, FONT & POSITION ORDER */}
      {subTab === "pages" && (
        <div className="space-y-6">
          <AdminSectionCard
            title="Browser Address Bar URL Sync"
            subtitle="Automatically updates your website address bar as visitors scroll from page to page (e.g. /The-Residence → /The-Residence/Materiality)."
          >
            <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-[#fcf9f2] border border-[#e5d5aa]">
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-[#8b6914]">
                  Dynamic Page URL in Address Bar
                </div>
                <div className="text-[11px] text-[#574e40] mt-0.5">
                  Updates browser URL live when visiting or scrolling into each page
                </div>
              </div>
              <button
                type="button"
                onClick={() =>
                  updateDesign({ dynamicUrlSync: !(design.dynamicUrlSync ?? true) })
                }
                className={`px-4 py-2 rounded-xl text-xs font-bold uppercase cursor-pointer transition-colors ${
                  design.dynamicUrlSync ?? true
                    ? "bg-[#15120d] text-[#f2ca50] border border-[#d4af37]"
                    : "bg-stone-200 text-stone-700"
                }`}
              >
                {(design.dynamicUrlSync ?? true) ? "ON" : "OFF"}
              </button>
            </div>
          </AdminSectionCard>

          <AdminSectionCard
            title="Pages Manager: Name, Address Bar URL, Font Style, Alignment & Order"
            subtitle="Click Move Up / Move Down to change page order, customize the browser address bar path, rename any page, or set per-page fonts and alignment."
          >
            <div className="space-y-4">
              {design.pageOrder.map((pageId, idx) => {
                const pageMeta = design.pages[pageId];
                return (
                  <div
                    key={pageId}
                    className="p-4 rounded-xl bg-[#fcf9f2] border border-[#dcc484]/80 space-y-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#efe3c4] pb-2.5">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded bg-[#15120d] text-[#f2ca50] text-[10px] font-bold uppercase tracking-wider">
                            Position #{idx + 1}
                          </span>
                          <span className="text-sm font-bold text-[#1c1812] uppercase tracking-wide">
                            {pageId}
                          </span>
                        </div>
                        <p className="text-xs text-[#6e6454] mt-0.5">
                          {PAGE_DESCRIPTIONS[pageId]}
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => movePage(idx, -1)}
                          className="px-3 py-1.5 rounded-lg border border-[#c9a84c] bg-white hover:bg-[#faf6ed] text-xs font-bold text-[#8b6914] disabled:opacity-40 cursor-pointer"
                        >
                          ↑ Move Up
                        </button>
                        <button
                          type="button"
                          disabled={idx === design.pageOrder.length - 1}
                          onClick={() => movePage(idx, 1)}
                          className="px-3 py-1.5 rounded-lg border border-[#c9a84c] bg-white hover:bg-[#faf6ed] text-xs font-bold text-[#8b6914] disabled:opacity-40 cursor-pointer"
                        >
                          ↓ Move Down
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
                      <FieldInput
                        label="Page Name (Navbar)"
                        value={getPageLabel(pageId)}
                        onChange={(v) => setPageLabel(pageId, v)}
                      />

                      <FieldInput
                        label="Address Bar URL Path"
                        value={pageMeta?.urlPath ?? `/${pageId}`}
                        onChange={(v) =>
                          updateDesign({
                            pages: {
                              ...design.pages,
                              [pageId]: {
                                ...pageMeta,
                                id: pageId,
                                urlPath: v,
                              },
                            },
                          })
                        }
                        placeholder="/The-Residence"
                      />

                      <label className="flex flex-col gap-1.5">
                        <span className="text-[11px] uppercase tracking-[0.14em] font-bold text-[#8b6914]">
                          Page Font Style
                        </span>
                        <select
                          value={pageMeta?.pageFont ?? "inherit"}
                          onChange={(e) =>
                            updateDesign({
                              pages: {
                                ...design.pages,
                                [pageId]: {
                                  ...pageMeta,
                                  id: pageId,
                                  pageFont: e.target.value as PageFontChoice,
                                },
                              },
                            })
                          }
                          className="w-full px-3.5 py-2.5 rounded-xl bg-[#faf6ed] border border-[#dcc484] text-sm text-[#1c1812]"
                        >
                          {PAGE_FONT_OPTIONS.map((o) => (
                            <option key={o.value} value={o.value}>
                              {o.label}
                            </option>
                          ))}
                        </select>
                      </label>

                      <div className="flex flex-col gap-1.5">
                        <span className="text-[11px] uppercase tracking-[0.14em] font-bold text-[#8b6914]">
                          Page Text Alignment
                        </span>
                        <div className="grid grid-cols-3 gap-1.5 bg-[#faf6ed] p-1 rounded-xl border border-[#dcc484]">
                          {ALIGN_OPTIONS.map((al) => {
                            const active = (pageMeta?.textAlign ?? "left") === al;
                            return (
                              <button
                                key={al}
                                type="button"
                                onClick={() =>
                                  updateDesign({
                                    pages: {
                                      ...design.pages,
                                      [pageId]: {
                                        ...pageMeta,
                                        id: pageId,
                                        textAlign: al,
                                      },
                                    },
                                  })
                                }
                                className={`py-1.5 rounded-lg text-xs font-bold uppercase cursor-pointer transition-colors ${
                                  active
                                    ? "bg-[#15120d] text-[#f2ca50]"
                                    : "text-[#574e40] hover:bg-white"
                                }`}
                              >
                                {al}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </AdminSectionCard>
        </div>
      )}

      {/* SUB-TAB 4: FULL WEBSITE ANIMATION & 3D CONTROLS */}
      {subTab === "animations" && (
        <div className="space-y-6">
          <AdminSectionCard
            title="Scroll Reveal & Section Animations"
            subtitle="Control whether scroll reveal animations play across the website, how fast they animate, and their entrance direction."
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-[#fcf9f2] border border-[#e5d5aa] flex items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-[#8b6914]">
                    Scroll Animations
                  </div>
                  <div className="text-[11px] text-[#6e6454] mt-0.5">
                    Enable/disable text &amp; card reveal motion
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => updateAnim({ enabled: !anim.enabled })}
                  className={`px-4 py-2 rounded-xl text-xs font-bold uppercase cursor-pointer transition-colors ${
                    anim.enabled
                      ? "bg-[#15120d] text-[#f2ca50] border border-[#d4af37]"
                      : "bg-stone-200 text-stone-700"
                  }`}
                >
                  {anim.enabled ? "ON" : "OFF"}
                </button>
              </div>

              <label className="flex flex-col gap-1.5 p-4 rounded-xl bg-[#fcf9f2] border border-[#e5d5aa]">
                <span className="text-[11px] uppercase tracking-wider font-bold text-[#8b6914]">
                  Animation Speed
                </span>
                <select
                  value={anim.speed}
                  onChange={(e) => updateAnim({ speed: e.target.value as AnimationSpeed })}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-[#dcc484] text-xs font-semibold text-[#1c1812]"
                >
                  <option value="slow">Slow &amp; Smooth Cinematic</option>
                  <option value="normal">Balanced Luxury (Default)</option>
                  <option value="fast">Fast &amp; Snappy</option>
                </select>
              </label>

              <label className="flex flex-col gap-1.5 p-4 rounded-xl bg-[#fcf9f2] border border-[#e5d5aa]">
                <span className="text-[11px] uppercase tracking-wider font-bold text-[#8b6914]">
                  Reveal Direction Style
                </span>
                <select
                  value={anim.directionMode}
                  onChange={(e) =>
                    updateAnim({
                      directionMode: e.target.value as AnimationDirectionMode,
                    })
                  }
                  className="w-full px-3 py-2 rounded-lg bg-white border border-[#dcc484] text-xs font-semibold text-[#1c1812]"
                >
                  <option value="default">Custom Per-Section (Default)</option>
                  <option value="bottom-to-top">Always Bottom → Top</option>
                  <option value="left-to-right">Always Left → Right</option>
                  <option value="right-to-left">Always Right → Left</option>
                  <option value="zoom-in">Smooth Zoom-In Fade</option>
                </select>
              </label>
            </div>
          </AdminSectionCard>

          <AdminSectionCard
            title="3D Floating Objects & Default Image Motion"
            subtitle="Customize the 3D golden geometric sculptures floating on the marble background and the default 3D effect for all website images."
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-[#fcf9f2] border border-[#e5d5aa] flex items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-[#8b6914]">
                    3D Golden Objects
                  </div>
                  <div className="text-[11px] text-[#6e6454] mt-0.5">
                    Show spinning 3D sculptures on marble background
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => updateAnim({ enable3dObjects: !anim.enable3dObjects })}
                  className={`px-4 py-2 rounded-xl text-xs font-bold uppercase cursor-pointer transition-colors ${
                    anim.enable3dObjects
                      ? "bg-[#15120d] text-[#f2ca50] border border-[#d4af37]"
                      : "bg-stone-200 text-stone-700"
                  }`}
                >
                  {anim.enable3dObjects ? "ON" : "OFF"}
                </button>
              </div>

              <label className="flex flex-col gap-1.5 p-4 rounded-xl bg-[#fcf9f2] border border-[#e5d5aa]">
                <span className="text-[11px] uppercase tracking-wider font-bold text-[#8b6914]">
                  3D Objects Rotation Speed
                </span>
                <select
                  value={anim.objectsSpeed}
                  onChange={(e) =>
                    updateAnim({ objectsSpeed: e.target.value as AnimationSpeed })
                  }
                  className="w-full px-3 py-2 rounded-lg bg-white border border-[#dcc484] text-xs font-semibold text-[#1c1812]"
                >
                  <option value="slow">Gentle Orbit (Slow)</option>
                  <option value="normal">Standard 3D Spin</option>
                  <option value="fast">Dynamic Fast Spin</option>
                </select>
              </label>

              <label className="flex flex-col gap-1.5 p-4 rounded-xl bg-[#fcf9f2] border border-[#e5d5aa]">
                <span className="text-[11px] uppercase tracking-wider font-bold text-[#8b6914]">
                  Default All-Images 3D Effect
                </span>
                <select
                  value={anim.defaultImageHover}
                  onChange={(e) =>
                    updateAnim({
                      defaultImageHover: e.target.value as Exclude<
                        ImageMotionStyle,
                        "inherit"
                      >,
                    })
                  }
                  className="w-full px-3 py-2 rounded-lg bg-white border border-[#dcc484] text-xs font-semibold text-[#1c1812]"
                >
                  <option value="hover-zoom">Smooth Luxury Zoom</option>
                  <option value="3d-tilt">Interactive 3D Mouse Tilt</option>
                  <option value="float-3d">Floating 3D Levitation</option>
                  <option value="pulse-glow">Golden Halo Pulse</option>
                  <option value="none">Static (No Hover Effect)</option>
                </select>
              </label>
            </div>
          </AdminSectionCard>
        </div>
      )}
    </div>
  );
}
