"use client";

import { ArrowRight,CheckCircle2,Play,Shield,ShieldAlert } from "lucide-react";
import { useState } from "react";
import { SpaceBackground } from "./SpaceBackground";

export function Hero() {
  const [previewFilterMode, setPreviewFilterMode] = useState<"blur" | "monochrome" | "curtain">("blur");

  return (
    <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden bg-grid-subtle">
      {/* Outer Space Cosmos Animation */}
      <SpaceBackground />

      {/* Subtle radial ambient gradients (restrained, cool dark tone) */}
      <div
        className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-sky-950/20 blur-[140px] pointer-events-none rounded-full"
        aria-hidden="true"
      />
      <div
        className="absolute top-1/3 left-1/3 -translate-x-1/2 w-[400px] h-[250px] bg-teal-950/15 blur-[120px] pointer-events-none rounded-full"
        aria-hidden="true"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Editorial Text Hierarchy */}
        <div className="text-center max-w-3xl mx-auto space-y-6">
          {/* Eyebrow badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#262626] bg-[#141414]/90 text-[11px] font-mono tracking-wider text-[#a3a3a3] uppercase shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
            <span>INTRODUCING VISION GUARD</span>
            <span className="text-[#525252]">•</span>
            <span className="text-[#e5e5e5] normal-case tracking-normal font-sans">
              Chrome Extension for Photosensitive Safety
            </span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-semibold tracking-tight text-[#f5f5f5] leading-[1.08]">
            A safer way to <br className="hidden sm:inline" />
            <span className="bg-gradient-to-b from-[#ffffff] via-[#e5e5e5] to-[#a3a3a3] bg-clip-text text-transparent">
              experience video.
            </span>
          </h1>

          {/* Supporting Text */}
          <p className="text-base sm:text-lg md:text-xl text-[#a3a3a3] font-normal leading-relaxed max-w-2xl mx-auto">
            Vision Guard checks YouTube frames as you watch, keeping detected sudden changes covered while audio continues. Choose a pre-scan in the popup if you want hazard timestamps before watching.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <a
              href="/downloads/vision-guard-extension.zip"
              download="vision-guard-extension.zip"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3 text-sm font-medium text-[#090909] bg-[#f5f5f5] hover:bg-white rounded-lg shadow-[0_1px_2px_rgba(0,0,0,0.4),0_0_20px_rgba(255,255,255,0.15)] hover:shadow-[0_0_30px_rgba(56,189,248,0.25)] transition-all duration-200"
            >
              <span>Download Vision Guard for Chrome</span>
              <ArrowRight className="w-4 h-4 text-[#090909]" />
            </a>

            <a
              href="#interactive-demo"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-medium text-[#f5f5f5] bg-[#141414] hover:bg-[#1c1c1c] border border-[#262626] hover:border-[#38bdf8]/40 rounded-lg transition-all duration-200"
            >
              <Play className="w-3.5 h-3.5 text-sky-400 fill-sky-400" />
              <span>See How It Works</span>
            </a>
          </div>

          {/* Trust Specs Strip */}
          <div className="pt-6 flex flex-wrap items-center justify-center gap-y-2 gap-x-6 text-xs text-[#737373] font-mono">
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" />
              Zero Video Pauses
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" />
              100% On-Device & Private
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" />
              Experimental · Not medically validated
            </span>
          </div>
        </div>

        {/* Sophisticated Product Visualization (YouTube Video Player with Vision Guard HUD) */}
        <div className="mt-14 max-w-5xl mx-auto">
          <div className="relative rounded-2xl p-1 bg-gradient-to-b from-[#262626] via-[#1a1a1a] to-[#0d0d0d] shadow-[0_20px_70px_rgba(0,0,0,0.85)] hairline-border">
            {/* Top Browser / Player Titlebar */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-[#141414] rounded-t-xl border-b border-[#262626]/80 text-xs text-[#737373]">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#262626]" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#262626]" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#262626]" />
                <span className="ml-2 font-mono text-[11px] text-[#a3a3a3] hidden sm:inline">
                  youtube.com/watch?v=scenic_hyperlapse_4k
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#1c1c1c] border border-[#262626] text-[11px] text-sky-400 font-mono">
                  <Shield className="w-3 h-3 text-sky-400" />
                  <span>VISION GUARD SHIELD ENGAGED</span>
                </div>
              </div>
            </div>

            {/* Video Canvas Container */}
            <div className="relative aspect-[16/9] w-full bg-[#0a0a0a] overflow-hidden rounded-b-xl flex flex-col justify-between p-4 sm:p-6 select-none">
              {/* Background Simulated Video Scene (Cinematic architectural dusk aesthetic - completely safe & non-flashing) */}
              <div className="absolute inset-0 bg-gradient-to-br from-[#0f172a] via-[#090d16] to-[#050505]">
                {/* Simulated cinematic geometric visuals */}
                <div className="absolute inset-0 opacity-40 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px]" />

                {/* Safe ambient light sweeps simulating video landscape */}
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-900/20 rounded-full blur-3xl" />
                <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-teal-900/20 rounded-full blur-3xl" />

                {/* Simulated video frame art */}
                <div className="absolute inset-12 border border-white/5 rounded-lg flex items-center justify-center">
                  <div className="text-center space-y-2 opacity-60">
                    <p className="text-xs uppercase tracking-widest font-mono text-[#737373]">
                      Cinema Architecture • 4K 60FPS
                    </p>
                    <p className="text-sm font-medium text-[#a3a3a3]">
                      Sequence 04: Fast strobe lighting transitions detected
                    </p>
                  </div>
                </div>
              </div>

              {/* Protective Filter Layer Simulated in Real-Time */}
              <div
                className={`absolute inset-0 transition-all duration-300 pointer-events-none ${
                  previewFilterMode === "blur"
                    ? "backdrop-blur-xl bg-black/40"
                    : previewFilterMode === "monochrome"
                    ? "backdrop-grayscale backdrop-contrast-75 bg-black/50"
                    : "bg-black/90"
                }`}
              >
                {/* Protective HUD Status Banner */}
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                  <div className="max-w-md w-full bg-[#141414]/90 backdrop-blur-md border border-[#262626] rounded-xl p-5 shadow-2xl space-y-3 shield-pulse pointer-events-auto">
                    <div className="flex items-center justify-between border-b border-[#262626] pb-3">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-sky-500/10 border border-sky-500/30">
                          <ShieldAlert className="w-4 h-4 text-sky-400" />
                        </div>
                        <div className="text-left">
                          <p className="text-xs font-semibold text-[#f5f5f5]">
                            Protective Filter Active
                          </p>
                          <p className="text-[10px] text-[#a3a3a3] font-mono">
                            Timestamp: 01:24.08 — 01:29.40
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-300">
                        16.4 Hz Detected
                      </span>
                    </div>

                    <p className="text-xs text-[#a3a3a3] text-left leading-relaxed">
                      Static concept illustration with invented example timestamps. No video was analyzed for this demonstration.
                    </p>

                    <div className="flex items-center justify-between text-[11px] pt-1">
                      <div className="flex items-center gap-2 font-mono text-[#737373]">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        <span>Audio Unmuted</span>
                      </div>

                      {/* Filter mode switcher preview */}
                      <div className="flex items-center gap-1 bg-[#1c1c1c] p-1 rounded-md border border-[#262626]">
                        <button
                          onClick={() => setPreviewFilterMode("blur")}
                          className={`px-2 py-0.5 text-[10px] rounded transition-colors ${
                            previewFilterMode === "blur" ? "bg-sky-500 text-black font-semibold" : "text-[#a3a3a3] hover:text-white"
                          }`}
                        >
                          Blur
                        </button>
                        <button
                          onClick={() => setPreviewFilterMode("monochrome")}
                          className={`px-2 py-0.5 text-[10px] rounded transition-colors ${
                            previewFilterMode === "monochrome" ? "bg-sky-500 text-black font-semibold" : "text-[#a3a3a3] hover:text-white"
                          }`}
                        >
                          Mono
                        </button>
                        <button
                          onClick={() => setPreviewFilterMode("curtain")}
                          className={`px-2 py-0.5 text-[10px] rounded transition-colors ${
                            previewFilterMode === "curtain" ? "bg-sky-500 text-black font-semibold" : "text-[#a3a3a3] hover:text-white"
                          }`}
                        >
                          Dark
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Top Floating Player Bar */}
              <div className="relative z-10 flex items-center justify-between">
                <span className="text-xs font-medium text-white/90 drop-shadow">
                  Hyperlapse Nightwalk • Tokyo (Extended Cut)
                </span>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 rounded bg-[#090909]/80 backdrop-blur-sm border border-white/10 text-[10px] font-mono text-[#a3a3a3]">
                    ILLUSTRATION · NOT AN ANALYSIS RESULT
                  </span>
                </div>
              </div>

              {/* Bottom Player Timeline with Highlighted Hazard Segments */}
              <div className="relative z-10 space-y-2">
                {/* Timeline Progress Bar */}
                <div className="relative h-2 w-full bg-white/20 rounded-full overflow-hidden">
                  {/* Current progress */}
                  <div className="absolute top-0 bottom-0 left-0 w-[42%] bg-red-600 rounded-full" />

                  {/* Hazardous segment 1: 00:32 - 00:46 */}
                  <div
                    className="absolute top-0 bottom-0 left-[22%] w-[8%] bg-amber-400/80 border-x border-amber-300"
                    title="Hazardous Sequence Filtered (00:32 - 00:46)"
                  />

                  {/* Hazardous segment 2: 01:24 - 01:29 (Active now) */}
                  <div
                    className="absolute top-0 bottom-0 left-[38%] w-[10%] bg-sky-400 border-x border-white"
                    title="Active Filter Interval (01:24 - 01:29)"
                  />

                  {/* Hazardous segment 3: 02:40 - 02:52 */}
                  <div
                    className="absolute top-0 bottom-0 left-[75%] w-[9%] bg-amber-400/80 border-x border-amber-300"
                    title="Hazardous Sequence Filtered (02:40 - 02:52)"
                  />
                </div>

                {/* Controls and Hazard Legend */}
                <div className="flex items-center justify-between text-xs text-[#a3a3a3] pt-1">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-white text-[11px]">01:25 / 03:45</span>
                    <span className="text-white/40">•</span>
                    <span className="flex items-center gap-1.5 text-[11px] text-sky-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                      Protected Interval Active
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-[11px]">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-1.5 rounded-sm bg-amber-400" />
                      <span className="text-[#a3a3a3]">Flagged Strobe Zones (3)</span>
                    </span>
                    <span className="hidden sm:flex items-center gap-1.5">
                      <span className="w-2.5 h-1.5 rounded-sm bg-sky-400" />
                      <span className="text-white">Live Shield Position</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Under-player subtitle annotation */}
          <div className="mt-4 flex flex-col sm:flex-row items-center justify-between text-xs text-[#737373] px-2 font-mono gap-2">
            <span>FIGURE 1.0 — STATIC CONCEPT ILLUSTRATION</span>
            <span>ILLUSTRATIVE TIMESTAMPS · NO YOUTUBE ANALYSIS</span>
          </div>
        </div>
      </div>
    </section>
  );
}
