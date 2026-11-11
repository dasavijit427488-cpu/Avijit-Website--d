"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

interface SpatialMetric {
  id: string;
  metric: string;
  unit: string;
  title: string;
  subtitle: string;
  description: string;
  specs: string[];
  image: string;
}

const SPATIAL_METRICS: SpatialMetric[] = [
  {
    id: "land",
    metric: "2.50",
    unit: "ACRES",
    title: "Lakeside Land",
    subtitle: "Private Gated Property",
    description: "Nestled directly on Lake Como's shoreline, featuring manicured gardens, mature olive groves, and 300° open water views.",
    specs: ["Direct Lake Como Shoreline Access", "Botanical Olive & Palm Gardens", "Private Helipad & Gated Security"],
    image: "/frames/frame_0001.jpg",
  },
  {
    id: "area",
    metric: "16,500",
    unit: "SQ FT",
    title: "Living Space",
    subtitle: "3 Light-Filled Levels",
    description: "Spacious contemporary architecture designed with soaring 4.5-meter ceilings, open entertaining spaces, and floor-to-ceiling glass.",
    specs: ["4.5m Double-Height Ceilings", "Motorized Pocket Glass Walls", "Energy-Efficient Geothermal Climate"],
    image: "/frames/frame_0300.jpg",
  },
  {
    id: "suites",
    metric: "7",
    unit: "BEDROOMS",
    title: "Master Suites",
    subtitle: "Private Lake Terraces",
    description: "Every suite enjoys wide-open lake views, walk-in dressing rooms, dedicated balconies, and private en-suite marble bathrooms.",
    specs: ["Sunrise Dawn Balconies", "Custom Built-In Dressing Salons", "Dedicated En-Suite Marble Spas"],
    image: "/frames/frame_1400.jpg",
  },
  {
    id: "baths",
    metric: "8",
    unit: "BATHROOMS",
    title: "Designer Bathrooms",
    subtitle: "Volcanic Basalt & Stone",
    description: "Custom freestanding soaking tubs sculpted from Italian stone, oversized walk-in rain showers, and heated limestone flooring.",
    specs: ["Freestanding Basalt Soaking Tubs", "Dual Ceiling Rain Showers", "Heated Natural Stone Floors"],
    image: "/frames/frame_1900.jpg",
  },
  {
    id: "pool",
    metric: "25M",
    unit: "INFINITY",
    title: "Saline Infinity Pool",
    subtitle: "Cantilevered Over Lake",
    description: "A 25-meter heated saltwater infinity pool suspended over the valley, seamlessly joining the outdoor fire lounge and sun deck.",
    specs: ["25-Meter Heated Saltwater Pool", "Sunken Outdoor Fireplace Lounge", "Expansive Sunbathing Terrace"],
    image: "/frames/frame_2250.jpg",
  },
  {
    id: "vault",
    metric: "6",
    unit: "CARS",
    title: "Underground Garage",
    subtitle: "Private Showroom Vault",
    description: "A secure, climate-controlled subterranean auto gallery built into natural bedrock with display lighting and wine cellar access.",
    specs: ["Rotating Motorized Display Turntable", "Biometric Access & 24/7 Security", "Integrated 1,200-Bottle Wine Cellar"],
    image: "/frames/frame_0800.jpg",
  },
];

interface ExteriorView {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  highlight: string;
  description: string;
  features: string[];
}

