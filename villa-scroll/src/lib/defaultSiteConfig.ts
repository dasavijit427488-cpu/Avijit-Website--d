import type { CSSProperties } from "react";

export interface InteriorRoomConfig {
  id: string;
  tag: string;
  subtitle: string;
  title: string;
  description: string;
  specs: string;
  position: RoomPosition;
  enterStart: number;
  enterEnd: number;
  exitStart: number;
  exitEnd: number;
}

export interface GalleryImageConfig {
  src: string;
  alt: string;
}

export interface VolumeCardConfig {
  tag: string;
  value: string;
  unit: string;
  title: string;
  description: string;
  footer: string;
}

export interface LabelValueItem {
  label: string;
  value: string;
}

export type LevelKey = "-1" | "00" | "01" | "02";

export interface MasterplanLevelConfig {
  key: LevelKey;
  label: string;
  shortTitle: string;
  elevationLine: string;
  code: string;
  badge: string;
  title: string;
  desc: string;
  area: string;
  height: string;
  water: string;
  material: string;
  cadSpan: string;
  coreText: string;
  featText: string;
  circleLetter: string;
}

export interface ZoneCardConfig {
  id: LevelKey;
  title: string;
  desc: string;
  metric: string;
  image: string;
}

export interface EcoFeatureConfig {
  title: string;
  desc: string;
}

export interface EcoBentoConfig {
  topValue: string;
  topLabel: string;
  title: string;
  desc: string;
  isRing?: boolean;
}

export interface BrandConfig {
  siteTitle: string;
  siteDescription: string;
  headerLogoUrl: string;
  brandFirstLetter: string;
  brandMiddleText: string;
  brandLastWord: string;
  navResidenceLabel: string;
  navMaterialityLabel: string;
  navMasterplanLabel: string;
  navContactLabel: string;
  copyrightText: string;
}

export interface HeroConfig {
  badgeText: string;
  headlineLine1: string;
  headlineHighlight: string;
  headlineLine2: string;
  poeticQuote: string;
  tagLeft: string;
  tagRight: string;
  scrollHint: string;
}

export interface MaterialityConfig {
  monographBadge: string;
  titleLine1: string;
  titleItalic: string;
  introText: string;
  summaryRows: LabelValueItem[];
  topViews: GalleryImageConfig[];
  volumesKicker: string;
  volumesTitle: string;
  volumesSubtitle: string;
  volumeCards: VolumeCardConfig[];
  plateLarge: GalleryImageConfig;
  plateSmallLeft: GalleryImageConfig;
  plateSmallRight: GalleryImageConfig;
  narrativeKicker: string;
  narrativeTitle: string;
  narrativeParagraph1: string;
  narrativeParagraph2: string;
  narrativeSpecs: LabelValueItem[];
  exteriorKicker: string;
  exteriorTitle: string;
  exteriorSubtitle: string;
  exteriorPool: GalleryImageConfig[];
  quoteText: string;
  quoteAuthor: string;
  quoteRole: string;
}

export interface MasterplanConfig {
  heroKicker: string;
  heroTitle: string;
  heroSubtitle: string;
  heroImage: string;
  heroImageAlt: string;
  zonesKicker: string;
  zonesTitle: string;
  zonesSubtitle: string;
  zoneCards: ZoneCardConfig[];
  wingsKicker: string;
  wingsTitle: string;
  wingsSubtitle: string;
  levels: Record<LevelKey, MasterplanLevelConfig>;
  ecoKicker: string;
  ecoTitle: string;
  ecoDescription: string;
  ecoFeatures: EcoFeatureConfig[];
  ecoBentoCards: EcoBentoConfig[];
  landSummaryStats: LabelValueItem[];
}

export interface ContactConfig {
  badgeText: string;
  residenceLabel: string;
  appointmentLabel: string;
  headingLine1: string;
  headingItalic: string;
  introQuote: string;
  estateSummaryTitle: string;
  estateSummaryBadge: string;
  estateSummaryMetrics: LabelValueItem[];
  advisoryTitle: string;
  architectAvatarUrl: string;
  architectName: string;
  architectRole: string;
  architectTagline: string;
  ownerEmail: string;
  ownerPhone: string;
  whatsappNumber: string;
  whatsappDisplay: string;
  whatsappPrefill: string;
  showcaseImage: string;
  showcaseAlt: string;
  formKicker: string;
  formTitle: string;
  formSubtitle: string;
  cityTitle: string;
  addressSubline: string;
  addressShortRight1: string;
  addressShortRight2: string;
  locationModalTitle: string;
  locationModalLines: string[];
  footerLocationText: string;
  inquiryModalKicker: string;
  inquiryModalTitle: string;
}

