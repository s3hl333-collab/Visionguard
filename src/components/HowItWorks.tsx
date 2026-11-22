"use client";

import { Cpu } from "lucide-react";
import { useState } from "react";

export function HowItWorks() {
  const [activeStep, setActiveStep] = useState<number>(1);

  const steps = [
    {
      num: "01",
      title: "Analyze",
      subtitle: "Frame Ingestion & Luminance Extraction",
      description:
        "Vision Guard examines accessible video frames for potentially hazardous flashing patterns.",
      details:
        "A hidden video element seeks through a local file at 60 samples per second. Canvas pixels are analyzed locally before playback. Scanning may be slow and can miss brief events.",
      badge: "Local Canvas sampling",
      specs: [
        { label: "Sample Resolution", val: "Downscaled 96×54; detail can be lost" },
        { label: "Sampling Rate", val: "60 seeks per second of source duration" },
        { label: "Data Transmission", val: "0 bytes sent over network (100% on-device)" },
      ],
      codeSnippet: `// 1. Frame Sampling Pipeline
const sampleFrame = (videoElement) => {
  offscreenCtx.drawImage(videoElement, 0, 0, 160, 90);
  const { data } = offscreenCtx.getImageData(0, 0, 160, 90);
  return calculateRelativeLuminance(data);
};`,
    },
    {
      num: "02",
      title: "Detect",
      subtitle: "Frequency Analysis & Threshold Verification",
      description:
        "Potentially hazardous sequences are identified and mapped to precise timestamps.",
      details:
        "Experimental luminance, red-intensity and edge heuristics identify candidate intervals. Thresholds are not calibrated standards measurements, and detection is not guaranteed.",
      badge: "Experimental heuristic",
      specs: [
        { label: "Frequency Ceiling", val: "Six transitions in a rolling second" },
        { label: "Luminance Delta", val: "Relative linear luminance change of 0.1" },
        { label: "Detection Latency", val: "No latency guarantee" },
      ],
      codeSnippet: `// 2. Rolling Window Pattern Verification
const evaluateHazard = (frequencyBuffer, currentTimestamp) => {
  const transitionsInLastSecond = countLuminanceInversions(frequencyBuffer, 1000);
  if (transitionsInLastSecond >= 3 && deltaLuminance > THRESHOLD) {
    return { isHazard: true, startMs: currentTimestamp, rateHz: transitionsInLastSecond * 2 };
  }
};`,
    },
    {
      num: "03",
      title: "Protect",
      subtitle: "Timestamp-based visual covering",
      description:
        "Protective visual filtering obscures detected sequences while playback continues.",
      details:
        "A hardware-accelerated CSS filter mask automatically deploys over the HTML5 video element based on the playback timestamp, subject to browser scheduling. The audio stream and stream synchronization continue uninterrupted, lifting the shield the instant the detected interval ends.",
      badge: "Zero Playback Pauses",
      specs: [
        { label: "Filter Deployment", val: "Hardware accelerated CSS backdrop layer" },
        { label: "Stream Integrity", val: "Audio remains crystal clear and sync preserved" },
        { label: "Restoration", val: "Automatic removal when flash sequence ends" },
      ],
      codeSnippet: `// 3. Hardware Shield Injection
const deployProtectiveShield = (videoElement, filterConfig) => {
  shieldOverlay.style.backdropFilter = filterConfig.mode === 'blur'
    ? 'blur(28px) saturate(40%)'
    : 'grayscale(100%) brightness(30%)';
  // Playback & audio continue without stopping
};`,
    },
  ];

  return (
    <section id="how-it-works" className="py-24 md:py-32 bg-[#090909] relative border-t border-[#1c1c1c]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Headline */}
        <div className="max-w-3xl space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#262626] bg-[#141414] text-xs font-mono text-[#a3a3a3]">
            <span>SYSTEM ARCHITECTURE</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-semibold tracking-tight text-[#f5f5f5]">
            Intelligent protection. <br />
            <span className="text-[#a3a3a3]">Uninterrupted viewing.</span>
          </h2>

          <p className="text-base sm:text-lg text-[#a3a3a3] leading-relaxed">
            Vision Guard was engineered to operate silently in the background. It intercepts flashing patterns without stopping, buffering, or altering your video stream.
          </p>
        </div>

        {/* Step Progression (Connected Minimalist Line Architecture) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Interactive Step Cards (col 5/12) */}
          <div className="lg:col-span-5 space-y-4">
            {steps.map((step, idx) => {
              const isSelected = activeStep === idx;
              return (
                <div
                  key={step.num}
                  onClick={() => setActiveStep(idx)}
                  className={`p-6 rounded-2xl border cursor-pointer transition-all duration-300 relative ${
                    isSelected
                      ? "bg-[#141414] border-sky-500/50 shadow-[0_4px_24px_rgba(56,189,248,0.1)]"
                      : "bg-[#0d0d0d] border-[#1f1f1f] hover:border-[#2e2e2e] hover:bg-[#121212]"
                  }`}
                >
                  {/* Step Header */}
                  <div className="flex items-baseline justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className={`font-mono text-sm font-semibold tracking-wider ${
                        isSelected ? "text-sky-400" : "text-[#737373]"
                      }`}>
                        {step.num}
                      </span>
                      <span className="text-[#404040]">/</span>
                      <h3 className="text-lg font-semibold text-[#f5f5f5]">
                        {step.title}
                      </h3>
                    </div>
                    <span className="text-[11px] font-mono text-[#737373] px-2 py-0.5 rounded bg-[#1c1c1c] border border-[#262626]">
                      {step.badge}
                    </span>
                  </div>

                  {/* Main statement */}
                  <p className="text-sm font-medium text-[#f5f5f5] mb-2 leading-relaxed">
                    &ldquo;{step.description}&rdquo;
                  </p>

                  {/* Secondary detail */}
                  <p className="text-xs text-[#a3a3a3] leading-relaxed">
                    {step.details}
                  </p>

                  {/* Active Indicator Bar on Edge */}
                  {isSelected && (
                    <div className="absolute left-0 top-4 bottom-4 w-1 bg-sky-400 rounded-r-full" />
                  )}
                </div>
              );
            })}
          </div>

          {/* Right Column: Architectural Inspector / Code & Flow Visualizer (col 7/12) */}
          <div className="lg:col-span-7">
            <div className="bg-[#121212] rounded-2xl border border-[#262626] overflow-hidden shadow-2xl">
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-3.5 bg-[#171717] border-b border-[#262626]">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#333333]" />
                  <span className="w-2.5 h-2.5 rounded-full bg-[#333333]" />
                  <span className="w-2.5 h-2.5 rounded-full bg-[#333333]" />
                  <span className="ml-2 font-mono text-xs text-[#a3a3a3]">
                    vision-guard-engine / step-{steps[activeStep].num.toLowerCase()}-pipeline.ts
                  </span>
                </div>
                <span className="text-[11px] font-mono text-sky-400 bg-sky-950/60 border border-sky-500/30 px-2 py-0.5 rounded">
                  STAGE {activeStep + 1} OF 3
                </span>
              </div>

              {/* Code Preview */}
              <div tabIndex={0} role="region" aria-label="Illustrative analysis code" className="p-5 font-mono text-xs text-[#e5e5e5] bg-[#0d0d0d] overflow-x-auto border-b border-[#262626]">
                <pre className="text-sky-300/90 leading-relaxed">
                  <code>{steps[activeStep].codeSnippet}</code>
                </pre>
              </div>

              {/* Technical Specifications Matrix */}
              <div className="p-6 space-y-4 bg-[#141414]">
                <h4 className="text-xs font-mono uppercase tracking-wider text-[#737373]">
                  Technical Parameters & Execution Profile
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {steps[activeStep].specs.map((spec, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-xl bg-[#1c1c1c] border border-[#262626] space-y-1"
                    >
                      <p className="text-[11px] font-mono text-[#a3a3a3]">
                        {spec.label}
                      </p>
                      <p className="text-xs font-medium text-white">
                        {spec.val}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Workflow Diagram Footnote */}
                <div className="pt-2 flex items-center justify-between text-xs text-[#737373] border-t border-[#262626]">
                  <span className="flex items-center gap-1.5">
                    <Cpu className="w-3.5 h-3.5 text-sky-400" />
                    <span>WASM Compiled Kernel • Manifest V3</span>
                  </span>
                  <span className="font-mono text-[11px]">
                    Not independently validated
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
