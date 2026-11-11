"use client";

import React, { useRef, useState } from "react";
import type {
  CaptionPosition,
  ImageBorderStyle,
  ImageFraming,
  ImageMotionStyle,
} from "@/lib/defaultSiteConfig";

export interface MediaAssetItem {
  id: number;
  filename: string;
  original_name: string;
  mime_type: string;
  size_bytes: number;
  url: string;
  uploaded_by: string;
  created_at: string;
}

export const BUILTIN_PRESET_IMAGES = [
  { label: "Avijit Portrait DP", url: "/images/avijit-dp.jpg" },
  { label: "Avijit Header Logo", url: "/images/avijit-header-dp.jpg" },
  { label: "Villa Exterior 1", url: "/images/house-view-1.jpg" },
  { label: "Villa Infinity Pool", url: "/images/house-view-2.jpg" },
  { label: "Villa Glass Entrance", url: "/images/house-view-3.jpg" },
  { label: "Villa Koi Courtyard", url: "/images/house-view-4.jpg" },
  { label: "Villa Dusk Glow", url: "/images/house-view-5.jpg" },
  { label: "White Marble Backdrop", url: "/images/white-marble.jpg" },
  { label: "3D Frame: Entrance", url: "/frames/frame_0200.jpg" },
  { label: "3D Frame: Kitchen", url: "/frames/frame_0800.jpg" },
  { label: "3D Frame: Bedroom", url: "/frames/frame_1900.jpg" },
  { label: "3D Frame: Infinity Terrace", url: "/frames/frame_2250.jpg" },
];

export function AdminSectionCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="admin-card-enter rounded-2xl bg-white/88 backdrop-blur-xl border border-[#c9a84c]/55 shadow-[0_14px_38px_rgba(120,90,30,0.1)] p-5 sm:p-6 space-y-5">
      <div className="border-b border-[#e8d7ae] pb-3">
        <h3 className="text-lg sm:text-xl font-bold text-[#1c1812]">{title}</h3>
        {subtitle && (
          <p className="text-xs text-[#574e40] mt-0.5 leading-relaxed">{subtitle}</p>
        )}
      </div>
      {children}
    </div>
  );
}

