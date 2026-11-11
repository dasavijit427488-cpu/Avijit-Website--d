"use client";

import React from "react";
import { getLenis } from "@/hooks/useLenis";

export interface FooterSectionProps {
  onOpenInquire: () => void;
}

export default function FooterSection({ onOpenInquire }: FooterSectionProps) {
  const scrollToTop = () => {
    const lenis = getLenis();
    if (lenis) {
      lenis.scrollTo(0, { duration: 1.5 });
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <footer
      id="contact"
      className="relative z-20 bg-[#080705] text-white pt-20 pb-14 px-6 sm:px-12 md:px-20 border-t border-amber-300/20 select-none"
    >
      <div className="max-w-6xl mx-auto flex flex-col gap-16">
        {/* Top Call to Action Banner */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8 p-8 sm:p-12 rounded-3xl bg-[#110e09]/95 border border-amber-300/30 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-amber-400/[0.06] rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span className="text-xs uppercase tracking-[0.22em] text-amber-300 font-semibold font-body">
                Private Viewing &amp; Direct Inquiries
              </span>
            </div>
            <h2 className="font-display text-2xl sm:text-4xl md:text-5xl font-bold tracking-[0.04em] uppercase text-gold-gradient max-w-lg mb-2">
              Connect With Avijit Das.
            </h2>
            <p className="font-body text-sm text-[#d4cebf] font-light">
              Direct phone: <span className="text-white font-medium">+91 9038904861</span> &bull; Email: <span className="text-white font-medium">dasavijit427488@gmail.com</span>
            </p>
          </div>

          <div className="relative z-10 flex flex-wrap items-center gap-3 shrink-0">
            <a
              href="tel:+919038904861"
              className="px-6 py-3.5 rounded-full bg-gradient-to-r from-amber-400 to-amber-300 text-black font-body uppercase tracking-wider text-xs font-semibold hover:brightness-110 transition-all shadow-lg"
            >
              Call 9038904861
            </a>
            <a
              href="https://wa.me/919038904861?text=Hello%20Avijit,%20I%20am%20interested%20in%20Avijit%20Villa."
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3.5 rounded-full bg-[#25D366] hover:bg-[#20ba5a] text-black font-body uppercase tracking-wider text-xs font-semibold transition-all shadow-lg"
            >
              WhatsApp
            </a>
            <button
              onClick={onOpenInquire}
              className="px-6 py-3.5 rounded-full border border-amber-300/50 hover:border-amber-300 text-amber-200 hover:text-white font-body uppercase tracking-wider text-xs font-semibold transition-all cursor-pointer"
            >
              Send Message
            </button>
          </div>
        </div>

        {/* Clean Human Footer Columns */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 border-b border-white/10 pb-12 text-xs font-light">
          {/* Col 1: Location */}
          <div>
            <div className="text-xs uppercase font-body tracking-[0.2em] text-amber-300/85 font-semibold mb-3">
              Location
            </div>
            <p className="text-[#cfc8bd] font-body text-xs leading-relaxed">
              Avijit Villa Promontory<br />
              Lake Como, Lombardy, Italy
            </p>
          </div>

          {/* Col 2: Property Summary */}
          <div>
            <div className="text-xs uppercase font-body tracking-[0.2em] text-amber-300/85 font-semibold mb-3">
              The Residence
            </div>
            <p className="text-[#cfc8bd] font-body text-xs leading-relaxed">
              2.50 Acres Private Estate<br />
              16,500 Sq Ft Living Space<br />
              7 Master Suites &bull; 8 Bathrooms
            </p>
          </div>

          {/* Col 3: Direct Contact */}
          <div>
            <div className="text-xs uppercase font-body tracking-[0.2em] text-amber-300/85 font-semibold mb-3">
              Direct Owner
            </div>
            <p className="text-[#cfc8bd] font-body text-xs leading-relaxed">
              <span className="text-white font-medium">Avijit Das</span><br />
              <a href="mailto:dasavijit427488@gmail.com" className="hover:text-amber-200 transition-colors">
                dasavijit427488@gmail.com
              </a>
              <br />
              <a href="tel:+919038904861" className="hover:text-amber-200 transition-colors">
                +91 9038904861
              </a>
            </p>
          </div>

          {/* Col 4: Back to Top */}
          <div className="flex flex-col items-start md:items-end justify-between">
            <div className="text-xs uppercase font-body tracking-[0.2em] text-amber-300/85 font-semibold mb-3">
              Navigation
            </div>
            <button
              onClick={scrollToTop}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-amber-300/35 hover:border-amber-300 text-xs font-body uppercase tracking-wider text-amber-200 hover:text-white transition-all cursor-pointer"
            >
              <span>Back to Top</span>
              <span>↑</span>
            </button>
          </div>
        </div>

        {/* Clean Copyright */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500 font-body">
          <span>&copy; 2026 Avijit Villa. All rights reserved.</span>
          <span>Designed &amp; Owned by Avijit Das</span>
        </div>
      </div>
    </footer>
  );
}
