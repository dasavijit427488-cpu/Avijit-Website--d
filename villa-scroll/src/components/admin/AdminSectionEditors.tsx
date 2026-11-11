"use client";

import React from "react";
import type { ImageFraming, LevelKey, RoomPosition, SiteConfig } from "@/lib/defaultSiteConfig";
import {
  AdminSectionCard,
  FieldInput,
  ImagePickerField,
  type MediaAssetItem,
} from "./AdminHelpers";

interface EditorSharedProps {
  draft: SiteConfig;
  setDraft: React.Dispatch<React.SetStateAction<SiteConfig>>;
  mediaAssets: MediaAssetItem[];
  onMediaUploaded: (asset: MediaAssetItem) => void;
}

function slotHelpers(
  draft: SiteConfig,
  setDraft: React.Dispatch<React.SetStateAction<SiteConfig>>
) {
  const getFraming = (key: string): ImageFraming =>
    draft.design?.imageFraming?.[key] ?? { posX: 50, posY: 50, zoom: 100 };

  const setFraming = (key: string, next: ImageFraming) =>
    setDraft((prev) => ({
      ...prev,
      design: {
        ...prev.design,
        imageFraming: {
          ...prev.design?.imageFraming,
          [key]: next,
        },
      },
    }));

  return { getFraming, setFraming };
}

export function BrandEditor({
  draft,
  setDraft,
  mediaAssets,
  onMediaUploaded,
}: EditorSharedProps) {
  const b = draft.brand;
  const { getFraming, setFraming } = slotHelpers(draft, setDraft);
  const updateBrand = (patch: Partial<SiteConfig["brand"]>) =>
    setDraft((prev) => ({ ...prev, brand: { ...prev.brand, ...patch } }));

  return (
    <div className="space-y-6">
      <AdminSectionCard
        title="Website Identity & Browser SEO"
        subtitle="Customize the browser tab title, header monogram, and logo portrait."
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FieldInput
            label="Browser Tab Title"
            value={b.siteTitle}
            onChange={(v) => updateBrand({ siteTitle: v })}
          />
          <FieldInput
            label="Footer Copyright Text"
            value={b.copyrightText}
            onChange={(v) => updateBrand({ copyrightText: v })}
          />
        </div>

        <ImagePickerField
          label="Header Circular Logo / DP Photo"
          value={b.headerLogoUrl}
          onChange={(v) => updateBrand({ headerLogoUrl: v })}
          mediaAssets={mediaAssets}
          onUploaded={onMediaUploaded}
          framing={getFraming("brand.headerLogo")}
          onFramingChange={(f) => setFraming("brand.headerLogo", f)}
        />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <FieldInput
            label="Brand First Letter (Gold)"
            value={b.brandFirstLetter}
            onChange={(v) => updateBrand({ brandFirstLetter: v })}
          />
          <FieldInput
            label="Brand Middle Word"
            value={b.brandMiddleText}
            onChange={(v) => updateBrand({ brandMiddleText: v })}
          />
          <FieldInput
            label="Brand Accent Word"
            value={b.brandLastWord}
            onChange={(v) => updateBrand({ brandLastWord: v })}
          />
        </div>
      </AdminSectionCard>

      <AdminSectionCard
        title="Top Navigation Bar Labels"
        subtitle="Rename the 4 top navigation menu links."
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <FieldInput
            label="Link 1 (3D Canvas)"
            value={b.navResidenceLabel}
            onChange={(v) => updateBrand({ navResidenceLabel: v })}
          />
          <FieldInput
            label="Link 2 (Materiality)"
            value={b.navMaterialityLabel}
            onChange={(v) => updateBrand({ navMaterialityLabel: v })}
          />
          <FieldInput
            label="Link 3 (Masterplan)"
            value={b.navMasterplanLabel}
            onChange={(v) => updateBrand({ navMasterplanLabel: v })}
          />
          <FieldInput
            label="Link 4 (Contact)"
            value={b.navContactLabel}
            onChange={(v) => updateBrand({ navContactLabel: v })}
          />
        </div>
      </AdminSectionCard>
    </div>
  );
}

