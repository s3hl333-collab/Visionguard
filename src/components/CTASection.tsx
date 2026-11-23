"use client";

import { Play,ShieldCheck } from "lucide-react";
import { ChromeIcon } from "./Icons";

export function CTASection() {
  return (
    <section id="install" className="py-24 md:py-32 bg-[#090909] relative border-t border-[#1c1c1c]">
      {/* Background radial highlight */}
      <div
        className="absolute bottom-1/2 left-1/2 -translate-x-1/2 translate-y-1/2 w-[600px] h-[300px] bg-sky-950/20 blur-[140px] pointer-events-none rounded-full"
        aria-hidden="true"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="rounded-3xl bg-gradient-to-b from-[#141414] to-[#0e0e0e] border border-[#262626] p-8 sm:p-12 md:p-16 text-center max-w-4xl mx-auto space-y-8 shadow-[0_20px_60px_rgba(0,0,0,0.8)]">
          {/* Eyebrow */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#262626] bg-[#1a1a1a] text-xs font-mono text-[#a3a3a3]">
            <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
            <span>FREE ASSISTIVE EXTENSION FOR CHROMIUM BROWSERS</span>
          </div>

          {/* Headline */}
          <div className="space-y-3">
            <h2 className="text-3xl sm:text-5xl font-semibold tracking-tight text-[#f5f5f5]">
              Experience video without apprehension.
            </h2>
            <p className="text-base sm:text-lg text-[#a3a3a3] max-w-xl mx-auto leading-relaxed">
              Start watching with frame inspection enabled. You can also pre-scan 12-second sections or the whole video for timestamp-based replay.
            </p>
          </div>

          {/* Primary Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <a
              href="/downloads/vision-guard-extension.zip"
              download="vision-guard-extension.zip"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-medium text-[#090909] bg-[#f5f5f5] hover:bg-white rounded-xl shadow-[0_0_30px_rgba(56,189,248,0.25)] transition-all duration-200"
            >
              <ChromeIcon className="w-4 h-4 text-[#090909]" />
              <span>Download Vision Guard for Chrome</span>
            </a>

            <a
              href="#interactive-demo"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-medium text-white bg-[#1a1a1a] hover:bg-[#222222] border border-[#262626] hover:border-[#38bdf8]/40 rounded-xl transition-all duration-200"
            >
              <Play className="w-3.5 h-3.5 text-sky-400 fill-sky-400" />
              <span>Test Interactive Simulator</span>
            </a>
          </div>

          <p className="text-sm text-[#a3a3a3]">Version 0.3.6 · Experimental developer-mode installation. Extract the ZIP, open chrome://extensions, enable Developer Mode, choose Load unpacked, and select the extracted folder. When updating, replace the old files, click Reload on the extension card, then reload your YouTube tab. This is not a Chrome Web Store installation.</p>
          <p className="text-sm text-amber-200">Assistive tool, not a medically validated seizure-prevention device. Sampled analysis can miss hazards. Unanalyzed content is not known to be safe. Blur may leave flashes visible.</p>
          {/* Browser Support Pills */}
          <div className="pt-6 border-t border-[#1f1f1f] flex flex-wrap items-center justify-center gap-3 text-xs text-[#737373] font-mono">
            <span>Supports Chromium Browsers:</span>
            <span className="px-2.5 py-1 rounded bg-[#111111] border border-[#262626] text-[#a3a3a3]">
              Google Chrome
            </span>
            <span className="px-2.5 py-1 rounded bg-[#111111] border border-[#262626] text-[#a3a3a3]">
              Microsoft Edge
            </span>
            <span className="px-2.5 py-1 rounded bg-[#111111] border border-[#262626] text-[#a3a3a3]">
              Brave
            </span>
            <span className="px-2.5 py-1 rounded bg-[#111111] border border-[#262626] text-[#a3a3a3]">
              Arc
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