export type FontChoice = "playfair" | "cinzel" | "cormorant" | "sans" | "mono";
export type PageFontChoice = "inherit" | FontChoice;
export type TextAlignChoice = "left" | "center" | "right";
export type HeroPlacement =
  | "bottom-left"
  | "bottom-right"
  | "top-left"
  | "center"
  | "top-right"
  | "bottom-center";
export type RoomsPlacement =
  | "desktop-alternating"
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right"
  | "per-room";
export type RoomPosition = "top-left" | "top-right" | "bottom-left" | "bottom-right";
export type SitePageId = "residence" | "materiality" | "masterplan" | "contact";

export type ImageBorderStyle =
  | "gold-classic"
  | "gold-double"
  | "glass-glow"
  | "minimal"
  | "none";

export type ImageMotionStyle =
  | "inherit"
  | "hover-zoom"
  | "3d-tilt"
  | "float-3d"
  | "pulse-glow"
  | "none";

export type CaptionPosition = "bottom-left" | "bottom-center" | "top-left" | "center";

export interface ImageFraming {
  posX: number;
  posY: number;
  zoom: number;
  borderStyle?: ImageBorderStyle;
  motionStyle?: ImageMotionStyle;
  captionText?: string;
  captionPosition?: CaptionPosition;
}

export interface ColorThemeConfig {
  accentColor: string;
  headingColor: string;
  bodyColor: string;
  mutedColor: string;
  heroTitleColor: string;
  heroTextColor: string;
  roomTitleColor: string;
  roomTextColor: string;
}

export type AnimationSpeed = "slow" | "normal" | "fast";
export type AnimationDirectionMode =
  | "default"
  | "bottom-to-top"
  | "left-to-right"
  | "right-to-left"
  | "zoom-in";

export interface AnimationConfig {
  enabled: boolean;
  speed: AnimationSpeed;
  directionMode: AnimationDirectionMode;
  enable3dObjects: boolean;
  objectsSpeed: AnimationSpeed;
  defaultImageHover: Exclude<ImageMotionStyle, "inherit">;
}

export interface PageDesignConfig {
  id: SitePageId;
  pageFont: PageFontChoice;
  textAlign: TextAlignChoice;
  urlPath: string;
}

export interface DesignConfig {
  displayFont: FontChoice;
  headingFont: FontChoice;
  bodyFont: FontChoice;
  heroPlacement: HeroPlacement;
  heroTextAlign: TextAlignChoice;
  heroOffsetX: number;
  heroOffsetY: number;
  roomsPlacement: RoomsPlacement;
  roomsTextAlign: TextAlignChoice;
  dynamicUrlSync: boolean;
  pageOrder: SitePageId[];
  pages: Record<SitePageId, PageDesignConfig>;
  colors: ColorThemeConfig;
  animation: AnimationConfig;
  imageFraming: Record<string, ImageFraming>;
}

export const FONT_STACKS: Record<FontChoice, string> = {
  playfair: '"Playfair Display", Georgia, serif',
  cinzel: '"Cinzel", "Times New Roman", serif',
  cormorant: '"Cormorant Garamond", Georgia, serif',
  sans: '"Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  mono: '"Space Mono", monospace',
};

export const FONT_LABELS: Record<FontChoice, string> = {
  playfair: "Playfair Display (Classic Luxury)",
  cinzel: "Cinzel (Roman Display)",
  cormorant: "Cormorant Garamond (Editorial)",
  sans: "Plus Jakarta Sans (Modern Clean)",
  mono: "Space Mono (Architectural Tech)",
};

export interface SiteConfig {
  brand: BrandConfig;
  hero: HeroConfig;
  rooms: InteriorRoomConfig[];
  materiality: MaterialityConfig;
  masterplan: MasterplanConfig;
  contact: ContactConfig;
  design: DesignConfig;
}

