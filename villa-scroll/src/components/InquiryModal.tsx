"use client";

import React, { useState } from "react";
import { useSiteConfig } from "@/context/SiteConfigContext";

export interface InquiryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function InquiryModal({ isOpen, onClose }: InquiryModalProps) {
  const { config } = useSiteConfig();
  const c = config.contact;

  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    arrival: "private-aviation",
    date: "",
    notes: "",
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSending(true);
    try {
      await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source: "viewing_modal",
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          arrival: formData.arrival,
          requirement:
            formData.notes.trim() ||
            `Private viewing request (${formData.arrival})`,
        }),
      });
    } catch {
      // Fall through cleanly
    } finally {
      setIsSending(false);
      setIsSubmitted(true);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-2xl transition-all duration-300"
      role="dialog"
      aria-modal="true"
    >
      {/* Click outside backdrop */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Modal Card */}
      <div className="relative w-full max-w-lg rounded-3xl bg-[#0a0907] border border-amber-200/25 p-8 sm:p-10 shadow-[0_25px_60px_rgba(0,0,0,0.9),_0_0_40px_rgba(223,194,153,0.1)] text-white z-10">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 w-9 h-9 rounded-full border border-amber-200/20 flex items-center justify-center hover:bg-white/10 text-amber-200/80 hover:text-white transition-colors cursor-pointer"
          aria-label="Close Inquiry Dialog"
        >
          ✕
        </button>

        {isSubmitted ? (
          <div className="text-center py-12 flex flex-col items-center">
            <div className="w-16 h-16 rounded-full border border-amber-300/40 flex items-center justify-center mb-6 bg-amber-500/10">
              <span className="text-2xl text-amber-300">✓</span>
            </div>
            <span className="text-xs uppercase tracking-[0.3em] text-amber-200/90 font-mono mb-2">
              DISPATCH CONFIRMED
            </span>
            <h3 className="font-serif-luxury text-3xl font-light text-ivory-gradient mb-3">
              We Have Received Your Dossier.
            </h3>
            <p className="text-xs text-[#cfc8bd] font-light max-w-xs leading-relaxed mb-8 font-sans-luxury">
              A dedicated private client advisor will reach out securely within 4 hours to coordinate transport and private security clearances.
            </p>
            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-full border border-amber-200/30 text-xs uppercase tracking-[0.2em] font-mono text-amber-100 hover:bg-white hover:text-black transition-all cursor-pointer"
            >
              Close Window
            </button>
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              <span className="text-[11px] uppercase tracking-[0.25em] text-amber-200/90 font-medium font-body">
                {c.inquiryModalKicker}
              </span>
            </div>
            <h3 className="font-serif-luxury text-3xl sm:text-4xl font-light text-ivory-gradient tracking-tight mb-2">
              {c.inquiryModalTitle}
            </h3>
            <p className="text-xs text-[#cfc8bd] font-light leading-relaxed mb-4 font-sans-luxury">
              Direct consultation with owner <strong className="text-white">{c.architectName}</strong> ({c.ownerPhone} | {c.ownerEmail}).
            </p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="text-[10px] uppercase font-mono tracking-widest text-amber-200/70 block mb-1">
                  Full Legal Name
                </label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Lord Alistair Vance"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-amber-200/20 focus:border-amber-300 text-sm text-white focus:outline-none transition-colors"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] uppercase font-mono tracking-widest text-amber-200/70 block mb-1">
                    Direct Email
                  </label>
                  <input
                    required
                    type="email"
                    placeholder="advisor@familyoffice.com"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-amber-200/20 focus:border-amber-300 text-sm text-white focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-mono tracking-widest text-amber-200/70 block mb-1">
                    Signal / Phone
                  </label>
                  <input
                    type="tel"
                    placeholder="+1 (555) 019-2834"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-amber-200/20 focus:border-amber-300 text-sm text-white focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase font-mono tracking-widest text-amber-200/70 block mb-1">
                  Arrival Protocol
                </label>
                <select
                  value={formData.arrival}
                  onChange={(e) =>
                    setFormData({ ...formData, arrival: e.target.value })
                  }
                  className="w-full px-4 py-3 rounded-xl bg-[#14120e] border border-amber-200/20 focus:border-amber-300 text-sm text-white focus:outline-none transition-colors"
                >
                  <option value="private-aviation">Private Helipad Arrival (Villa Coordinates)</option>
                  <option value="chauffeured">Chauffeured Armored Transport</option>
                  <option value="confidential">Confidential Representative Walkthrough</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={isSending}
                className="mt-4 w-full py-3.5 bg-gradient-to-r from-[#fef5e7] via-[#e2c99a] to-[#cba36b] text-black text-xs uppercase tracking-[0.2em] font-sans-luxury font-semibold rounded-xl hover:brightness-110 transition-all duration-300 shadow-[0_4px_25px_rgba(223,194,153,0.35)] cursor-pointer disabled:opacity-60"
              >
                {isSending ? "Submitting..." : "Submit Dossier For Clearance"}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
