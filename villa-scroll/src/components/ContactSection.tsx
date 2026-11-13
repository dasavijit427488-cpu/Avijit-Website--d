"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { getLenis } from "@/hooks/useLenis";
import { useSiteConfig } from "@/context/SiteConfigContext";
import { FONT_STACKS, getImageFramingStyle } from "@/lib/defaultSiteConfig";
import { getAnimationSpeedFactor, getMotionOffset } from "@/lib/animationHelpers";
import LuxuryPhotoFrame from "./LuxuryPhotoFrame";

const isDynamicSrc = (src: string) =>
  src.startsWith("/api/") || src.startsWith("http://") || src.startsWith("https://") || src.startsWith("data:");

export default function ContactSection() {
  const { config } = useSiteConfig();
  const c = config.contact;
  const brand = config.brand;
  const pageDesign = config.design?.pages?.contact;
  const pageFont = pageDesign?.pageFont ?? "inherit";
  const textAlign = pageDesign?.textAlign ?? "left";
  const alignClass =
    textAlign === "center"
      ? "text-center"
      : textAlign === "right"
        ? "text-right"
        : "text-left";

  const sectionRef = useRef<HTMLElement | null>(null);
  const headerRef = useRef<HTMLDivElement | null>(null);
  const advisoryGridRef = useRef<HTMLDivElement | null>(null);
  const formBlockRef = useRef<HTMLDivElement | null>(null);
  const locationBarRef = useRef<HTMLDivElement | null>(null);

  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [showLocationModal, setShowLocationModal] = useState<boolean>(false);
  const [showEmailSuccessModal, setShowEmailSuccessModal] = useState<boolean>(false);
  const [dpTilt, setDpTilt] = useState<{ rx: number; ry: number }>({ rx: 4, ry: -6 });
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Direct Client Requirement Form State
  const [customerName, setCustomerName] = useState<string>("");
  const [customerEmail, setCustomerEmail] = useState<string>("");
  const [customerRequirement, setCustomerRequirement] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submittedRelay, setSubmittedRelay] = useState<{
    name: string;
    email: string;
    requirement: string;
    emailDispatched: boolean;
    providerMessage?: string;
    whatsappUrl: string;
    mailtoUrl: string;
  } | null>(null);

  const notifyNotice = (msg: string) => {
    setToastMsg(msg);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => {
      setToastMsg(null);
    }, 3200);
  };

  const anim = config.design?.animation;

  useEffect(() => {
    if (typeof window !== "undefined") {
      gsap.registerPlugin(ScrollTrigger);
    }

    const el = sectionRef.current;
    if (el) {
      if (anim && !anim.enabled) {
        return () => {
          if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
        };
      }

      const spd = getAnimationSpeedFactor(anim);

      const ctx = gsap.context(() => {
        const replayTrigger = (triggerEl: Element | null) => ({
          trigger: triggerEl,
          start: "top 98%",
          toggleActions: "play none none reset",
        });

        const animEl = (
          target: gsap.TweenTarget,
          triggerEl: Element | null,
          defFrom: { x?: number; y?: number },
          dur: number
        ) => {
          const off = getMotionOffset(anim, defFrom);
          gsap.fromTo(
            target,
            { opacity: 0, x: off.x, y: off.y, scale: off.scale, force3D: true },
            {
              opacity: 1,
              x: 0,
              y: 0,
              scale: 1,
              force3D: true,
              duration: dur * spd,
              ease: "power2.out",
              scrollTrigger: replayTrigger(triggerEl),
            }
          );
        };

        if (headerRef.current) {
          Array.from(headerRef.current.children).forEach((child, idx) => {
            animEl(child, headerRef.current, { x: idx % 2 === 0 ? -52 : 52 }, 0.48);
          });
        }
        if (advisoryGridRef.current && advisoryGridRef.current.children.length >= 2) {
          animEl(advisoryGridRef.current.children[0], advisoryGridRef.current, { x: -56 }, 0.5);
          animEl(advisoryGridRef.current.children[1], advisoryGridRef.current, { x: 56 }, 0.5);
        }
        if (formBlockRef.current) {
          animEl(formBlockRef.current, formBlockRef.current, { x: -48 }, 0.5);
        }
        if (locationBarRef.current) {
          animEl(locationBarRef.current, locationBarRef.current, { x: 48 }, 0.48);
        }
      }, el);

      const t1 = setTimeout(() => ScrollTrigger.refresh(), 260);
      const t2 = setTimeout(() => ScrollTrigger.refresh(), 900);

      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        ctx.revert();
        if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      };
    }

    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, [anim?.enabled, anim?.speed, anim?.directionMode]);

  const handleInquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = customerName.trim();
    const email = customerEmail.trim();
    const requirement = customerRequirement.trim();

    if (!name || !email || !requirement) {
      notifyNotice("Please fill in your name, email, and requirement.");
      return;
    }

    setIsSubmitting(true);

    const cleanPhoneDigits = c.whatsappNumber.replace(/\D/g, "") || "919038904861";
    const formattedText = [
      `New Inquiry — ${brand.brandFirstLetter}${brand.brandMiddleText} ${brand.brandLastWord}`,
      `Name: ${name}`,
      `Email: ${email}`,
      `Requirement: ${requirement}`,
    ].join("\n");

    let emailDispatched = false;
    let providerMessage = "";
    let whatsappUrl = `https://wa.me/${cleanPhoneDigits}?text=${encodeURIComponent(formattedText)}`;
    let mailtoUrl = `mailto:${c.ownerEmail}?subject=${encodeURIComponent(
      `New Inquiry — ${name}`
    )}&body=${encodeURIComponent(formattedText)}`;

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source: "contact_form", name, email, requirement }),
      });

      if (res.ok) {
        const data = await res.json();
        emailDispatched = Boolean(data?.emailDispatched);
        if (data?.providerMessage) providerMessage = String(data.providerMessage);
        if (data?.whatsappUrl) whatsappUrl = data.whatsappUrl;
        if (data?.mailtoUrl) mailtoUrl = data.mailtoUrl;
      }
    } catch {
      providerMessage = "Offline fallback ready.";
    }

    setSubmittedRelay({
      name,
      email,
      requirement,
      emailDispatched,
      providerMessage,
      whatsappUrl,
      mailtoUrl,
    });
    setIsSubmitting(false);
    setShowEmailSuccessModal(true);
    notifyNotice("Your Message is Successfully Sent!");

    // Non-blocking browser relay if direct SMTP/Resend isn't configured yet on Vercel
    if (!emailDispatched && c.ownerEmail) {
      const isSameEmail = email.toLowerCase() === c.ownerEmail.toLowerCase();
      void fetch(
        `https://formsubmit.co/ajax/${encodeURIComponent(c.ownerEmail)}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            name,
            email,
            message: requirement,
            _subject: `New Inquiry — ${name}`,
            ...(!isSameEmail ? { _replyto: email } : {}),
            _template: "box",
            "Customer Name": name,
            "Customer Email": email,
            "Client Requirement": requirement,
          }),
        }
      )
        .then(async (fsRes) => {
          const fsJson = await fsRes.json().catch(() => null);
          if (fsRes.ok && (fsJson?.success === true || fsJson?.success === "true")) {
            setSubmittedRelay((prev) =>
              prev && prev.name === name && prev.email === email
                ? {
                    ...prev,
                    emailDispatched: true,
                    providerMessage: `Delivered directly to ${c.ownerEmail}.`,
                  }
                : prev
            );
          } else if (fsJson?.message) {
            setSubmittedRelay((prev) =>
              prev && prev.name === name && prev.email === email
                ? { ...prev, providerMessage: String(fsJson.message) }
                : prev
            );
          }
        })
        .catch(() => {
          // Keep Open in Gmail / WhatsApp buttons active
        });
    }
  };

  const copyToClipboard = (text: string, successMsg: string) => {
    navigator.clipboard
      .writeText(text)
      .then(() => notifyNotice(successMsg))
      .catch(() => notifyNotice("Copied: " + text));
  };

  const scrollToTop = () => {
    const lenis = getLenis();
    if (lenis) {
      lenis.scrollTo(0, { duration: 1.5 });
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <section
      ref={sectionRef}
      id="contact"
      className={`relative z-20 w-full bg-transparent text-[#1f1b15] overflow-hidden border-t border-[#c9a84c]/30 font-playfair ${
        pageFont !== "inherit" ? "section-custom-font" : ""
      } ${alignClass}`}
      style={
        pageFont !== "inherit"
          ? ({ "--section-font": FONT_STACKS[pageFont] } as React.CSSProperties)
          : undefined
      }
    >
      <div className="relative z-10 flex flex-col w-full">
        {/* 1. HERO MONOGRAPH HEADER SECTION */}
        <div className="w-full px-4 sm:px-6 md:px-20 pt-14 sm:pt-20 pb-8 sm:pb-12">
          <div ref={headerRef} className="max-w-7xl mx-auto flex flex-col gap-4 sm:gap-5">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-[11px] sm:text-xs text-[#8b6914]">
              <span className="inline-flex items-center gap-2 px-3 sm:px-3.5 py-1.5 rounded-full bg-white/80 backdrop-blur-md border border-[#c9a84c]/45 text-[#8b6914] uppercase tracking-widest font-semibold shadow-sm">
                <span className="w-2 h-2 rounded-full bg-[#c9a84c]" />
                {c.badgeText}
              </span>
              <span className="text-[#c9a84c]/60">&bull;</span>
              <span className="tracking-wider uppercase text-[#4a4236] font-medium">
                {c.residenceLabel}
              </span>
              <span className="text-[#c9a84c]/60 hidden xs:inline">&bull;</span>
              <span className="tracking-wider text-[#8b6914] font-semibold">
                {c.appointmentLabel}
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-end mt-1 sm:mt-2">
              <div className="lg:col-span-8 flex flex-col gap-3">
                <h2 className="text-3xl sm:text-5xl md:text-[62px] text-[#1c1812] leading-[1.12] tracking-tight font-medium">
                  {c.headingLine1} <br className="hidden sm:inline" />
                  <span className="text-[#8b6914] italic">{c.headingItalic}</span>
                </h2>
                <p className="text-base sm:text-[19px] text-[#4a4236] italic max-w-2xl leading-relaxed pl-3.5 sm:pl-4 border-l-2 border-[#c9a84c] py-1">
                  {c.introQuote}
                </p>
              </div>

              {/* Estate Summary Callout Bento */}
              <div className="lg:col-span-4 rounded-2xl p-5 sm:p-6 md:backdrop-blur-md bg-white/85 border border-[#c9a84c]/40 shadow-[0_18px_45px_rgba(140,110,45,0.12)] flex flex-col justify-between gap-4">
                <div className="flex items-center justify-between pb-2.5 border-b border-[#c9a84c]/25">
                  <span className="text-xs text-[#8b6914] uppercase tracking-widest font-semibold">
                    {c.estateSummaryTitle}
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] bg-[#faf6ed] text-[#8b6914] border border-[#c9a84c]/40 uppercase tracking-wider font-semibold">
                    {c.estateSummaryBadge}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs text-[#574e40]">
                  {c.estateSummaryMetrics.map((m, idx) => (
                    <div key={`${m.label}-${idx}`} className="p-3 rounded-xl bg-[#faf6ed] border border-[#c9a84c]/25">
                      <div className="text-[11px] text-[#6e6454] uppercase tracking-wider">{m.label}</div>
                      <div
                        className={`text-base mt-1 font-medium tracking-wide ${
                          idx === 0 || idx === 3 ? "text-[#8b6914]" : "text-[#1c1812]"
                        }`}
                      >
                        {m.value}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 2. PRIVATE OFFICE ADVISORY & CLEAN 4K ESTATE PHOTOGRAPH */}
        <div className="w-full px-4 sm:px-6 md:px-20 pb-10 sm:pb-14">
          <div ref={advisoryGridRef} className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-stretch">
            {/* Left Card: Private Office Advisory */}
            <div className="lg:col-span-6 rounded-2xl sm:rounded-3xl p-5 sm:p-9 md:backdrop-blur-md bg-white/85 border border-[#c9a84c]/40 shadow-[0_20px_50px_rgba(140,110,45,0.14)] flex flex-col justify-between gap-5 sm:gap-6">
              <div>
                <div className="flex items-center justify-between border-b border-[#c9a84c]/25 pb-3.5 sm:pb-4 mb-4 sm:mb-5">
                  <span className="text-xs text-[#8b6914] uppercase tracking-[0.18em] font-semibold flex items-center gap-2">
                    <svg className="w-4 h-4 text-[#8b6914]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M20 10v11M8 14v3M12 14v3M16 14v3" />
                    </svg>
                    {c.advisoryTitle}
                  </span>
                </div>

                {/* Principal Architect 3D Medallion Profile Avatar */}
                <div className="flex items-center gap-4 sm:gap-5 pb-2 sm:pb-3">
                  <div
                    onMouseMove={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const x = (e.clientX - rect.left) / rect.width - 0.5;
                      const y = (e.clientY - rect.top) / rect.height - 0.5;
                      setDpTilt({ rx: -y * 22, ry: x * 24 });
                    }}
                    onMouseLeave={() => setDpTilt({ rx: 4, ry: -6 })}
                    style={{ perspective: "750px" }}
                    className="relative w-20 h-20 sm:w-24 sm:h-24 shrink-0 cursor-pointer group"
                  >
                    <div
                      style={{
                        transformStyle: "preserve-3d",
                        transform: `rotateX(${dpTilt.rx}deg) rotateY(${dpTilt.ry}deg)`,
                        transition: "transform 0.25s ease-out",
                      }}
                      className="relative w-full h-full"
                    >
                      {/* Floating Metallic Gold Orbital Back Rim */}
                      <div
                        style={{ transform: "translateZ(-10px) scale(1.06)" }}
                        className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#7a5811] via-[#f2ca50] to-[#b58b28] opacity-85 shadow-[0_18px_36px_rgba(120,90,28,0.38)]"
                      />

                      {/* 3D Raised Gold Medallion Bezel */}
                      <div
                        style={{ transform: "translateZ(6px)" }}
                        className="relative w-full h-full rounded-full p-[3px] bg-gradient-to-br from-[#fff5cc] via-[#d4af37] to-[#6b4d0e] shadow-[0_14px_28px_rgba(0,0,0,0.28)]"
                      >
                        <div className="relative w-full h-full rounded-full overflow-hidden bg-[#1a150e]">
                          <Image
                            src={c.architectAvatarUrl || "/images/avijit-dp.jpg"}
                            alt={c.architectName}
                            fill
                            unoptimized={isDynamicSrc(c.architectAvatarUrl || "/images/avijit-dp.jpg")}
                            sizes="96px"
                            quality={95}
                            loading="lazy"
                            decoding="async"
                            style={getImageFramingStyle(config, "contact.avatar", 50, 20, 106)}
                            className="object-cover transition-transform duration-500 md:contrast-105 md:brightness-105"
                          />
                          {/* Subtle 3D Specular Glass Rim */}
                          <div
                            className="absolute inset-0 rounded-full pointer-events-none"
                            style={{
                              background:
                                "linear-gradient(135deg, rgba(255,255,255,0.26) 0%, rgba(255,255,255,0) 45%, rgba(0,0,0,0.2) 100%)",
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col">
                    <div className="text-xl sm:text-3xl font-medium text-[#1c1812] tracking-wide">
                      {c.architectName}
                    </div>
                    <div className="text-[11px] sm:text-xs text-[#8b6914] uppercase tracking-[0.16em] sm:tracking-[0.18em] font-medium mt-0.5 sm:mt-1">
                      {c.architectRole}
                    </div>
                    <div className="text-xs sm:text-sm text-[#574e40] mt-0.5">
                      {c.architectTagline}
                    </div>
                  </div>
                </div>
              </div>

              {/* Clean Responsive Contact Rows */}
              <div className="flex flex-col gap-3">
                {/* Email Now */}
                <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-1.5 sm:gap-3 py-3 sm:py-3.5 px-4 rounded-xl bg-[#faf6ed] hover:bg-[#f5ebd6] border border-[#c9a84c]/30 hover:border-[#b58b28] transition-all group">
                  <div className="flex items-center gap-2.5 sm:gap-3">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-[#8b6914] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <rect x="2" y="4" width="20" height="16" rx="2" />
                      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                    </svg>
                    <span className="text-sm sm:text-[17px] font-medium text-[#1c1812] tracking-wide">
                      Email Now
                    </span>
                  </div>
                  <a
                    href={`mailto:${c.ownerEmail}`}
                    onClick={() => notifyNotice(`Opening email client for ${c.ownerEmail}`)}
                    className="text-xs sm:text-[15px] text-[#8b6914] hover:text-[#574000] font-medium tracking-wide flex items-center gap-1.5 group-hover:underline break-all"
                  >
                    <span>{c.ownerEmail}</span>
                    <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="m22 2-7 20-4-9-9-4Z" />
                    </svg>
                  </a>
                </div>

                {/* Call Now */}
                <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-1.5 sm:gap-3 py-3 sm:py-3.5 px-4 rounded-xl bg-[#faf6ed] hover:bg-[#f5ebd6] border border-[#c9a84c]/30 hover:border-[#b58b28] transition-all group">
                  <div className="flex items-center gap-2.5 sm:gap-3">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-[#8b6914] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                    </svg>
                    <span className="text-sm sm:text-[17px] font-medium text-[#1c1812] tracking-wide">
                      Call Now
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <a
                      href={`tel:${c.ownerPhone.replace(/\s+/g, "")}`}
                      onClick={() => notifyNotice(`Dialing ${c.ownerPhone}...`)}
                      className="text-xs sm:text-[15px] text-[#1c1812] hover:text-[#8b6914] font-medium tracking-wide flex items-center gap-1.5"
                    >
                      <span>{c.ownerPhone}</span>
                    </a>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(c.ownerPhone, `Phone number ${c.ownerPhone} copied`)}
                      title="Copy Phone Number"
                      className="text-[#6e6454] hover:text-[#8b6914] p-1 cursor-pointer transition-colors"
                    >
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="9" y="9" width="13" height="13" rx="2" />
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Whatsapp Now */}
                <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-1.5 sm:gap-3 py-3 sm:py-3.5 px-4 rounded-xl bg-[#faf6ed] hover:bg-[#f5ebd6] border border-[#c9a84c]/30 hover:border-[#1f9d55] transition-all group">
                  <div className="flex items-center gap-2.5 sm:gap-3">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-[#1f9d55] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                    </svg>
                    <span className="text-sm sm:text-[17px] font-medium text-[#1c1812] tracking-wide">
                      Whatsapp Now
                    </span>
                  </div>
                  <a
                    href={`https://wa.me/${c.whatsappNumber.replace(/\D/g, "")}?text=${encodeURIComponent(c.whatsappPrefill)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs sm:text-[15px] text-[#15803d] hover:text-[#166534] font-medium tracking-wide flex items-center gap-1.5"
                  >
                    <span>{c.whatsappDisplay}</span>
                    <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14 21 3" />
                    </svg>
                  </a>
                </div>
              </div>
            </div>

            {/* Right Card: Pure 4K Estate Photograph */}
            <LuxuryPhotoFrame
              slotKey="contact.showcase"
              src={c.showcaseImage || "/images/house-view-2.jpg"}
              alt={c.showcaseAlt}
              sizes="(max-width: 1024px) 100vw, 50vw"
              outerClassName="lg:col-span-6 rounded-2xl sm:rounded-3xl min-h-[240px] sm:min-h-[360px]"
              innerHeightClass="h-full min-h-[224px] sm:min-h-[344px]"
            />
          </div>
        </div>

        {/* 2B. DIRECT CLIENT INQUIRY & REQUIREMENT FORM */}
        <div className="w-full px-4 sm:px-6 md:px-20 pb-10 sm:pb-14">
          <div
            ref={formBlockRef}
            className="max-w-7xl mx-auto rounded-2xl sm:rounded-3xl p-5 sm:p-10 md:backdrop-blur-md bg-white/88 border border-[#c9a84c]/45 shadow-[0_20px_50px_rgba(140,110,45,0.14)]"
          >
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 mb-7 border-b border-[#c9a84c]/25">
              <div>
                <span className="text-xs uppercase tracking-[0.22em] text-[#8b6914] font-semibold block mb-1.5">
                  {c.formKicker}
                </span>
                <h3 className="text-2xl sm:text-3xl font-medium text-[#1c1812]">
                  {c.formTitle}
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-[#574e40] max-w-md">
                {c.formSubtitle}{" "}
                <span className="text-[#8b6914] font-semibold">{c.ownerEmail}</span> &bull;{" "}
                <span className="text-[#15803d] font-semibold">{c.ownerPhone}</span>
              </p>
            </div>

            {submittedRelay ? (
              <div className="rounded-2xl bg-[#faf6ed] border border-[#c9a84c]/45 p-6 sm:p-8 flex flex-col gap-5">
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 rounded-full bg-gradient-to-r from-[#d4af37] to-[#f2ca50] text-[#2b2000] flex items-center justify-center shrink-0 shadow-md">
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-xl sm:text-2xl font-semibold text-[#1c1812]">
                      Thank you, {submittedRelay.name}
                    </h4>
                    <p className="text-sm text-[#574e40] mt-1 leading-relaxed">
                      Your message has been saved for {c.architectName} (
                      <span className="font-semibold text-[#8b6914]">{c.ownerEmail}</span>{" "}
                      &amp; <span className="font-semibold text-[#15803d]">{c.ownerPhone}</span>).{" "}
                      {submittedRelay.emailDispatched
                        ? "Email delivery request sent directly."
                        : "Use either instant button below or view in Admin Inbox."}
                    </p>
                  </div>
                </div>

                <div className="rounded-xl bg-white/90 border border-[#c9a84c]/30 p-4 text-sm text-[#3b342b] space-y-1">
                  <div>
                    <span className="font-semibold text-[#8b6914]">Name:</span> {submittedRelay.name}
                  </div>
                  <div>
                    <span className="font-semibold text-[#8b6914]">Email:</span> {submittedRelay.email}
                  </div>
                  <div>
                    <span className="font-semibold text-[#8b6914]">Requirement:</span>{" "}
                    {submittedRelay.requirement}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <a
                    href={submittedRelay.whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-5 py-3 rounded-xl bg-[#16a34a] hover:bg-[#15803d] text-white text-xs sm:text-sm font-semibold shadow-sm transition-all flex items-center gap-2"
                  >
                    <span>Send via WhatsApp ({c.ownerPhone})</span>
                  </a>
                  <a
                    href={submittedRelay.mailtoUrl}
                    className="px-5 py-3 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#f2ca50] hover:brightness-105 text-[#2b2000] text-xs sm:text-sm font-bold shadow-sm transition-all flex items-center gap-2"
                  >
                    <span>Send via Email ({c.ownerEmail})</span>
                  </a>
                  <button
                    type="button"
                    onClick={() => {
                      setSubmittedRelay(null);
                      setCustomerName("");
                      setCustomerEmail("");
                      setCustomerRequirement("");
                    }}
                    className="px-4 py-3 rounded-xl border border-[#c9a84c]/45 text-xs sm:text-sm text-[#574e40] hover:text-[#1c1812] cursor-pointer transition-colors"
                  >
                    Send Another Message
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleInquirySubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                  <label htmlFor="contact-customer-name" className="text-xs uppercase tracking-wider font-semibold text-[#8b6914]">
                    Your Name
                  </label>
                  <input
                    id="contact-customer-name"
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Enter your full name"
                    className="w-full px-4 py-3.5 rounded-xl bg-[#faf6ed] border border-[#c9a84c]/40 focus:border-[#8b6914] focus:bg-white focus:outline-none text-sm sm:text-base text-[#1c1812] placeholder-[#948977] transition-all"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="contact-customer-email" className="text-xs uppercase tracking-wider font-semibold text-[#8b6914]">
                    Your Email Address
                  </label>
                  <input
                    id="contact-customer-email"
                    type="email"
                    required
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full px-4 py-3.5 rounded-xl bg-[#faf6ed] border border-[#c9a84c]/40 focus:border-[#8b6914] focus:bg-white focus:outline-none text-sm sm:text-base text-[#1c1812] placeholder-[#948977] transition-all"
                  />
                </div>

                <div className="flex flex-col gap-2 md:col-span-2">
                  <label htmlFor="contact-customer-requirement" className="text-xs uppercase tracking-wider font-semibold text-[#8b6914]">
                    Your Requirement / Message
                  </label>
                  <textarea
                    id="contact-customer-requirement"
                    required
                    rows={4}
                    value={customerRequirement}
                    onChange={(e) => setCustomerRequirement(e.target.value)}
                    placeholder="Describe your inquiry, viewing request, or architectural requirements..."
                    className="w-full px-4 py-3.5 rounded-xl bg-[#faf6ed] border border-[#c9a84c]/40 focus:border-[#8b6914] focus:bg-white focus:outline-none text-sm sm:text-base text-[#1c1812] placeholder-[#948977] transition-all resize-y"
                  />
                </div>

                <div className="md:col-span-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
                  <span className="text-xs text-[#6e6454]">
                    Sent directly to {c.ownerEmail} &amp; {c.ownerPhone}
                  </span>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#f2ca50] hover:brightness-105 text-[#2b2000] text-xs sm:text-sm uppercase tracking-[0.18em] font-bold shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer disabled:opacity-60"
                  >
                    {isSubmitting ? "Sending Inquiry..." : "Submit Requirement →"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* 3. INTERACTIVE LOCATION ANCHOR STRIP */}
        <div className="w-full px-4 sm:px-6 md:px-20 pb-12 sm:pb-16">
          <div ref={locationBarRef} className="max-w-7xl mx-auto rounded-2xl p-5 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-5 sm:gap-6 md:backdrop-blur-md bg-white/85 border border-[#c9a84c]/40 shadow-[0_18px_45px_rgba(140,110,45,0.14)] hover:shadow-[0_24px_55px_rgba(140,110,45,0.2)] transition-shadow duration-500">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-[#faf6ed] border border-[#c9a84c]/50 text-[#8b6914] flex items-center justify-center shrink-0 shadow-sm">
                <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              </div>
              <div className="flex flex-col">
                <div className="text-2xl sm:text-[26px] text-[#1c1812] font-medium">
                  {c.cityTitle}
                </div>
                <div className="text-sm text-[#8b6914] tracking-wide font-medium mt-0.5">
                  {c.addressSubline}
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full md:w-auto justify-end">
              <div className="flex flex-col sm:text-right text-xs text-[#574e40]">
                <span className="text-[#8b6914] font-semibold">{c.addressShortRight1}</span>
                <span>{c.addressShortRight2}</span>
              </div>
              <button
                type="button"
                onClick={() => setShowLocationModal(true)}
                className="w-full sm:w-auto px-6 py-3.5 text-xs uppercase tracking-[0.18em] text-[#2b2000] bg-gradient-to-r from-[#d4af37] to-[#f2ca50] hover:brightness-105 rounded-xl font-bold shadow-md transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>View Address &amp; Map</span>
              </button>
            </div>
          </div>
        </div>

        {/* 4. LUXURY COMPACT FOOTER STRIP */}
        <footer className="w-full bg-white/80 md:backdrop-blur-md border-t border-[#c9a84c]/30 px-6 md:px-20 py-5">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-[#4a4236]">
            <div className="flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full bg-[#c9a84c]" />
              <span className="text-[#8b6914] font-semibold">
                {c.footerLocationText}
              </span>
            </div>

            <div className="hidden md:flex items-center gap-4 text-[#574e40] font-medium">
              <span>{c.architectName}</span>
              <span className="text-[#c9a84c]/60">&bull;</span>
              <span>{c.ownerPhone}</span>
              <span className="text-[#c9a84c]/60">&bull;</span>
              <span>{c.ownerEmail}</span>
            </div>

            <div className="flex items-center gap-3 sm:gap-4 flex-wrap justify-center">
              <button
                type="button"
                onClick={scrollToTop}
                className="text-xs text-[#8b6914] hover:text-[#1c1812] font-semibold cursor-pointer transition-colors"
              >
                Back to Top ↑
              </button>
              <span className="text-[#c9a84c]/60">&bull;</span>
              <span>{brand.copyrightText}</span>
              <span className="text-[#c9a84c]/60">&bull;</span>
              <Link
                href="/admin"
                prefetch={true}
                className="text-[11px] uppercase tracking-wider text-[#8b6914] hover:text-[#1c1812] font-semibold underline-offset-4 hover:underline transition-colors"
              >
                Admin Portal
              </Link>
            </div>
          </div>
        </footer>
      </div>

      {/* Interactive Toast Notification */}
      <div
        className={`fixed bottom-12 right-6 z-50 transition-all duration-300 pointer-events-none ${
          toastMsg ? "translate-y-0 opacity-100" : "translate-y-24 opacity-0"
        }`}
      >
        <div className="md:backdrop-blur-md bg-white/95 px-5 py-3 rounded-xl border border-[#c9a84c] text-[#8b6914] text-xs font-semibold flex items-center gap-3 shadow-xl">
          <span>{toastMsg}</span>
        </div>
      </div>

      {/* Redesigned Luxury Architectural Message Sent Popup Modal (Modern Font: Plus Jakarta Sans / font-tech) */}
      {showEmailSuccessModal && submittedRelay && (
        <div
          onClick={() => setShowEmailSuccessModal(false)}
          className="fixed inset-0 z-50 bg-black/65 backdrop-blur-md flex items-center justify-center p-4 font-tech"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-w-lg w-full rounded-[28px] overflow-hidden bg-[#fdfaf3] border border-[#c9a84c]/60 shadow-[0_32px_90px_rgba(0,0,0,0.48)] relative text-left"
          >
            {/* Dark Charcoal & Champagne Gold Top Banner */}
            <div className="relative bg-[#15120d] px-6 sm:px-8 pt-7 pb-6 border-b-2 border-[#d4af37] overflow-hidden">
              <div
                className="absolute -top-12 -right-12 w-40 h-40 rounded-full blur-2xl bg-[#d4af37]/20 pointer-events-none"
                aria-hidden="true"
              />
              <button
                type="button"
                aria-label="Close popup"
                onClick={() => setShowEmailSuccessModal(false)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-[#e8dfd0] flex items-center justify-center transition-colors cursor-pointer text-sm"
              >
                ✕
              </button>

              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-lg bg-gradient-to-br from-[#22c55e] to-[#15803d] text-white">
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>

                <div>
                  <span className="text-[10px] uppercase tracking-[0.26em] text-[#f2ca50] font-semibold block">
                    {brand.brandFirstLetter}{brand.brandMiddleText} {brand.brandLastWord} Concierge
                  </span>
                  <h4 className="text-xl sm:text-2xl font-bold text-[#fff9ee] tracking-tight mt-0.5">
                    Your Message is Successfully Sent!
                  </h4>
                </div>
              </div>
            </div>

            {/* Clean Modern Pearl Lower Body */}
            <div className="p-6 sm:p-8 space-y-5">
              <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs sm:text-sm font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                <span>
                  Your message has been delivered to{" "}
                  <strong className="font-bold">{c.ownerEmail}</strong>.
                </span>
              </div>

              {/* Customer Dossier Summary Grid */}
              <div className="rounded-2xl bg-white border border-[#e5d5aa] p-4 sm:p-5 space-y-3.5 shadow-sm">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-3 border-b border-[#efe3c4]">
                  <div>
                    <div className="text-[10px] uppercase tracking-[0.18em] text-[#8b6914] font-bold">
                      Client Name
                    </div>
                    <div className="text-sm font-semibold text-[#1c1812] mt-0.5">
                      {submittedRelay.name}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-[0.18em] text-[#8b6914] font-bold">
                      Reply-To Email
                    </div>
                    <div className="text-sm font-semibold text-[#1c1812] mt-0.5 break-all">
                      {submittedRelay.email}
                    </div>
                  </div>
                </div>

                <div className="border-l-2 border-[#c9a84c] pl-3.5">
                  <div className="text-[10px] uppercase tracking-[0.18em] text-[#8b6914] font-bold">
                    Requirement / Message
                  </div>
                  <p className="text-xs sm:text-sm text-[#3f372d] mt-1 leading-relaxed">
                    {submittedRelay.requirement}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
                {!submittedRelay.emailDispatched && (
                  <a
                    href={`https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(c.ownerEmail)}&su=${encodeURIComponent(`New Inquiry — ${submittedRelay.name}`)}&body=${encodeURIComponent(`Name: ${submittedRelay.name}\nEmail: ${submittedRelay.email}\n\nRequirement:\n${submittedRelay.requirement}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 px-4 py-3 rounded-xl bg-[#15120d] hover:bg-[#2a241b] text-[#f2ca50] text-xs font-bold uppercase tracking-wider text-center shadow-sm transition-all"
                  >
                    Open in Gmail
                  </a>
                )}
                <a
                  href={submittedRelay.whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 px-4 py-3 rounded-xl bg-[#16a34a] hover:bg-[#15803d] text-white text-xs font-bold uppercase tracking-wider text-center shadow-sm transition-all"
                >
                  WhatsApp ({c.ownerPhone})
                </a>
                <button
                  type="button"
                  onClick={() => setShowEmailSuccessModal(false)}
                  className="px-5 py-3 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#f2ca50] text-[#2b2000] text-xs font-bold uppercase tracking-wider shadow-sm cursor-pointer hover:brightness-105 transition-all"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Location Details Modal */}
      {showLocationModal && (
        <div
          onClick={() => setShowLocationModal(false)}
          className="fixed inset-0 z-50 bg-black/55 backdrop-blur-md flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-w-lg w-full rounded-2xl p-8 bg-white border border-[#c9a84c]/50 shadow-2xl relative"
          >
            <button
              type="button"
              onClick={() => setShowLocationModal(false)}
              className="absolute top-4 right-4 text-[#6e6454] hover:text-[#1c1812] transition-colors cursor-pointer text-xl"
            >
              ✕
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-[#faf6ed] border border-[#c9a84c]/50 text-[#8b6914] flex items-center justify-center">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              </div>
              <div>
                <h4 className="text-xl font-semibold text-[#1c1812]">{c.locationModalTitle}</h4>
                <p className="text-xs text-[#8b6914] uppercase tracking-wider font-semibold">
                  {c.cityTitle}
                </p>
              </div>
            </div>

            <div className="bg-[#faf6ed] p-4 rounded-xl border border-[#c9a84c]/35 text-sm text-[#1c1812] mb-6 leading-relaxed">
              <div className="font-bold text-[#8b6914] mb-1">Full Address:</div>
              {c.locationModalLines.map((line, i) => (
                <div key={i}>{line}</div>
              ))}
            </div>

            <div className="flex justify-end gap-3 text-xs">
              <button
                type="button"
                onClick={() => setShowLocationModal(false)}
                className="px-5 py-2.5 rounded-lg border border-[#c9a84c]/40 text-[#574e40] hover:text-[#1c1812] transition-colors uppercase cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  copyToClipboard(
                    c.locationModalLines.join(", "),
                    "Address copied to clipboard"
                  );
                  setShowLocationModal(false);
                }}
                className="px-5 py-2.5 rounded-lg bg-[#d4af37] text-[#2b2000] font-bold hover:bg-[#c29b27] transition-all uppercase cursor-pointer"
              >
                Copy Address
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