export function FieldInput({
  label,
  value,
  onChange,
  multiline = false,
  rows = 3,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
  multiline?: boolean;
  rows?: number;
  type?: string;
  placeholder?: string;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[11px] uppercase tracking-[0.14em] font-bold text-[#8b6914]">
        {label}
      </span>
      {multiline ? (
        <textarea
          rows={rows}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full px-3.5 py-2.5 rounded-xl bg-[#faf6ed]/90 border border-[#dcc484] focus:border-[#8b6914] focus:bg-white focus:outline-none text-sm text-[#1c1812] transition-colors resize-y"
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full px-3.5 py-2.5 rounded-xl bg-[#faf6ed]/90 border border-[#dcc484] focus:border-[#8b6914] focus:bg-white focus:outline-none text-sm text-[#1c1812] transition-colors"
        />
      )}
    </label>
  );
}

export function ImagePickerField({
  label,
  value,
  onChange,
  mediaAssets,
  onUploaded,
  framing,
  onFramingChange,
}: {
  label: string;
  value: string;
  onChange: (newUrl: string) => void;
  mediaAssets: MediaAssetItem[];
  onUploaded: (asset: MediaAssetItem) => void;
  framing?: ImageFraming;
  onFramingChange?: (next: ImageFraming) => void;
}) {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [showStudio, setShowStudio] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const cur: ImageFraming = {
    posX: framing?.posX ?? 50,
    posY: framing?.posY ?? 50,
    zoom: framing?.zoom ?? 100,
    borderStyle: framing?.borderStyle ?? "gold-classic",
    motionStyle: framing?.motionStyle ?? "inherit",
    captionText: framing?.captionText ?? "",
    captionPosition: framing?.captionPosition ?? "bottom-left",
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError(null);

    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok || !json?.ok) {
        setUploadError(json?.error || "Upload failed");
      } else {
        onUploaded(json.asset);
        onChange(json.url);
      }
    } catch {
      setUploadError("Network upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const previewBorderCls =
    cur.borderStyle === "gold-double"
      ? "border-2 border-[#b58b28] ring-2 ring-[#f2ca50]/50 p-0.5"
      : cur.borderStyle === "glass-glow"
        ? "border border-[#f2ca50] shadow-[0_0_16px_rgba(212,175,55,0.5)]"
        : cur.borderStyle === "minimal"
          ? "border border-stone-300"
          : cur.borderStyle === "none"
            ? "border-0"
            : "border border-[#c9a84c]";

  return (
    <div className="flex flex-col gap-2.5 p-4 rounded-xl bg-[#fcf9f2]/90 border border-[#dcc484]/85">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-[11px] uppercase tracking-[0.14em] font-bold text-[#8b6914]">
          {label}
        </span>
        {cur.captionText && (
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#15120d] text-[#f2ca50] font-semibold">
            Caption: &ldquo;{cur.captionText}&rdquo;
          </span>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div
          className={`relative w-28 h-20 rounded-xl overflow-hidden bg-[#15120d] shrink-0 flex items-center justify-center ${previewBorderCls} ${
            cur.motionStyle === "float-3d"
              ? "animate-float-3d"
              : cur.motionStyle === "pulse-glow"
                ? "animate-pulse-gold"
                : ""
          }`}
        >
          {value ? (
            <img
              src={value}
              alt={label}
              style={{
                objectPosition: `${cur.posX}% ${cur.posY}%`,
                transform:
                  cur.zoom !== 100
                    ? `scale(${(cur.zoom / 100).toFixed(2)})`
                    : undefined,
                transformOrigin: `${cur.posX}% ${cur.posY}%`,
              }}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-[10px] text-[#a09480]">No image</span>
          )}
          {cur.captionText && (
            <span
              className={`absolute px-1.5 py-0.5 rounded bg-black/75 text-[#f2ca50] text-[8px] font-bold truncate max-w-[90%] ${
                cur.captionPosition === "bottom-center"
                  ? "bottom-1 left-1/2 -translate-x-1/2"
                  : cur.captionPosition === "top-left"
                    ? "top-1 left-1"
                    : cur.captionPosition === "center"
                      ? "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                      : "bottom-1 left-1"
              }`}
            >
              {cur.captionText}
            </span>
          )}
        </div>

        <div className="flex-1 w-full space-y-2">
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="/images/... or upload a photo"
            className="w-full px-3 py-2 rounded-lg bg-white border border-[#dcc484] focus:border-[#8b6914] focus:outline-none text-xs text-[#1c1812]"
          />

          <div className="flex flex-wrap gap-2">
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={handleUpload}
              className="hidden"
            />
            <button
              type="button"
              disabled={uploading}
              onClick={() => fileRef.current?.click()}
              className="px-3 py-1.5 rounded-lg bg-[#15120d] hover:bg-[#2a241b] text-[#f2ca50] text-[11px] font-bold uppercase tracking-wider cursor-pointer disabled:opacity-60 transition-colors"
            >
              {uploading ? "Uploading..." : "Upload Photo"}
            </button>
            <button
              type="button"
              onClick={() => setShowPicker((p) => !p)}
              className="px-3 py-1.5 rounded-lg border border-[#c9a84c] bg-white hover:bg-[#faf6ed] text-[#8b6914] text-[11px] font-bold uppercase tracking-wider cursor-pointer transition-colors"
            >
              {showPicker ? "Hide Gallery" : "Choose Image"}
            </button>
            {onFramingChange && (
              <button
                type="button"
                onClick={() => setShowStudio((p) => !p)}
                className={`px-3 py-1.5 rounded-lg border text-[11px] font-bold uppercase tracking-wider cursor-pointer transition-colors ${
                  showStudio
                    ? "bg-[#8b6914] text-white border-[#8b6914]"
                    : "border-[#dcc484] bg-white hover:bg-[#faf6ed] text-[#1c1812]"
                }`}
              >
                {showStudio
                  ? "Close Image Studio"
                  : "3D Effect, Border, Text & Position"}
              </button>
            )}
          </div>
          {uploadError && (
            <div className="text-xs text-red-600 font-medium">{uploadError}</div>
          )}
        </div>
      </div>

      {showStudio && onFramingChange && (
        <div className="pt-3 border-t border-[#efe3c4] space-y-4 bg-white/95 p-4 rounded-xl border border-[#e5d5aa]">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-[11px] uppercase tracking-wider font-bold text-[#8b6914]">
              Image Position, Zoom, Border, 3D Animation &amp; Text Overlay
            </span>
            <div className="flex flex-wrap gap-1.5">
              {[
                { label: "Top", x: 50, y: 15 },
                { label: "Center", x: 50, y: 50 },
                { label: "Bottom", x: 50, y: 85 },
                { label: "Left", x: 15, y: 50 },
                { label: "Right", x: 85, y: 50 },
              ].map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() =>
                    onFramingChange({ ...cur, posX: p.x, posY: p.y })
                  }
                  className="px-2 py-0.5 rounded border border-[#dcc484] bg-[#faf6ed] hover:bg-[#f2ca50]/30 text-[10px] font-bold text-[#1c1812] cursor-pointer"
                >
                  {p.label}
                </button>
              ))}
              <button
                type="button"
                onClick={() =>
                  onFramingChange({
                    posX: 50,
                    posY: 50,
                    zoom: 100,
                    borderStyle: "gold-classic",
                    motionStyle: "inherit",
                    captionText: "",
                    captionPosition: "bottom-left",
                  })
                }
                className="px-2 py-0.5 rounded border border-red-200 bg-red-50 text-[10px] font-bold text-red-700 cursor-pointer"
              >
                Reset Photo Style
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <label className="flex flex-col gap-1">
              <span className="text-[10px] font-bold text-[#6e6454]">
                Horizontal X Position: {cur.posX}%
              </span>
              <input
                type="range"
                min={0}
                max={100}
                value={cur.posX}
                onChange={(e) =>
                  onFramingChange({ ...cur, posX: Number(e.target.value) })
                }
                className="accent-[#8b6914]"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[10px] font-bold text-[#6e6454]">
                Vertical Y Position: {cur.posY}%
              </span>
              <input
                type="range"
                min={0}
                max={100}
                value={cur.posY}
                onChange={(e) =>
                  onFramingChange({ ...cur, posY: Number(e.target.value) })
                }
                className="accent-[#8b6914]"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[10px] font-bold text-[#6e6454]">
                Zoom Scale: {cur.zoom}%
              </span>
              <input
                type="range"
                min={100}
                max={160}
                value={cur.zoom}
                onChange={(e) =>
                  onFramingChange({ ...cur, zoom: Number(e.target.value) })
                }
                className="accent-[#8b6914]"
              />
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <label className="flex flex-col gap-1">
              <span className="text-[10px] uppercase tracking-wider font-bold text-[#8b6914]">
                Photo Border Style
              </span>
              <select
                value={cur.borderStyle}
                onChange={(e) =>
                  onFramingChange({
                    ...cur,
                    borderStyle: e.target.value as ImageBorderStyle,
                  })
                }
                className="w-full px-3 py-2 rounded-lg bg-[#faf6ed] border border-[#dcc484] text-xs text-[#1c1812]"
              >
                <option value="gold-classic">Classic Champagne Gold</option>
                <option value="gold-double">Double Royal Gold Bezel</option>
                <option value="glass-glow">3D Glowing Gold Rim</option>
                <option value="minimal">Minimal Clean Frame</option>
                <option value="none">Borderless Full Edge</option>
              </select>
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-[10px] uppercase tracking-wider font-bold text-[#8b6914]">
                Photo 3D &amp; Hover Animation
              </span>
              <select
                value={cur.motionStyle}
                onChange={(e) =>
                  onFramingChange({
                    ...cur,
                    motionStyle: e.target.value as ImageMotionStyle,
                  })
                }
                className="w-full px-3 py-2 rounded-lg bg-[#faf6ed] border border-[#dcc484] text-xs text-[#1c1812]"
              >
                <option value="inherit">Follow Global Website Animation</option>
                <option value="3d-tilt">Interactive 3D Mouse Tilt</option>
                <option value="float-3d">Continuous 3D Levitation Float</option>
                <option value="pulse-glow">Golden Halo Pulse</option>
                <option value="hover-zoom">Smooth Luxury Zoom</option>
                <option value="none">No Animation (Static)</option>
              </select>
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <div className="sm:col-span-2">
              <label className="flex flex-col gap-1">
                <span className="text-[10px] uppercase tracking-wider font-bold text-[#8b6914]">
                  Overlay Text on Image (Optional)
                </span>
                <input
                  type="text"
                  value={cur.captionText ?? ""}
                  onChange={(e) =>
                    onFramingChange({ ...cur, captionText: e.target.value })
                  }
                  placeholder="Leave blank for clean photo, or type label e.g. Infinity Terrace"
                  className="w-full px-3 py-2 rounded-lg bg-[#faf6ed] border border-[#dcc484] text-xs text-[#1c1812]"
                />
              </label>
            </div>
            <label className="flex flex-col gap-1">
              <span className="text-[10px] uppercase tracking-wider font-bold text-[#8b6914]">
                Overlay Text Position
              </span>
              <select
                value={cur.captionPosition}
                onChange={(e) =>
                  onFramingChange({
                    ...cur,
                    captionPosition: e.target.value as CaptionPosition,
                  })
                }
                className="w-full px-3 py-2 rounded-lg bg-[#faf6ed] border border-[#dcc484] text-xs text-[#1c1812]"
              >
                <option value="bottom-left">Bottom Left</option>
                <option value="bottom-center">Bottom Center</option>
                <option value="top-left">Top Left</option>
                <option value="center">Center</option>
              </select>
            </label>
          </div>
        </div>
      )}

      {showPicker && (
        <div className="pt-2 border-t border-[#efe3c4] space-y-2">
          <div className="text-[10px] uppercase tracking-wider font-bold text-[#6e6454]">
            Uploaded &amp; Built-in Photos (Click to Select)
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 max-h-48 overflow-y-auto pr-1">
            {mediaAssets.map((a) => (
              <button
                key={`up-${a.id}`}
                type="button"
                onClick={() => {
                  onChange(a.url);
                  setShowPicker(false);
                }}
                className={`group relative rounded-lg overflow-hidden border h-14 cursor-pointer ${
                  value === a.url ? "border-[#8b6914] ring-2 ring-[#d4af37]" : "border-[#dcc484]"
                }`}
                title={a.original_name}
              >
                <img src={a.url} alt={a.original_name} className="w-full h-full object-cover" />
              </button>
            ))}
            {BUILTIN_PRESET_IMAGES.map((preset) => (
              <button
                key={preset.url}
                type="button"
                onClick={() => {
                  onChange(preset.url);
                  setShowPicker(false);
                }}
                className={`group relative rounded-lg overflow-hidden border h-14 cursor-pointer ${
                  value === preset.url ? "border-[#8b6914] ring-2 ring-[#d4af37]" : "border-[#dcc484]"
                }`}
                title={preset.label}
              >
                <img src={preset.url} alt={preset.label} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
