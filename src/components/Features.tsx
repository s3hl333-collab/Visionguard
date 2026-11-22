"use client";

import {
BatteryCharging,
Clock,
Lock,
ShieldCheck,
Sliders,
Zap
} from "lucide-react";

export function Features() {
  return (
    <section id="features" className="py-24 md:py-32 bg-[#090909] border-t border-[#1c1c1c] relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-3xl space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#262626] bg-[#141414] text-xs font-mono text-[#a3a3a3]">
            <span>CORE CAPABILITIES</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-semibold tracking-tight text-[#f5f5f5]">
            Designed to protect. <br />
            <span className="text-[#a3a3a3]">Built to disappear.</span>
          </h2>

          <p className="text-base sm:text-lg text-[#a3a3a3] leading-relaxed">
            Every component of Vision Guard is tuned for speed, accuracy, and sensory discretion—protecting your neurological comfort without breaking the immersion of what you are watching.
          </p>
        </div>

        {/* Asymmetric Editorial Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
          {/* Card 1: Proactive Detection (Large span 7/12) */}
          <div className="md:col-span-7 rounded-2xl bg-[#121212] border border-[#262626] p-7 flex flex-col justify-between hover:border-[#38bdf8]/30 transition-all duration-300 group">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#1a1a1a] border border-[#262626] flex items-center justify-center text-sky-400 group-hover:scale-105 transition-transform">
                <Zap className="w-5 h-5" />
              </div>

              <div className="space-y-1">
                <span className="text-xs font-mono text-[#737373] uppercase tracking-wider">
                  01 / PREDICTIVE CACHE
                </span>
                <h3 className="text-xl font-semibold text-[#f5f5f5]">
                  Proactive Detection
                </h3>
              </div>

              <p className="text-sm text-[#a3a3a3] leading-relaxed max-w-xl">
                Identify potential visual hazards ahead of playback where technically supported. By evaluating pre-buffered video segments before they reach the viewport, Vision Guard prepares defensive filters milliseconds before dangerous frames render.
              </p>
            </div>

            {/* Micro-visualization */}
            <div className="mt-6 pt-4 border-t border-[#1f1f1f] flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs font-mono text-[#737373]">
                <span>BUFFER LOOKAHEAD</span>
                <span className="text-sky-400">+2.5s PRE-SCANNED</span>
              </div>
              <div className="h-2 w-full bg-[#1c1c1c] rounded-full overflow-hidden flex">
                <div className="w-[45%] bg-sky-500" />
                <div className="w-[30%] bg-sky-400/30" />
                <div className="w-[25%] bg-[#262626]" />
              </div>
            </div>
          </div>

          {/* Card 2: Seamless Playback (Span 5/12) */}
          <div className="md:col-span-5 rounded-2xl bg-[#121212] border border-[#262626] p-7 flex flex-col justify-between hover:border-[#38bdf8]/30 transition-all duration-300 group">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#1a1a1a] border border-[#262626] flex items-center justify-center text-teal-400 group-hover:scale-105 transition-transform">
                <ShieldCheck className="w-5 h-5" />
              </div>

              <div className="space-y-1">
                <span className="text-xs font-mono text-[#737373] uppercase tracking-wider">
                  02 / CONTINUOUS STREAM
                </span>
                <h3 className="text-xl font-semibold text-[#f5f5f5]">
                  Seamless Playback
                </h3>
              </div>

              <p className="text-sm text-[#a3a3a3] leading-relaxed">
                Keep video and audio running while protective filtering is applied. No jarring pauses, no broken playback sync, and no missing lines in dialogues or podcasts.
              </p>
            </div>

            {/* Micro-metric */}
            <div className="mt-6 pt-4 border-t border-[#1f1f1f] flex items-center justify-between text-xs font-mono">
              <span className="text-[#737373]">Playback Pauses:</span>
              <span className="text-emerald-400 font-semibold">0 Pauses (Smooth)</span>
            </div>
          </div>

          {/* Card 3: Timestamp Precision (Span 4/12) */}
          <div className="md:col-span-4 rounded-2xl bg-[#121212] border border-[#262626] p-7 flex flex-col justify-between hover:border-[#38bdf8]/30 transition-all duration-300 group">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#1a1a1a] border border-[#262626] flex items-center justify-center text-sky-400 group-hover:scale-105 transition-transform">
                <Clock className="w-5 h-5" />
              </div>

              <div className="space-y-1">
                <span className="text-xs font-mono text-[#737373] uppercase tracking-wider">
                  03 / SURGICAL ACCURACY
                </span>
                <h3 className="text-xl font-semibold text-[#f5f5f5]">
                  Timestamp Precision
                </h3>
              </div>

              <p className="text-sm text-[#a3a3a3] leading-relaxed">
                Target identified hazardous intervals instead of obscuring an entire video. The moment the detected interval ends, filtering lifts instantaneously subject to browser rendering delays.
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-[#1f1f1f] text-xs font-mono text-[#737373]">
              Accuracy: <span className="text-white">±16.6ms (Single Frame)</span>
            </div>
          </div>

          {/* Card 4: Adaptive Visual Protection (Span 4/12) */}
          <div className="md:col-span-4 rounded-2xl bg-[#121212] border border-[#262626] p-7 flex flex-col justify-between hover:border-[#38bdf8]/30 transition-all duration-300 group">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#1a1a1a] border border-[#262626] flex items-center justify-center text-teal-400 group-hover:scale-105 transition-transform">
                <Sliders className="w-5 h-5" />
              </div>

              <div className="space-y-1">
                <span className="text-xs font-mono text-[#737373] uppercase tracking-wider">
                  04 / MODULAR FILTERS
                </span>
                <h3 className="text-xl font-semibold text-[#f5f5f5]">
                  Adaptive Visual Protection
                </h3>
              </div>

              <p className="text-sm text-[#a3a3a3] leading-relaxed">
                Support stable protective overlays and experimental blur-based filtering. Choose between soft Gaussian diffusion, luminance desaturation, or opaque obsidian curtains.
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-[#1f1f1f] text-xs font-mono text-[#737373] flex items-center justify-between">
              <span>Styles Available:</span>
              <span className="text-white">3 Distinct Modes</span>
            </div>
          </div>

          {/* Card 5: Privacy First (Span 4/12) */}
          <div className="md:col-span-4 rounded-2xl bg-[#121212] border border-[#262626] p-7 flex flex-col justify-between hover:border-[#38bdf8]/30 transition-all duration-300 group">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#1a1a1a] border border-[#262626] flex items-center justify-center text-sky-400 group-hover:scale-105 transition-transform">
                <Lock className="w-5 h-5" />
              </div>

              <div className="space-y-1">
                <span className="text-xs font-mono text-[#737373] uppercase tracking-wider">
                  05 / ZERO DATA COLLECTION
                </span>
                <h3 className="text-xl font-semibold text-[#f5f5f5]">
                  Privacy First
                </h3>
              </div>

              <p className="text-sm text-[#a3a3a3] leading-relaxed">
                Designed around client-side execution. No video frames, viewing histories, YouTube tokens, or user analytics ever leave your machine. Ever.
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-[#1f1f1f] text-xs font-mono text-[#737373] flex items-center justify-between">
              <span>Cloud Telemetry:</span>
              <span className="text-emerald-400">0 KB Uploaded</span>
            </div>
          </div>

          {/* Card 6: Lightweight WebAssembly Architecture (Full span banner 12/12) */}
          <div className="md:col-span-12 rounded-2xl bg-gradient-to-r from-[#141414] via-[#161616] to-[#141414] border border-[#262626] p-7 hover:border-[#38bdf8]/30 transition-all duration-300">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="space-y-2 max-w-2xl">
                <div className="inline-flex items-center gap-2 text-xs font-mono text-sky-400">
                  <BatteryCharging className="w-4 h-4" />
                  <span>ENERGY & PERFORMANCE OPTIMIZATION</span>
                </div>
                <h3 className="text-xl font-semibold text-[#f5f5f5]">
                  Negligible CPU & Battery Impact
                </h3>
                <p className="text-sm text-[#a3a3a3] leading-relaxed">
                  Engineered with WebAssembly and hardware-level CSS compositor pipelines. Memory consumption stays under 18MB, allowing you to watch hours of 4K content on laptop battery without thermal throttling.
                </p>
              </div>

              <div className="flex items-center gap-6 font-mono text-xs">
                <div className="p-3 rounded-xl bg-[#0e0e0e] border border-[#262626] space-y-0.5">
                  <p className="text-[#737373]">Avg Frame Time</p>
                  <p className="text-base font-semibold text-white">0.42 ms</p>
                </div>
                <div className="p-3 rounded-xl bg-[#0e0e0e] border border-[#262626] space-y-0.5">
                  <p className="text-[#737373]">RAM Footprint</p>
                  <p className="text-base font-semibold text-white">&lt; 18 MB</p>
                </div>
                <div className="p-3 rounded-xl bg-[#0e0e0e] border border-[#262626] space-y-0.5">
                  <p className="text-[#737373]">Browser Extension</p>
                  <p className="text-base font-semibold text-teal-400">Manifest V3</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