export const DEFAULT_SITE_CONFIG: SiteConfig = {
  brand: {
    siteTitle: "Avijit Villa | Luxury 3D Architectural Experience",
    siteDescription:
      "Bespoke architectural residence showcased through interactive 3D scroll canvas",
    headerLogoUrl: "/images/avijit-header-dp.jpg",
    brandFirstLetter: "A",
    brandMiddleText: "VIJIT",
    brandLastWord: "VILLA",
    navResidenceLabel: "The Residence",
    navMaterialityLabel: "Materiality",
    navMasterplanLabel: "Masterplan",
    navContactLabel: "Contact",
    copyrightText: "© 2026 Avijit Villa",
  },
  hero: {
    badgeText: "Exclusive Sanctuary",
    headlineLine1: "Welcome To",
    headlineHighlight: "Avijit's",
    headlineLine2: "Property",
    poeticQuote:
      "An extraordinary architectural monolith sculpted from stone, silence, and sunrise — elevated above the infinite horizons of Lake Como.",
    tagLeft: "Private Estate",
    tagRight: "Masterwork by Avijit Das",
    scrollHint: "Scroll to Explore",
  },
  rooms: [
    {
      id: "entrance",
      tag: "ATRIUM",
      subtitle: "The Art of Arrival",
      title: "The Grand Entrance",
      description:
        "A soaring double-height portal framed in Roman travertine and floor-to-ceiling glass, introducing quiet monumentality.",
      specs: "4.5m Pivot Door • Recessed Ambient Halo",
      position: "bottom-left",
      enterStart: 0.03,
      enterEnd: 0.06,
      exitStart: 0.23,
      exitEnd: 0.26,
    },
    {
      id: "kitchen",
      tag: "CULINARY ATELIER",
      subtitle: "The Culinary Atelier",
      title: "Sculptural Kitchen",
      description:
        "Bookmatched Calacatta marble monolithic island paired with smoked oak millwork and integrated induction surfaces.",
      specs: "Gaggenau 400 Series • Hidden Scullery",
      position: "bottom-right",
      enterStart: 0.28,
      enterEnd: 0.31,
      exitStart: 0.48,
      exitEnd: 0.51,
    },
    {
      id: "bedroom",
      tag: "MASTER SUITE",
      subtitle: "The Twilight Sanctuary",
      title: "Master Bedroom Suite",
      description:
        "Floating platform king framed by acoustic slatted wall paneling, automated solar shading, and a private dawn veranda.",
      specs: "Sunrise Orientation • Dressing Suite",
      position: "bottom-left",
      enterStart: 0.52,
      enterEnd: 0.55,
      exitStart: 0.63,
      exitEnd: 0.66,
    },
    {
      id: "bathroom",
      tag: "MINERAL SPA",
      subtitle: "The Mineral Spa",
      title: "Monolithic Bathroom",
      description:
        "Freestanding honed basalt soaking tub surrounded by frameless glass that looks out onto a private bamboo sanctuary.",
      specs: "Rain Canopy • Heated Limestone",
      position: "bottom-right",
      enterStart: 0.67,
      enterEnd: 0.69,
      exitStart: 0.73,
      exitEnd: 0.75,
    },
    {
      id: "garden",
      tag: "ZENITH GARDEN",
      subtitle: "The Zenith Horizon",
      title: "Zenith Garden & Pool",
      description:
        "Linear heated reflection pool flanked by sculpted Mediterranean flora, sun lounge, and a sunken evening fire hearth.",
      specs: "Heated Saline • Fire Hearth",
      position: "bottom-left",
      enterStart: 0.76,
      enterEnd: 0.79,
      exitStart: 0.96,
      exitEnd: 1.0,
    },
  ],
  materiality: {
    monographBadge: "Architectural Monograph • Materiality",
    titleLine1: "The Monolith",
    titleItalic: "& The Void",
    introText:
      "A harmonious dialogue between sunlit Roman travertine, luminous white marble, and calm waters.",
    summaryRows: [
      { label: "Location", value: "Sodepur, Kolkata" },
      { label: "Living Space", value: "16,500 Sq Ft" },
      { label: "Architect", value: "Avijit Das" },
    ],
    topViews: [
      {
        src: "/images/house-view-1.jpg",
        alt: "Sunlit modern white travertine and glass villa exterior",
      },
      {
        src: "/images/house-view-2.jpg",
        alt: "Cantilevered infinity pool terrace overlooking calm waters",
      },
      {
        src: "/images/house-view-3.jpg",
        alt: "Double-height glass entrance courtyard framed in travertine",
      },
    ],
    volumesKicker: "Spatial Proportions",
    volumesTitle: "Architectural Volumes & Balance",
    volumesSubtitle:
      "Three sunlit pavilions shaped from Roman stone, crystal glazing, and natural oak timber.",
    volumeCards: [
      {
        tag: "Living Pavilion",
        value: "1,450",
        unit: "m²",
        title: "Open-Plan Sanctuary",
        description:
          "Column-free salons illuminated by 6.4-meter high ceilings, warm travertine walls, and seamless garden transitions.",
        footer: "6.4 Meters Ceiling Span",
      },
      {
        tag: "Cantilevered Pool",
        value: "25",
        unit: "Meters",
        title: "Elevated Reflection Horizon",
        description:
          "A sunlit saline infinity pool extending outward over landscaped stone terraces and calm lakeside foliage.",
        footer: "Heated Saltwater Basin",
      },
      {
        tag: "Natural Light",
        value: "300°",
        unit: "Glass",
        title: "Daylight Envelope",
        description:
          "Motorized low-iron acoustic glazing welcomes gentle morning sun while preserving serene indoor temperature.",
        footer: "Triple Acoustic Glazing",
      },
    ],
    plateLarge: {
      src: "/frames/frame_2250.jpg",
      alt: "Cantilevered infinity pool terrace at Avijit Villa",
    },
    plateSmallLeft: {
      src: "/frames/frame_0200.jpg",
      alt: "Roman travertine entrance facade of Avijit Villa",
    },
    plateSmallRight: {
      src: "/frames/frame_0800.jpg",
      alt: "Calacatta marble kitchen and interior gallery at Avijit Villa",
    },
    narrativeKicker: "Natural Integration",
    narrativeTitle: "Crafted in Light, Stone & Water",
    narrativeParagraph1:
      "Every structural element rests quietly within its natural terrain. Deep mineral foundations stabilize broad open pavilions so sunlight moves effortlessly through glass galleries from sunrise until dusk.",
    narrativeParagraph2:
      "Reflective perimeter water channels cool the afternoon breeze naturally while casting gentle golden ripples across the travertine ceilings.",
    narrativeSpecs: [
      { label: "Foundation Anchor", value: "Granite Bedrock" },
      { label: "Primary Facade", value: "Roman Travertine" },
      { label: "Acoustic Rating", value: "Whisper Quiet" },
    ],
    exteriorKicker: "Signature Architecture",
    exteriorTitle: "Exterior Residence Views",
    exteriorSubtitle:
      "Open-air elevations, landscaped stone courts, and golden reflections framing the outer sanctuary.",
    exteriorPool: [
      {
        src: "/images/house-view-4.jpg",
        alt: "Serene luxury travertine villa facade reflected in koi courtyard pool",
      },
      {
        src: "/images/house-view-5.jpg",
        alt: "Cantilevered luxury residence glowing in warm golden dusk light",
      },
      {
        src: "/images/house-view-2.jpg",
        alt: "Elevated infinity pool terrace and landscaped courtyard exterior",
      },
      {
        src: "/images/house-view-1.jpg",
        alt: "Modern limestone residence overlooking calm lakeside gardens",
      },
      {
        src: "/images/house-view-3.jpg",
        alt: "Architectural grand glass entrance courtyard exterior view",
      },
      {
        src: "/frames/frame_2250.jpg",
        alt: "Poolside exterior terrace panorama of Avijit Villa",
      },
    ],
    quoteText:
      "We did not seek to tame the landscape. We sculpted a quiet sanctuary where the morning sky, the stone, and the water speak together as one.",
    quoteAuthor: "Avijit Das",
    quoteRole: "Lead Architect & Master Planner",
  },
  masterplan: {
    heroKicker: "Estate Masterplan",
    heroTitle: "Peninsula Masterplan & Grounds",
    heroSubtitle:
      "Balanced harmoniously between natural stone terraces, sunlit botanical gardens, and serene water basins across four sculptural wings.",
    heroImage: "/images/house-view-1.jpg",
    heroImageAlt: "Avijit Villa panoramic masterplan estate overview",
    zonesKicker: "Estate Zones",
    zonesTitle: "Four Signature Enclaves",
    zonesSubtitle:
      "Each architectural wing is crafted for privacy, natural light, and serene views.",
    zoneCards: [
      {
        id: "01",
        title: "Private Residence & Entrance",
        desc: "A cantilevered primary wing housing double-height reception salons, custom limestone columns, and dual master bedroom suites.",
        metric: "1,480 m² Interior",
        image: "/frames/frame_0200.jpg",
      },
      {
        id: "00",
        title: "Infinity Pool & Lawn Pavilion",
        desc: "Expansive saltwater swimming terrace surrounded by manicured lawns, shaded teak cabanas, and outdoor family dining.",
        metric: "25m Pool Terrace",
        image: "/frames/frame_2250.jpg",
      },
      {
        id: "02",
        title: "Sculpture Garden & Spa",
        desc: "Tranquil stone courtyard gardens with quiet reflection pools, private wellness suite, and aromatic Mediterranean foliage.",
        metric: "850 m² Courtyard",
        image: "/frames/frame_1900.jpg",
      },
      {
        id: "-1",
        title: "Subterranean Car Gallery",
        desc: "Climate-controlled private vault showcasing up to 8 vehicles with recessed gallery illumination and dedicated lounge.",
        metric: "8 Vehicle Capacity",
        image: "/frames/frame_0800.jpg",
      },
    ],
    wingsKicker: "Spatial Layout",
    wingsTitle: "Architectural Wings & Levels",
    wingsSubtitle:
      "Select any residence level to view its architectural blueprint and proportions.",
    levels: {
      "-1": {
        key: "-1",
        label: "Subterranean Wing",
        shortTitle: "Cellar & Car Gallery",
        elevationLine: "Vault Pavilion • 640 m²",
        code: "Subterranean Wing Plan",
        badge: "Subterranean Gallery",
        title: "Subterranean Wing: Cellar & Car Gallery",
        desc: "Carved gently beneath the main estate terrace. Houses the climate-controlled 8-car showroom gallery, private tasting lounge, and service quarters.",
        area: "640 m²",
        height: "3.60 m",
        water: "Granite Drainage",
        material: "Basalt & Bronze",
        cadSpan: "42.6 Meters Span",
        coreText: "AUTOMOTIVE GALLERY",
        featText: "PRIVATE CELLAR & LOUNGE",
        circleLetter: "G",
      },
      "00": {
        key: "00",
        label: "Garden Pavilion",
        shortTitle: "Terraces & Infinity Pool",
        elevationLine: "Main Sanctuary • 1,120 m²",
        code: "Garden Pavilion Plan",
        badge: "Main Social Wing",
        title: "Garden Pavilion: Terraces & Pool",
        desc: "The heart of the residence. Features the 25-meter heated saltwater infinity pool flowing into landscaped lawn terraces, great salon, and gourmet kitchen.",
        area: "1,120 m²",
        height: "4.80 m",
        water: "25m Infinity Pool",
        material: "Roman Travertine & Teak",
        cadSpan: "68.4 Meters Span",
        coreText: "GRAND SALON & ATRIUM",
        featText: "INFINITY WATER TERRACE",
        circleLetter: "P",
      },
      "01": {
        key: "01",
        label: "Upper Sanctuary",
        shortTitle: "Master Residential Suites",
        elevationLine: "Private Wing • 780 m²",
        code: "Upper Sanctuary Plan",
        badge: "Private Bedrooms",
        title: "Upper Sanctuary: Master Suites",
        desc: "Private sleeping wing featuring 7 serene bedroom suites, marble soaking baths, walk-in closets, and sunlit wrap-around garden balconies.",
        area: "780 m²",
        height: "3.40 m",
        water: "Spa Baths",
        material: "Smoked Oak & Marble",
        cadSpan: "54.0 Meters Span",
        coreText: "MASTER BEDROOM SUITES",
        featText: "SUNRISE BALCONY DECK",
        circleLetter: "S",
      },
      "02": {
        key: "02",
        label: "Sky Conservatory",
        shortTitle: "Observatory Sky Lounge",
        elevationLine: "Crown Retreat • 380 m²",
        code: "Sky Conservatory Plan",
        badge: "Roof Pavilion",
        title: "Sky Conservatory: Observatory Lounge",
        desc: "An elevated glass pavilion offering peaceful sunrise and evening views, quiet reading library, and private open-air meditation courtyard.",
        area: "380 m²",
        height: "4.20 m",
        water: "Reflecting Basin",
        material: "Limestone & Glass",
        cadSpan: "28.5 Meters Span",
        coreText: "SKY LIBRARY & SALON",
        featText: "OPEN ROOF COURTYARD",
        circleLetter: "L",
      },
    },
    ecoKicker: "Ecological Balance",
    ecoTitle: "Harmony with Surrounding Nature",
    ecoDescription:
      "Avijit Villa operates as a peaceful sustainable residence, blending passive daylight architecture with deep rainwater conservation and native gardens.",
    ecoFeatures: [
      {
        title: "Botanical Landscape Shield",
        desc: "Lush olive trees, cypresses, and botanical greenery provide natural shade and calm acoustics.",
      },
      {
        title: "Geothermal Climate Balance",
        desc: "Silent subterranean thermal regulation keeps indoor suites comfortable throughout every season.",
      },
      {
        title: "Integrated Solar Architecture",
        desc: "Concealed roof solar arrays cleanly supplement energy demand without altering aesthetic lines.",
      },
    ],
    ecoBentoCards: [
      {
        topValue: "100%",
        topLabel: "Autonomous",
        title: "Geothermal Comfort",
        desc: "Clean climate across all four residential wings.",
        isRing: true,
      },
      {
        topValue: "Net 0",
        topLabel: "Footprint",
        title: "Carbon Neutral",
        desc: "Generational durability with zero carbon waste.",
        isRing: true,
      },
      {
        topValue: "32,000 L",
        topLabel: "94% Recovery",
        title: "Rainwater Reserve",
        desc: "Filtered rainwater for botanical gardens.",
        isRing: false,
      },
      {
        topValue: "160 kWh",
        topLabel: "Solar Reserve",
        title: "Energy Reserve",
        desc: "Subterranean solid-state energy reserve.",
        isRing: false,
      },
    ],
    landSummaryStats: [
      { label: "Total Estate Land", value: "2.50 Acres" },
      { label: "Living Volume", value: "16,500 Sq Ft" },
      { label: "Accommodations", value: "7 Suites • 8 Baths" },
      { label: "Pool Dimension", value: "25m Infinity" },
    ],
  },
  contact: {
    badgeText: "Private Estate Liaison",
    residenceLabel: "Avijit Villa Residence",
    appointmentLabel: "By Appointment Exclusively",
    headingLine1: "Private Acquisition",
    headingItalic: "& Estate Liaison.",
    introQuote:
      "An architectural sanctuary crafted with natural stone and quiet elegance. Private viewings are personally hosted with direct representation by Principal Architect Avijit Das.",
    estateSummaryTitle: "Estate Summary",
    estateSummaryBadge: "Verified",
    estateSummaryMetrics: [
      { label: "Status", value: "Off-Market" },
      { label: "Ground Area", value: "14,200 m²" },
      { label: "Living Space", value: "2,400 m²" },
      { label: "Suites", value: "07 Private" },
    ],
    advisoryTitle: "Private Office Advisory",
    architectAvatarUrl: "/images/avijit-dp.jpg",
    architectName: "Avijit Das",
    architectRole: "Website Developer & Creator",
    architectTagline: "Interactive Web Design & Digital Experiences",
    ownerEmail: "dasavijit427488@gmail.com",
    ownerPhone: "+91 9038904861",
    whatsappNumber: "919038904861",
    whatsappDisplay: "9038904861 (Chat Now)",
    whatsappPrefill: "Hello Avijit Das, I am inquiring about Avijit Villa.",
    showcaseImage: "/images/house-view-2.jpg",
    showcaseAlt: "Avijit Villa 4K Architectural Estate View",
    formKicker: "Send Your Requirement",
    formTitle: "Direct Consultation & Message Form",
    formSubtitle: "Enter your details below to forward your inquiry directly.",
    cityTitle: "Sodepur, Kolkata",
    addressSubline: "Anandanagar, Near Pansila, Pin 700112",
    addressShortRight1: "Sodepur • Anandanagar",
    addressShortRight2: "Near Pansila • PIN 700112",
    locationModalTitle: "Avijit Villa Location",
    locationModalLines: [
      "Sodepur, Kolkata",
      "Anandanagar, Near Pansila",
      "PIN - 700112, West Bengal, India",
    ],
    footerLocationText: "Sodepur, Kolkata • Anandanagar, Near Pansila, Pin 700112",
    inquiryModalKicker: "Private Viewing • Avijit Das",
    inquiryModalTitle: "Private Estate Viewing",
  },
  design: {
    displayFont: "cinzel",
    headingFont: "playfair",
    bodyFont: "playfair",
    heroPlacement: "top-left",
    heroTextAlign: "left",
    heroOffsetX: 0,
    heroOffsetY: 0,
    roomsPlacement: "desktop-alternating",
    roomsTextAlign: "left",
    dynamicUrlSync: true,
    pageOrder: ["residence", "materiality", "masterplan", "contact"],
    pages: {
      residence: {
        id: "residence",
        pageFont: "inherit",
        textAlign: "left",
        urlPath: "/The-Residence",
      },
      materiality: {
        id: "materiality",
        pageFont: "inherit",
        textAlign: "left",
        urlPath: "/The-Residence/Materiality",
      },
      masterplan: {
        id: "masterplan",
        pageFont: "inherit",
        textAlign: "left",
        urlPath: "/The-Residence/Materiality/Masterplan",
      },
      contact: {
        id: "contact",
        pageFont: "inherit",
        textAlign: "left",
        urlPath: "/The-Residence/Materiality/Masterplan/Contact",
      },
    },
    colors: {
      accentColor: "#8b6914",
      headingColor: "#1c1812",
      bodyColor: "#4a4236",
      mutedColor: "#6e6454",
      heroTitleColor: "#f2ca50",
      heroTextColor: "#f5ede0",
      roomTitleColor: "#f2ca50",
      roomTextColor: "#fbf6ee",
    },
    animation: {
      enabled: true,
      speed: "normal",
      directionMode: "default",
      enable3dObjects: true,
      objectsSpeed: "normal",
      defaultImageHover: "hover-zoom",
    },
    imageFraming: {
      "brand.headerLogo": { posX: 50, posY: 50, zoom: 100 },
      "materiality.topView.0": { posX: 50, posY: 50, zoom: 100 },
      "materiality.topView.1": { posX: 50, posY: 50, zoom: 100 },
      "materiality.topView.2": { posX: 50, posY: 50, zoom: 100 },
      "materiality.plateLarge": { posX: 50, posY: 50, zoom: 100 },
      "materiality.plateSmallLeft": { posX: 50, posY: 50, zoom: 100 },
      "materiality.plateSmallRight": { posX: 50, posY: 50, zoom: 100 },
      "masterplan.heroImage": { posX: 50, posY: 50, zoom: 100 },
      "masterplan.zone.0": { posX: 50, posY: 50, zoom: 100 },
      "masterplan.zone.1": { posX: 50, posY: 50, zoom: 100 },
      "masterplan.zone.2": { posX: 50, posY: 50, zoom: 100 },
      "masterplan.zone.3": { posX: 50, posY: 50, zoom: 100 },
      "contact.avatar": { posX: 50, posY: 20, zoom: 106 },
      "contact.showcase": { posX: 50, posY: 50, zoom: 100 },
    },
  },
};

export function getImageFramingStyle(
  config: SiteConfig,
  slotKey: string,
  defaultPosX = 50,
  defaultPosY = 50,
  defaultZoom = 100
): CSSProperties {
  const f = config.design?.imageFraming?.[slotKey];
  const posX = f?.posX ?? defaultPosX;
  const posY = f?.posY ?? defaultPosY;
  const zoom = f?.zoom ?? defaultZoom;
  return {
    objectPosition: `${posX}% ${posY}%`,
    transform: zoom !== 100 ? `scale(${(zoom / 100).toFixed(2)})` : undefined,
    transformOrigin: `${posX}% ${posY}%`,
  };
}