const EXTERIOR_VIEWS: ExteriorView[] = [
  {
    id: "ext-1",
    title: "Front Facade & Water Fountains",
    subtitle: "Grand Arrival Walkway",
    image: "/frames/frame_0001.jpg",
    highlight: "Lakefront Promontory",
    description: "The main approach to the villa, framed by architectural stone walkways, tiered cascading fountains, and tropical landscape design.",
    features: [
      "Tiered cascading stone water fountains",
      "Handcrafted Roman travertine wall cladding",
      "Expansive floor-to-ceiling glass pavilions",
    ],
  },
  {
    id: "ext-2",
    title: "Travertine Portal & Entrance Canopy",
    subtitle: "Main House Architecture",
    image: "/frames/frame_0200.jpg",
    highlight: "Double-Height Architecture",
    description: "A monumental 4.5-meter wood and glass pivot door protected by a sleek architectural canopy with integrated warm halo lighting.",
    features: [
      "4.5-meter solid oak pivot entrance door",
      "Continuous architectural perimeter lighting",
      "Sculpted stone columns and upper balconies",
    ],
  },
  {
    id: "ext-3",
    title: "Infinity Pool & Sunset Terrace",
    subtitle: "Outdoor Lakeside Living",
    image: "/frames/frame_2250.jpg",
    highlight: "Panoramic Sunset View",
    description: "The rear entertainment terrace hovering directly over Lake Como, offering heated saltwater swimming and an intimate evening firepit.",
    features: [
      "25-meter heated saline reflection pool",
      "Sunken stone fireplace and lounge seating",
      "Frameless glass railings with unobstructed views",
    ],
  },
];

