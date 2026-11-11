"use client";

import React, { useState, useRef, useEffect } from "react";

export default function AudioAtmosphere() {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const oscillatorsRef = useRef<OscillatorNode[]>([]);

  const startAtmosphere = () => {
    try {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      const ctx = new AudioContextClass();
      audioCtxRef.current = ctx;

      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0, ctx.currentTime);
      masterGain.gain.linearRampToValueAtTime(0.06, ctx.currentTime + 3);
      gainNodeRef.current = masterGain;

      // Filter for warm, deep ambient texture
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(280, ctx.currentTime);

      masterGain.connect(filter);
      filter.connect(ctx.destination);

      // Harmonious warm drone frequencies (C2, G2, E3)
      const freqs = [65.41, 98.0, 164.81];
      const oscs: OscillatorNode[] = [];

      freqs.forEach((f) => {
        const osc = ctx.createOscillator();
        osc.type = "sine";
        osc.frequency.setValueAtTime(f, ctx.currentTime);
        osc.connect(masterGain);
        osc.start();
        oscs.push(osc);
      });

      oscillatorsRef.current = oscs;
      setIsPlaying(true);
    } catch {
      // AudioContext policy: requires user gesture
    }
  };

  const stopAtmosphere = () => {
    if (!gainNodeRef.current || !audioCtxRef.current) return;
    const ctx = audioCtxRef.current;
    gainNodeRef.current.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.5);

    setTimeout(() => {
      oscillatorsRef.current.forEach((osc) => {
        try {
          osc.stop();
          osc.disconnect();
        } catch {}
      });
      oscillatorsRef.current = [];
      try {
        ctx.close();
      } catch {}
      audioCtxRef.current = null;
      gainNodeRef.current = null;
      setIsPlaying(false);
    }, 1500);
  };

  const toggleSound = () => {
    if (isPlaying) {
      stopAtmosphere();
    } else {
      startAtmosphere();
    }
  };

  useEffect(() => {
    return () => {
      stopAtmosphere();
    };
  }, []);

  return (
    <div className="fixed bottom-8 right-8 z-40 pointer-events-auto select-none">
      <button
        onClick={toggleSound}
        className="group flex items-center gap-2.5 px-4 py-2 rounded-full bg-[#0c0a08]/80 hover:bg-[#14120e] backdrop-blur-xl border border-amber-200/20 hover:border-amber-200/40 text-xs text-amber-100/90 transition-all duration-300 shadow-[0_10px_25px_rgba(0,0,0,0.8),_0_0_15px_rgba(223,194,153,0.08)] cursor-pointer"
        aria-label={isPlaying ? "Mute ambient atmosphere" : "Play ambient atmosphere"}
      >
        {/* Animated Soundwave bars in warm champagne gold */}
        <div className="flex items-center gap-0.5 h-3">
          <span
            className={`w-[2px] bg-amber-300 rounded-full transition-all duration-300 ${
              isPlaying ? "h-3 animate-pulse" : "h-1 bg-amber-200/30"
            }`}
          />
          <span
            className={`w-[2px] bg-amber-300 rounded-full transition-all duration-300 ${
              isPlaying
                ? "h-2 animate-pulse [animation-delay:150ms]"
                : "h-1 bg-amber-200/30"
            }`}
          />
          <span
            className={`w-[2px] bg-amber-300 rounded-full transition-all duration-300 ${
              isPlaying
                ? "h-3.5 animate-pulse [animation-delay:300ms]"
                : "h-1 bg-amber-200/30"
            }`}
          />
          <span
            className={`w-[2px] bg-amber-300 rounded-full transition-all duration-300 ${
              isPlaying
                ? "h-2 animate-pulse [animation-delay:450ms]"
                : "h-1 bg-amber-200/30"
            }`}
          />
        </div>

        <span className="text-[10px] uppercase font-mono tracking-[0.2em] text-amber-200/80 group-hover:text-amber-100 transition-colors">
          {isPlaying ? "ATMOSPHERE ON" : "ATMOSPHERE"}
        </span>
      </button>
    </div>
  );
}