export function HeroAndRoomsEditor({ draft, setDraft }: EditorSharedProps) {
  const h = draft.hero;
  const updateHero = (patch: Partial<SiteConfig["hero"]>) =>
    setDraft((prev) => ({ ...prev, hero: { ...prev.hero, ...patch } }));

  const updateRoom = (idx: number, patch: Partial<SiteConfig["rooms"][number]>) =>
    setDraft((prev) => {
      const next = [...prev.rooms];
      next[idx] = { ...next[idx], ...patch };
      return { ...prev, rooms: next };
    });

  const addRoom = () =>
    setDraft((prev) => ({
      ...prev,
      rooms: [
        ...prev.rooms,
        {
          id: `room-${Date.now()}`,
          tag: "NEW SPACE",
          subtitle: "Curated Space",
          title: "New Architectural Room",
          description: "Describe the lighting, stone textures, and atmosphere of this room.",
          specs: "Custom Specifications",
          position: "top-left",
          enterStart: 0.1,
          enterEnd: 0.15,
          exitStart: 0.2,
          exitEnd: 0.25,
        },
      ],
    }));

  const removeRoom = (idx: number) =>
    setDraft((prev) => ({
      ...prev,
      rooms: prev.rooms.filter((_, i) => i !== idx),
    }));

  return (
    <div className="space-y-6">
      <AdminSectionCard
        title="Hero Opening Headline & Tagline"
        subtitle="Displayed over the opening frame when visitors load the website."
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FieldInput
            label="Top Pill Badge"
            value={h.badgeText}
            onChange={(v) => updateHero({ badgeText: v })}
          />
          <FieldInput
            label="Scroll Indicator Text"
            value={h.scrollHint}
            onChange={(v) => updateHero({ scrollHint: v })}
          />
          <FieldInput
            label="Headline Line 1"
            value={h.headlineLine1}
            onChange={(v) => updateHero({ headlineLine1: v })}
          />
          <FieldInput
            label="Highlighted Name (White)"
            value={h.headlineHighlight}
            onChange={(v) => updateHero({ headlineHighlight: v })}
          />
          <FieldInput
            label="Headline Line 2 (Gold)"
            value={h.headlineLine2}
            onChange={(v) => updateHero({ headlineLine2: v })}
          />
        </div>
        <FieldInput
          label="Poetic Opening Quote"
          value={h.poeticQuote}
          onChange={(v) => updateHero({ poeticQuote: v })}
          multiline
          rows={3}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FieldInput
            label="Tag Left"
            value={h.tagLeft}
            onChange={(v) => updateHero({ tagLeft: v })}
          />
          <FieldInput
            label="Tag Right"
            value={h.tagRight}
            onChange={(v) => updateHero({ tagRight: v })}
          />
        </div>
      </AdminSectionCard>

      <AdminSectionCard
        title="3D Scroll Room Cards (Entrance → Garden)"
        subtitle="Cards that animate smoothly on screen while scrolling through the 3D villa walkthrough."
      >
        <div className="space-y-5">
          {draft.rooms.map((room, idx) => (
            <div
              key={room.id}
              className="p-4 rounded-xl bg-[#fcf9f2] border border-[#e5d5aa] space-y-3"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#8b6914]">
                  Room Card #{idx + 1} ({room.subtitle})
                </span>
                {draft.rooms.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeRoom(idx)}
                    className="text-xs text-red-600 hover:underline font-semibold cursor-pointer"
                  >
                    Remove
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <FieldInput
                  label="Room Subtitle"
                  value={room.subtitle}
                  onChange={(v) => updateRoom(idx, { subtitle: v })}
                />
                <FieldInput
                  label="Room Title"
                  value={room.title}
                  onChange={(v) => updateRoom(idx, { title: v })}
                />
                <label className="flex flex-col gap-1.5">
                  <span className="text-[11px] uppercase tracking-[0.14em] font-bold text-[#8b6914]">
                    Script Screen Position
                  </span>
                  <select
                    value={room.position}
                    onChange={(e) =>
                      updateRoom(idx, {
                        position: e.target.value as RoomPosition,
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#faf6ed] border border-[#dcc484]/80 text-sm text-[#1c1812]"
                  >
                    <option value="top-left">Top Left (Hero Spot)</option>
                    <option value="top-right">Top Right</option>
                    <option value="bottom-left">Bottom Left</option>
                    <option value="bottom-right">Bottom Right</option>
                  </select>
                </label>
              </div>
              <FieldInput
                label="Description"
                value={room.description}
                onChange={(v) => updateRoom(idx, { description: v })}
                multiline
                rows={2}
              />
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addRoom}
          className="px-4 py-2 rounded-xl border border-[#c9a84c] text-xs font-bold uppercase tracking-wider text-[#8b6914] hover:bg-[#faf6ed] cursor-pointer"
        >
          + Add 3D Room Card
        </button>
      </AdminSectionCard>
    </div>
  );
}

export function MaterialityEditor({
  draft,
  setDraft,
  mediaAssets,
  onMediaUploaded,
}: EditorSharedProps) {
  const m = draft.materiality;
  const { getFraming, setFraming } = slotHelpers(draft, setDraft);
  const updateMat = (patch: Partial<SiteConfig["materiality"]>) =>
    setDraft((prev) => ({
      ...prev,
      materiality: { ...prev.materiality, ...patch },
    }));

  return (
    <div className="space-y-6">
      <AdminSectionCard
        title="Monograph Header & Property Specs"
        subtitle="Top headline and the 3-row quick summary box (Location, Space, Architect)."
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <FieldInput
            label="Top Badge"
            value={m.monographBadge}
            onChange={(v) => updateMat({ monographBadge: v })}
          />
          <FieldInput
            label="Title Line 1"
            value={m.titleLine1}
            onChange={(v) => updateMat({ titleLine1: v })}
          />
          <FieldInput
            label="Title Line 2 (Italic)"
            value={m.titleItalic}
            onChange={(v) => updateMat({ titleItalic: v })}
          />
        </div>
        <FieldInput
          label="Intro Description"
          value={m.introText}
          onChange={(v) => updateMat({ introText: v })}
          multiline
          rows={2}
        />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          {m.summaryRows.map((row, idx) => (
            <div key={idx} className="p-3 rounded-xl bg-[#fcf9f2] border border-[#e5d5aa] space-y-2">
              <FieldInput
                label={`Row ${idx + 1} Label`}
                value={row.label}
                onChange={(v) => {
                  const next = [...m.summaryRows];
                  next[idx] = { ...next[idx], label: v };
                  updateMat({ summaryRows: next });
                }}
              />
              <FieldInput
                label={`Row ${idx + 1} Value`}
                value={row.value}
                onChange={(v) => {
                  const next = [...m.summaryRows];
                  next[idx] = { ...next[idx], value: v };
                  updateMat({ summaryRows: next });
                }}
              />
            </div>
          ))}
        </div>
      </AdminSectionCard>

      <AdminSectionCard
        title="Top 3 Luxury House Photographs"
        subtitle="Upload or pick photos for the 3-column showcase directly under the Monograph header."
      >
        <div className="grid grid-cols-1 gap-4">
          {m.topViews.map((view, idx) => (
            <div key={idx} className="space-y-2">
              <ImagePickerField
                label={`House View Photo #${idx + 1}`}
                value={view.src}
                onChange={(v) => {
                  const next = [...m.topViews];
                  next[idx] = { ...next[idx], src: v };
                  updateMat({ topViews: next });
                }}
                mediaAssets={mediaAssets}
                onUploaded={onMediaUploaded}
                framing={getFraming(`materiality.topView.${idx}`)}
                onFramingChange={(f) => setFraming(`materiality.topView.${idx}`, f)}
              />
              <FieldInput
                label={`Photo #${idx + 1} Alt Description`}
                value={view.alt}
                onChange={(v) => {
                  const next = [...m.topViews];
                  next[idx] = { ...next[idx], alt: v };
                  updateMat({ topViews: next });
                }}
              />
            </div>
          ))}
        </div>
      </AdminSectionCard>

      <AdminSectionCard
        title="Architectural Volumes & Balance"
        subtitle="Customize the 3 big stat/feature cards."
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FieldInput
            label="Section Kicker"
            value={m.volumesKicker}
            onChange={(v) => updateMat({ volumesKicker: v })}
          />
          <FieldInput
            label="Section Title"
            value={m.volumesTitle}
            onChange={(v) => updateMat({ volumesTitle: v })}
          />
        </div>
        <FieldInput
          label="Section Subtitle"
          value={m.volumesSubtitle}
          onChange={(v) => updateMat({ volumesSubtitle: v })}
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {m.volumeCards.map((card, idx) => (
            <div key={idx} className="p-4 rounded-xl bg-[#fcf9f2] border border-[#e5d5aa] space-y-2.5">
              <FieldInput
                label="Tag"
                value={card.tag}
                onChange={(v) => {
                  const next = [...m.volumeCards];
                  next[idx] = { ...next[idx], tag: v };
                  updateMat({ volumeCards: next });
                }}
              />
              <div className="grid grid-cols-2 gap-2">
                <FieldInput
                  label="Number"
                  value={card.value}
                  onChange={(v) => {
                    const next = [...m.volumeCards];
                    next[idx] = { ...next[idx], value: v };
                    updateMat({ volumeCards: next });
                  }}
                />
                <FieldInput
                  label="Unit"
                  value={card.unit}
                  onChange={(v) => {
                    const next = [...m.volumeCards];
                    next[idx] = { ...next[idx], unit: v };
                    updateMat({ volumeCards: next });
                  }}
                />
              </div>
              <FieldInput
                label="Title"
                value={card.title}
                onChange={(v) => {
                  const next = [...m.volumeCards];
                  next[idx] = { ...next[idx], title: v };
                  updateMat({ volumeCards: next });
                }}
              />
              <FieldInput
                label="Description"
                value={card.description}
                onChange={(v) => {
                  const next = [...m.volumeCards];
                  next[idx] = { ...next[idx], description: v };
                  updateMat({ volumeCards: next });
                }}
                multiline
                rows={2}
              />
              <FieldInput
                label="Footer Highlight"
                value={card.footer}
                onChange={(v) => {
                  const next = [...m.volumeCards];
                  next[idx] = { ...next[idx], footer: v };
                  updateMat({ volumeCards: next });
                }}
              />
            </div>
          ))}
        </div>
      </AdminSectionCard>

      <AdminSectionCard
        title="Photographic Plates & Natural Integration Narrative"
        subtitle="Left 3 photos and right storytelling block."
      >
        <div className="space-y-4">
          <ImagePickerField
            label="Large Top Plate Photo"
            value={m.plateLarge.src}
            onChange={(v) => updateMat({ plateLarge: { ...m.plateLarge, src: v } })}
            mediaAssets={mediaAssets}
            onUploaded={onMediaUploaded}
            framing={getFraming("materiality.plateLarge")}
            onFramingChange={(f) => setFraming("materiality.plateLarge", f)}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ImagePickerField
              label="Bottom Left Plate Photo"
              value={m.plateSmallLeft.src}
              onChange={(v) => updateMat({ plateSmallLeft: { ...m.plateSmallLeft, src: v } })}
              mediaAssets={mediaAssets}
              onUploaded={onMediaUploaded}
              framing={getFraming("materiality.plateSmallLeft")}
              onFramingChange={(f) => setFraming("materiality.plateSmallLeft", f)}
            />
            <ImagePickerField
              label="Bottom Right Plate Photo"
              value={m.plateSmallRight.src}
              onChange={(v) => updateMat({ plateSmallRight: { ...m.plateSmallRight, src: v } })}
              mediaAssets={mediaAssets}
              onUploaded={onMediaUploaded}
              framing={getFraming("materiality.plateSmallRight")}
              onFramingChange={(f) => setFraming("materiality.plateSmallRight", f)}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FieldInput
              label="Narrative Kicker"
              value={m.narrativeKicker}
              onChange={(v) => updateMat({ narrativeKicker: v })}
            />
            <FieldInput
              label="Narrative Title"
              value={m.narrativeTitle}
              onChange={(v) => updateMat({ narrativeTitle: v })}
            />
          </div>
          <FieldInput
            label="Paragraph 1"
            value={m.narrativeParagraph1}
            onChange={(v) => updateMat({ narrativeParagraph1: v })}
            multiline
            rows={3}
          />
          <FieldInput
            label="Paragraph 2"
            value={m.narrativeParagraph2}
            onChange={(v) => updateMat({ narrativeParagraph2: v })}
            multiline
            rows={3}
          />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {m.narrativeSpecs.map((sp, idx) => (
              <div key={idx} className="p-3 rounded-xl bg-[#fcf9f2] border border-[#e5d5aa] space-y-2">
                <FieldInput
                  label="Spec Label"
                  value={sp.label}
                  onChange={(v) => {
                    const next = [...m.narrativeSpecs];
                    next[idx] = { ...next[idx], label: v };
                    updateMat({ narrativeSpecs: next });
                  }}
                />
                <FieldInput
                  label="Spec Value"
                  value={sp.value}
                  onChange={(v) => {
                    const next = [...m.narrativeSpecs];
                    next[idx] = { ...next[idx], value: v };
                    updateMat({ narrativeSpecs: next });
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      </AdminSectionCard>

      <AdminSectionCard
        title="Exterior Perspectives & Architect Quote"
        subtitle="Manage the exterior photo pool and lead architect quotation."
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FieldInput
            label="Exterior Section Kicker"
            value={m.exteriorKicker}
            onChange={(v) => updateMat({ exteriorKicker: v })}
          />
          <FieldInput
            label="Exterior Section Title"
            value={m.exteriorTitle}
            onChange={(v) => updateMat({ exteriorTitle: v })}
          />
        </div>
        <FieldInput
          label="Exterior Section Subtitle"
          value={m.exteriorSubtitle}
          onChange={(v) => updateMat({ exteriorSubtitle: v })}
        />

        <div className="space-y-3">
          {m.exteriorPool.map((item, idx) => (
            <div key={idx} className="space-y-1">
              <ImagePickerField
                label={`Exterior Gallery Photo #${idx + 1}`}
                value={item.src}
                onChange={(v) => {
                  const next = [...m.exteriorPool];
                  next[idx] = { ...next[idx], src: v };
                  updateMat({ exteriorPool: next });
                }}
                mediaAssets={mediaAssets}
                onUploaded={onMediaUploaded}
                framing={getFraming(`materiality.exterior.${idx}`)}
                onFramingChange={(f) => setFraming(`materiality.exterior.${idx}`, f)}
              />
              {m.exteriorPool.length > 4 && (
                <button
                  type="button"
                  onClick={() =>
                    updateMat({
                      exteriorPool: m.exteriorPool.filter((_, i) => i !== idx),
                    })
                  }
                  className="text-xs text-red-600 hover:underline font-semibold cursor-pointer"
                >
                  Remove Photo #{idx + 1}
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={() =>
              updateMat({
                exteriorPool: [
                  ...m.exteriorPool,
                  { src: "/images/house-view-4.jpg", alt: "Exterior residence view" },
                ],
              })
            }
            className="px-4 py-2 rounded-xl border border-[#c9a84c] text-xs font-bold uppercase tracking-wider text-[#8b6914] hover:bg-[#faf6ed] cursor-pointer"
          >
            + Add Exterior Photo
          </button>
        </div>

        <div className="pt-4 border-t border-[#efe3c4] space-y-3">
          <FieldInput
            label="Architect Quote"
            value={m.quoteText}
            onChange={(v) => updateMat({ quoteText: v })}
            multiline
            rows={3}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FieldInput
              label="Quote Author"
              value={m.quoteAuthor}
              onChange={(v) => updateMat({ quoteAuthor: v })}
            />
            <FieldInput
              label="Author Role"
              value={m.quoteRole}
              onChange={(v) => updateMat({ quoteRole: v })}
            />
          </div>
        </div>
      </AdminSectionCard>
    </div>
  );
}

export function MasterplanEditor({
  draft,
  setDraft,
  mediaAssets,
  onMediaUploaded,
}: EditorSharedProps) {
  const mp = draft.masterplan;
  const { getFraming, setFraming } = slotHelpers(draft, setDraft);
  const updateMp = (patch: Partial<SiteConfig["masterplan"]>) =>
    setDraft((prev) => ({
      ...prev,
      masterplan: { ...prev.masterplan, ...patch },
    }));

  const levelKeys: LevelKey[] = ["-1", "00", "01", "02"];

  return (
    <div className="space-y-6">
      <AdminSectionCard
        title="Masterplan Hero Banner"
        subtitle="Top overview headline and interactive 3D tilt image."
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FieldInput
            label="Kicker"
            value={mp.heroKicker}
            onChange={(v) => updateMp({ heroKicker: v })}
          />
          <FieldInput
            label="Main Title"
            value={mp.heroTitle}
            onChange={(v) => updateMp({ heroTitle: v })}
          />
        </div>
        <FieldInput
          label="Subtitle"
          value={mp.heroSubtitle}
          onChange={(v) => updateMp({ heroSubtitle: v })}
          multiline
          rows={2}
        />
        <ImagePickerField
          label="Masterplan Showcase Photo"
          value={mp.heroImage}
          onChange={(v) => updateMp({ heroImage: v })}
          mediaAssets={mediaAssets}
          onUploaded={onMediaUploaded}
          framing={getFraming("masterplan.heroImage")}
          onFramingChange={(f) => setFraming("masterplan.heroImage", f)}
        />
      </AdminSectionCard>

      <AdminSectionCard
        title="Four Signature Enclaves (Zone Cards)"
        subtitle="Edit titles, descriptions, metrics, and photos of the 4 estate zones."
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {mp.zoneCards.map((z, idx) => (
            <div key={z.id} className="p-4 rounded-xl bg-[#fcf9f2] border border-[#e5d5aa] space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-[#8b6914]">
                Zone #{idx + 1} (Wing {z.id})
              </div>
              <FieldInput
                label="Zone Title"
                value={z.title}
                onChange={(v) => {
                  const next = [...mp.zoneCards];
                  next[idx] = { ...next[idx], title: v };
                  updateMp({ zoneCards: next });
                }}
              />
              <FieldInput
                label="Zone Description"
                value={z.desc}
                onChange={(v) => {
                  const next = [...mp.zoneCards];
                  next[idx] = { ...next[idx], desc: v };
                  updateMp({ zoneCards: next });
                }}
                multiline
                rows={2}
              />
              <ImagePickerField
                label="Zone Photo"
                value={z.image}
                onChange={(v) => {
                  const next = [...mp.zoneCards];
                  next[idx] = { ...next[idx], image: v };
                  updateMp({ zoneCards: next });
                }}
                mediaAssets={mediaAssets}
                onUploaded={onMediaUploaded}
                framing={getFraming(`masterplan.zone.${idx}`)}
                onFramingChange={(f) => setFraming(`masterplan.zone.${idx}`, f)}
              />
            </div>
          ))}
        </div>
      </AdminSectionCard>

      <AdminSectionCard
        title="Architectural Wing Blueprints (-1 / 00 / 01 / 02)"
        subtitle="Customize the 4 interactive wing tabs and their technical specifications."
      >
        <div className="space-y-4">
          {levelKeys.map((k) => {
            const lvl = mp.levels[k];
            const updateLvl = (patch: Partial<typeof lvl>) =>
              updateMp({
                levels: {
                  ...mp.levels,
                  [k]: { ...lvl, ...patch },
                },
              });

            return (
              <div key={k} className="p-4 rounded-xl bg-[#fcf9f2] border border-[#e5d5aa] space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-[#8b6914]">
                  Wing {k}: {lvl.label}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <FieldInput label="Tab Label" value={lvl.label} onChange={(v) => updateLvl({ label: v })} />
                  <FieldInput label="Short Title" value={lvl.shortTitle} onChange={(v) => updateLvl({ shortTitle: v })} />
                  <FieldInput label="Subline" value={lvl.elevationLine} onChange={(v) => updateLvl({ elevationLine: v })} />
                </div>
                <FieldInput label="Full Wing Heading" value={lvl.title} onChange={(v) => updateLvl({ title: v })} />
                <FieldInput label="Wing Description" value={lvl.desc} onChange={(v) => updateLvl({ desc: v })} multiline rows={2} />
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <FieldInput label="Floor Area" value={lvl.area} onChange={(v) => updateLvl({ area: v })} />
                  <FieldInput label="Ceiling Height" value={lvl.height} onChange={(v) => updateLvl({ height: v })} />
                  <FieldInput label="Water Element" value={lvl.water} onChange={(v) => updateLvl({ water: v })} />
                  <FieldInput label="Primary Material" value={lvl.material} onChange={(v) => updateLvl({ material: v })} />
                </div>
              </div>
            );
          })}
        </div>
      </AdminSectionCard>

      <AdminSectionCard
        title="Ecological Balance & Bottom Land Summary Strip"
        subtitle="Edit sustainability metrics and the 4 estate totals at the bottom."
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FieldInput label="Section Title" value={mp.ecoTitle} onChange={(v) => updateMp({ ecoTitle: v })} />
          <FieldInput label="Section Kicker" value={mp.ecoKicker} onChange={(v) => updateMp({ ecoKicker: v })} />
        </div>
        <FieldInput label="Eco Description" value={mp.ecoDescription} onChange={(v) => updateMp({ ecoDescription: v })} multiline rows={2} />

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
          {mp.landSummaryStats.map((st, idx) => (
            <div key={idx} className="p-3 rounded-xl bg-[#fcf9f2] border border-[#e5d5aa] space-y-2">
              <FieldInput
                label={`Stat ${idx + 1} Label`}
                value={st.label}
                onChange={(v) => {
                  const next = [...mp.landSummaryStats];
                  next[idx] = { ...next[idx], label: v };
                  updateMp({ landSummaryStats: next });
                }}
              />
              <FieldInput
                label={`Stat ${idx + 1} Value`}
                value={st.value}
                onChange={(v) => {
                  const next = [...mp.landSummaryStats];
                  next[idx] = { ...next[idx], value: v };
                  updateMp({ landSummaryStats: next });
                }}
              />
            </div>
          ))}
        </div>
      </AdminSectionCard>
    </div>
  );
}

export function ContactEditor({
  draft,
  setDraft,
  mediaAssets,
  onMediaUploaded,
}: EditorSharedProps) {
  const c = draft.contact;
  const { getFraming, setFraming } = slotHelpers(draft, setDraft);
  const updateContact = (patch: Partial<SiteConfig["contact"]>) =>
    setDraft((prev) => ({
      ...prev,
      contact: { ...prev.contact, ...patch },
    }));

  return (
    <div className="space-y-6">
      <AdminSectionCard
        title="Private Advisory Profile & Direct Contact Details"
        subtitle="Updating Email, Phone, or WhatsApp here also updates where Contact Form emails and WhatsApp messages go!"
      >
        <ImagePickerField
          label="3D Medallion Profile Avatar (DP)"
          value={c.architectAvatarUrl}
          onChange={(v) => updateContact({ architectAvatarUrl: v })}
          mediaAssets={mediaAssets}
          onUploaded={onMediaUploaded}
          framing={getFraming("contact.avatar")}
          onFramingChange={(f) => setFraming("contact.avatar", f)}
        />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <FieldInput label="Owner / Architect Name" value={c.architectName} onChange={(v) => updateContact({ architectName: v })} />
          <FieldInput label="Role Title" value={c.architectRole} onChange={(v) => updateContact({ architectRole: v })} />
          <FieldInput label="Tagline" value={c.architectTagline} onChange={(v) => updateContact({ architectTagline: v })} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FieldInput label="Target Recipient Email" value={c.ownerEmail} onChange={(v) => updateContact({ ownerEmail: v })} type="email" />
          <FieldInput label="Display Phone Number" value={c.ownerPhone} onChange={(v) => updateContact({ ownerPhone: v })} />
          <FieldInput label="WhatsApp Digits (With Country Code)" value={c.whatsappNumber} onChange={(v) => updateContact({ whatsappNumber: v })} />
          <FieldInput label="WhatsApp Link Label" value={c.whatsappDisplay} onChange={(v) => updateContact({ whatsappDisplay: v })} />
        </div>

        <ImagePickerField
          label="Contact Right-Side Showcase Image"
          value={c.showcaseImage}
          onChange={(v) => updateContact({ showcaseImage: v })}
          mediaAssets={mediaAssets}
          onUploaded={onMediaUploaded}
          framing={getFraming("contact.showcase")}
          onFramingChange={(f) => setFraming("contact.showcase", f)}
        />
      </AdminSectionCard>

      <AdminSectionCard
        title="Contact Section Header & Estate Metrics"
        subtitle="Top contact page title, quote, and 4 quick facts."
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FieldInput label="Heading Line 1" value={c.headingLine1} onChange={(v) => updateContact({ headingLine1: v })} />
          <FieldInput label="Heading Line 2 (Italic)" value={c.headingItalic} onChange={(v) => updateContact({ headingItalic: v })} />
        </div>
        <FieldInput label="Contact Page Intro Quote" value={c.introQuote} onChange={(v) => updateContact({ introQuote: v })} multiline rows={2} />

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {c.estateSummaryMetrics.map((m, idx) => (
            <div key={idx} className="p-3 rounded-xl bg-[#fcf9f2] border border-[#e5d5aa] space-y-2">
              <FieldInput
                label="Label"
                value={m.label}
                onChange={(v) => {
                  const next = [...c.estateSummaryMetrics];
                  next[idx] = { ...next[idx], label: v };
                  updateContact({ estateSummaryMetrics: next });
                }}
              />
              <FieldInput
                label="Value"
                value={m.value}
                onChange={(v) => {
                  const next = [...c.estateSummaryMetrics];
                  next[idx] = { ...next[idx], value: v };
                  updateContact({ estateSummaryMetrics: next });
                }}
              />
            </div>
          ))}
        </div>
      </AdminSectionCard>

      <AdminSectionCard
        title="Address, Map Modal & Direct Inquiry Form"
        subtitle="Customize the address bar, popup address lines, and inquiry form headings."
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FieldInput label="City Title" value={c.cityTitle} onChange={(v) => updateContact({ cityTitle: v })} />
          <FieldInput label="Address Subline" value={c.addressSubline} onChange={(v) => updateContact({ addressSubline: v })} />
          <FieldInput label="Footer Location Bar Text" value={c.footerLocationText} onChange={(v) => updateContact({ footerLocationText: v })} />
          <FieldInput label="Location Modal Title" value={c.locationModalTitle} onChange={(v) => updateContact({ locationModalTitle: v })} />
        </div>
        <FieldInput
          label="Full Address Lines (One per line)"
          value={c.locationModalLines.join("\n")}
          onChange={(v) => updateContact({ locationModalLines: v.split("\n").filter(Boolean) })}
          multiline
          rows={3}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FieldInput label="Form Section Kicker" value={c.formKicker} onChange={(v) => updateContact({ formKicker: v })} />
          <FieldInput label="Form Title" value={c.formTitle} onChange={(v) => updateContact({ formTitle: v })} />
        </div>
      </AdminSectionCard>
    </div>
  );
}