export default function ArchitectureSpecs() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);
  const exteriorCardsRef = useRef<(HTMLDivElement | null)[]>([]);
  const contactRef = useRef<HTMLDivElement | null>(null);

  const [copiedType, setCopiedType] = useState<string | null>(null);

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2500);
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      gsap.registerPlugin(ScrollTrigger);
    }

    const el = sectionRef.current;
    if (!el) return;

    const ctx = gsap.context(() => {
      // Metric Cards Smooth Reveal
      cardsRef.current.forEach((card, idx) => {
        if (!card) return;
        gsap.fromTo(
          card,
          {
            opacity: 0,
            y: 30,
          },
          {
            opacity: 1,
            y: 0,
            duration: 0.7,
            ease: "power2.out",
            delay: (idx % 3) * 0.1,
            scrollTrigger: {
              trigger: card,
              start: "top 88%",
              toggleActions: "play none none reverse",
            },
          }
        );
      });

      // 3 Exterior Cards Reveal
      exteriorCardsRef.current.forEach((card, idx) => {
        if (!card) return;
        gsap.fromTo(
          card,
          {
            opacity: 0,
            y: 35,
          },
          {
            opacity: 1,
            y: 0,
            duration: 0.8,
            ease: "power2.out",
            delay: idx * 0.12,
            scrollTrigger: {
              trigger: card,
              start: "top 85%",
              toggleActions: "play none none reverse",
            },
          }
        );
      });
    }, el);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="architecture"
      className="relative z-20 text-white py-20 sm:py-28 px-4 sm:px-8 md:px-14 lg:px-20 overflow-hidden"
    >
      {/* 1. Bright Luxury Ambient Background */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden select-none">
        <Image
          src="/frames/frame_0001.jpg"
          alt="Avijit Villa Sunlit Panoramic Exterior"
          fill
          sizes="100vw"
          className="object-cover opacity-40 filter brightness-110 contrast-105 scale-105"
        />
        {/* Warm Golden Daylight Scrim */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#16120b]/85 via-[#0e0a06]/80 to-[#140f08]/90" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-400/20 via-amber-500/10 to-transparent" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto flex flex-col gap-16 sm:gap-24">
        {/* 2. Header Showcase Section (Clean & Human-Designed) */}
        <div className="relative rounded-3xl bg-[#141009]/85 border border-amber-300/40 p-8 sm:p-12 md:p-14 shadow-2xl overflow-hidden backdrop-blur-xl">
          <div className="absolute -top-20 -right-20 w-[400px] h-[400px] bg-amber-400/20 rounded-full blur-3xl pointer-events-none" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Headline */}
            <div className="lg:col-span-7">
              <span className="inline-block text-xs uppercase tracking-[0.25em] text-amber-300 font-semibold font-body mb-3">
                Architectural Residence // Lake Como, Italy
              </span>

              <h2 className="font-display text-3xl sm:text-5xl md:text-6xl font-bold uppercase text-gold-gradient tracking-tight leading-[1.1] mb-5">
                Modern Luxury. <br />
                <span className="text-white">Timeless Architecture.</span>
              </h2>

              <p className="font-body text-base sm:text-lg text-[#e6ded0] font-light leading-relaxed max-w-xl mb-6">
                Situated across 2.5 acres on a private Lake Como promontory, Avijit Villa offers 16,500 square feet of crafted living space designed in complete harmony with natural stone, light, and water.
              </p>

              <div className="flex flex-wrap items-center gap-3 text-xs font-body text-amber-100 font-medium">
                <span className="px-3.5 py-1.5 rounded-full bg-black/50 border border-amber-300/30">
                  Lake Como, Lombardy, Italy
                </span>
                <span className="px-3.5 py-1.5 rounded-full bg-black/50 border border-amber-300/30">
                  300° Panoramic Lake View
                </span>
                <span className="px-3.5 py-1.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-300/40 font-semibold">
                  Owner &amp; Architect: Avijit Das
                </span>
              </div>
            </div>

            {/* Right Architectural Preview Card */}
            <div className="lg:col-span-5 relative rounded-2xl overflow-hidden border border-amber-300/35 bg-[#0c0905] p-2.5 shadow-xl">
              <div className="relative w-full aspect-[16/10] rounded-xl overflow-hidden bg-black">
                <Image
                  src="/frames/frame_0001.jpg"
                  alt="Avijit Villa Lakefront Estate"
                  fill
                  sizes="(max-width: 1024px) 100vw, 40vw"
                  className="object-cover hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-black/80 backdrop-blur-md border border-amber-300/40 text-[10px] uppercase font-body tracking-wider text-amber-200 font-medium">
                  Lakefront Estate View
                </div>
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs font-body text-white">
                  <span>Private Promontory</span>
                  <span className="text-amber-300 font-semibold">2.50 ACRES</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Core Property Specifications (Clean Human Design) */}
        <div>
          <div className="flex items-center justify-between mb-8 pb-3 border-b border-amber-300/25">
            <span className="text-xs uppercase tracking-[0.25em] font-body text-amber-200 font-semibold flex items-center gap-2">
              <span className="text-amber-400">●</span> Property Overview &amp; Key Details
            </span>
            <span className="text-xs font-body text-amber-200/80">
              Total Conditioned Living Space: 16,500 SQ FT
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {SPATIAL_METRICS.map((item, idx) => (
              <div
                key={item.id}
                ref={(el) => {
                  cardsRef.current[idx] = el;
                }}
                className="group relative rounded-3xl bg-[#120e08]/90 border border-amber-300/35 hover:border-amber-300/70 p-7 sm:p-8 shadow-xl transition-all duration-300 overflow-hidden flex flex-col justify-between backdrop-blur-xl"
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-center justify-between mb-5">
                    <span className="text-xs uppercase tracking-wider font-body text-amber-300/90 font-medium">
                      {item.subtitle}
                    </span>
                    <span className="w-2 h-2 rounded-full bg-amber-400/60" />
                  </div>

                  {/* Number & Unit */}
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="font-display text-4xl sm:text-5xl font-bold text-gold-gradient tracking-tight">
                      {item.metric}
                    </span>
                    <span className="font-body text-sm sm:text-base font-semibold text-amber-200 tracking-wider uppercase">
                      {item.unit}
                    </span>
                  </div>

                  <h3 className="font-display text-xl sm:text-2xl font-semibold text-white tracking-wide mb-3">
                    {item.title}
                  </h3>

                  <p className="font-body text-sm text-[#ded8cb] font-light leading-relaxed mb-6">
                    {item.description}
                  </p>
                </div>

                {/* Features List */}
                <div className="pt-4 border-t border-amber-300/20 flex flex-col gap-2">
                  {item.specs.map((spec, sIdx) => (
                    <div key={sIdx} className="flex items-center gap-2 text-xs text-[#cfc8bd] font-body">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                      <span>{spec}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 4. THREE GRAND 3D EXTERIOR HOUSE VIEW CARDS (Clean Human Layout) */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 pb-3 border-b border-amber-300/25">
            <div>
              <span className="text-xs uppercase tracking-[0.25em] font-body text-amber-300 font-semibold block mb-1">
                Visual Showcase
              </span>
              <h3 className="font-display text-2xl sm:text-4xl font-bold text-gold-gradient tracking-tight">
                Exterior Architecture &amp; Lake Views.
              </h3>
            </div>
            <span className="text-xs font-body text-amber-200/80">
              Lake Como, Italy • 3 Exterior Perspectives
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {EXTERIOR_VIEWS.map((view, idx) => (
              <div
                key={view.id}
                ref={(el) => {
                  exteriorCardsRef.current[idx] = el;
                }}
                className="group relative rounded-3xl overflow-hidden border border-amber-300/35 hover:border-amber-300/70 bg-[#120e08]/90 shadow-2xl transition-all duration-300 flex flex-col justify-between backdrop-blur-xl"
              >
                {/* Image Frame */}
                <div className="relative w-full aspect-[16/10] overflow-hidden bg-black">
                  <Image
                    src={view.image}
                    alt={view.title}
                    fill
                    sizes="(max-width: 1024px) 100vw, 33vw"
                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-105 opacity-95 group-hover:opacity-100"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#120e08] via-transparent to-black/30" />

                  {/* Badge */}
                  <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-black/80 backdrop-blur-md border border-amber-300/40 text-[10px] uppercase font-body tracking-wider text-amber-200 font-medium">
                    {view.highlight}
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-6 sm:p-7 flex flex-col justify-between flex-grow">
                  <div>
                    <span className="text-xs uppercase tracking-wider font-body text-amber-300 font-medium block mb-1">
                      {view.subtitle}
                    </span>
                    <h4 className="font-display text-xl sm:text-2xl font-bold text-white mb-3">
                      {view.title}
                    </h4>
                    <p className="font-body text-sm text-[#ded8cb] font-light leading-relaxed mb-5">
                      {view.description}
                    </p>

                    {/* Features List */}
                    <div className="space-y-2 pt-3 border-t border-amber-300/20 mb-3">
                      {view.features.map((feature, fIdx) => (
                        <div key={fIdx} className="flex items-center gap-2 text-xs text-[#cfc8bd] font-body">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 5. DIRECT OWNER CONTACT WITH AVIJIT DAS (Clean, Professional Human Executive Style) */}
        <div
          ref={contactRef}
          id="contact"
          className="relative rounded-3xl bg-gradient-to-br from-[#1c160c] via-[#120e08] to-[#0a0704] border-2 border-amber-300/50 p-8 sm:p-12 md:p-14 shadow-2xl overflow-hidden backdrop-blur-2xl"
        >
          <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-amber-400/15 rounded-full blur-3xl pointer-events-none" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Left: Owner Introduction */}
            <div className="lg:col-span-7">
              <span className="inline-block text-xs uppercase tracking-[0.25em] text-amber-300 font-semibold font-body mb-3">
                Direct Owner Inquiries
              </span>

              <h3 className="font-display text-3xl sm:text-5xl md:text-6xl font-bold uppercase text-gold-gradient tracking-tight leading-[1.08] mb-4">
                Connect With <br />
                <span className="text-white">Avijit Das</span>
              </h3>

              <p className="font-body text-base sm:text-lg text-[#e6ded0] font-light max-w-xl leading-relaxed mb-6">
                For private appointments, architectural walkthroughs, or acquisition inquiries regarding Avijit Villa, please feel free to get in touch directly.
              </p>

              <div className="flex flex-wrap items-center gap-3 text-xs font-body text-amber-100 font-medium">
                <span className="px-3.5 py-1.5 rounded-full bg-black/50 border border-amber-300/30">
                  Principal Owner &amp; Architect
                </span>
                <span className="px-3.5 py-1.5 rounded-full bg-black/50 border border-amber-300/30">
                  Avijit Villa, Lake Como
                </span>
              </div>
            </div>

            {/* Right: Direct Click Actions */}
            <div className="lg:col-span-5 flex flex-col gap-4">
              {/* Phone Card */}
              <div className="p-6 sm:p-7 rounded-2xl bg-[#0f0b06]/90 border border-amber-300/40 backdrop-blur-md shadow-xl flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase tracking-wider font-body text-amber-200 font-medium">
                    Phone &amp; WhatsApp
                  </span>
                  <button
                    onClick={() => handleCopy("9038904861", "phone")}
                    className="text-xs font-body text-amber-300 hover:text-white cursor-pointer"
                  >
                    {copiedType === "phone" ? "Copied!" : "Copy Number"}
                  </button>
                </div>

                <div className="font-display text-2xl sm:text-3xl font-bold text-white tracking-wider">
                  +91 9038904861
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <a
                    href="tel:+919038904861"
                    className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-400 to-amber-300 text-black font-semibold text-xs uppercase tracking-wider hover:brightness-110 active:scale-95 transition-all shadow-md"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <span>Direct Call</span>
                  </a>

                  <a
                    href="https://wa.me/919038904861?text=Hello%20Avijit,%20I%20am%20inquiring%20about%20Avijit%20Villa%20Lake%20Como."
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#25D366] hover:bg-[#20ba5a] text-black font-semibold text-xs uppercase tracking-wider active:scale-95 transition-all shadow-md"
                  >
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.664-.698c.99.539 1.831.799 2.796.799 3.179 0 5.766-2.587 5.768-5.766.001-3.182-2.585-5.786-5.768-5.786zm3.388 8.167c-.145.408-.838.777-1.163.826-.324.05-.747.07-2.316-.543-1.874-.733-3.078-2.648-3.171-2.772-.094-.124-.761-1.012-.761-1.929 0-.916.48-1.368.65-1.556.172-.187.375-.234.5-.234.125 0 .25.002.359.007.115.006.269-.044.421.323.158.381.542 1.32.589 1.417.048.096.08.209.016.335-.063.125-.094.204-.188.314-.094.11-.198.245-.282.33-.095.094-.194.197-.084.385.11.188.489.807 1.05 1.306.722.643 1.33.843 1.518.937.188.094.298.079.407-.047.11-.125.469-.546.594-.734.125-.187.25-.156.422-.094.172.063 1.094.516 1.282.609.188.094.313.141.36.219.046.078.046.453-.099.861z"/>
                    </svg>
                    <span>WhatsApp</span>
                  </a>
                </div>
              </div>

              {/* Email Card */}
              <div className="p-6 sm:p-7 rounded-2xl bg-[#0f0b06]/90 border border-amber-300/40 backdrop-blur-md shadow-xl flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase tracking-wider font-body text-amber-200 font-medium">
                    Email Address
                  </span>
                  <button
                    onClick={() => handleCopy("dasavijit427488@gmail.com", "email")}
                    className="text-xs font-body text-amber-300 hover:text-white cursor-pointer"
                  >
                    {copiedType === "email" ? "Copied!" : "Copy Email"}
                  </button>
                </div>

                <div className="font-display text-lg sm:text-xl font-semibold text-amber-200 break-all">
                  dasavijit427488@gmail.com
                </div>

                <a
                  href="mailto:dasavijit427488@gmail.com?subject=Private%20Viewing%20Inquiry%20-%20Avijit%20Villa"
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-amber-300/50 hover:border-amber-300 bg-amber-400/10 hover:bg-amber-400/20 text-white font-medium text-xs uppercase tracking-wider active:scale-95 transition-all shadow-sm mt-1"
                >
                  <svg className="w-4 h-4 text-amber-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span>Send Email</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
