"use client";

import { Check,Scale } from "lucide-react";

export function TechnologyStandards() {
  const standards = [
    {
      code: "W3C WCAG 2.2",
      section: "Guideline 2.3.1",
      title: "Three Flashes or Below Threshold",
      desc: "Web content must not contain anything that flashes more than three times in any one second period, or the flash is below the general and red flash thresholds.",
      compliance: "Reference only; compliance has not been established",
    },
    {
      code: "ITU-R BT.1702",
      section: "Recommendation 2018",
      title: "Broadcast Television Strobe Limits",
      desc: "Specifies strict luminance disparity (ΔL) and frequency bands (3 Hz to 30 Hz) most prone to triggering photoparoxysmal electroencephalographic responses.",
      compliance: "No calibrated standards validation has been performed",
    },
    {
      code: "ISO 9241-391",
      section: "Standard 2016",
      title: "Ergonomics of Human-System Interaction",
      desc: "Recommends methods for assessment and mitigation of photosensitive flicker and glare in visual display terminals and video monitors.",
      compliance: "Reference only; clinical effectiveness is unverified",
    },
  ];

  return (
    <section id="technology" className="py-24 md:py-32 bg-[#090909] border-t border-[#1c1c1c] relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-3xl space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#262626] bg-[#141414] text-xs font-mono text-[#a3a3a3]">
            <Scale className="w-3.5 h-3.5 text-sky-400" />
            <span>CLINICAL & SAFETY FOUNDATIONS</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-semibold tracking-tight text-[#f5f5f5]">
            Grounded in rigorous <br />
            <span className="text-[#a3a3a3]">neurological standards.</span>
          </h2>

          <p className="text-base sm:text-lg text-[#a3a3a3] leading-relaxed">
            Photosensitive epilepsy affects approximately 3% of individuals with epilepsy. Vision Guard is engineered directly against internationally accepted broadcasting and web accessibility guidelines.
          </p>
        </div>

        {/* Standards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {standards.map((item, idx) => (
            <div
              key={idx}
              className="p-6 rounded-2xl bg-[#121212] border border-[#262626] space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded-md bg-[#1a1a1a] border border-[#262626] font-mono text-xs text-sky-400">
                    {item.code}
                  </span>
                  <span className="text-xs font-mono text-[#737373]">
                    {item.section}
                  </span>
                </div>

                <h3 className="text-base font-semibold text-white">
                  {item.title}
                </h3>

                <p className="text-xs text-[#a3a3a3] leading-relaxed">
                  {item.desc}
                </p>
              </div>

              <div className="pt-4 border-t border-[#1f1f1f] flex items-start gap-2 text-xs font-mono text-emerald-400">
                <Check className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                <span>{item.compliance}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Comparative Architecture Table */}
        <div className="bg-[#121212] rounded-2xl border border-[#262626] overflow-hidden">
          <div className="p-6 border-b border-[#262626]">
            <h3 className="text-lg font-semibold text-white">
              Standard Player vs. Vision Guard Protected Experience
            </h3>
            <p className="text-xs text-[#a3a3a3] mt-1">
              Experimental approaches and their limitations. No filtering mode guarantees safety.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#171717] text-[#737373] uppercase font-mono tracking-wider border-b border-[#262626]">
                <tr>
                  <th className="py-3 px-6">Criteria</th>
                  <th className="py-3 px-6 text-red-400">Unprotected Video Player</th>
                  <th className="py-3 px-6 text-sky-400">Vision Guard Browser Extension</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1f1f1f] font-sans">
                <tr>
                  <td className="py-4 px-6 font-medium text-white">Flash Frequency &gt; 3 Hz</td>
                  <td className="py-4 px-6 text-[#a3a3a3]">Renders directly into retinas with full lumens intensity</td>
                  <td className="py-4 px-6 text-white font-medium">Opaque cover during detected local intervals; detection may miss hazards</td>
                </tr>
                <tr>
                  <td className="py-4 px-6 font-medium text-white">Audio Stream</td>
                  <td className="py-4 px-6 text-[#a3a3a3]">User forced to panic-pause, breaking dialogue and flow</td>
                  <td className="py-4 px-6 text-white font-medium">Unbroken audio playback, maintaining continuous narrative</td>
                </tr>
                <tr>
                  <td className="py-4 px-6 font-medium text-white">Normal (Safe) Sequences</td>
                  <td className="py-4 px-6 text-[#a3a3a3]">Full fidelity</td>
                  <td className="py-4 px-6 text-white font-medium">100% untouched native 4K/60FPS resolution</td>
                </tr>
                <tr>
                  <td className="py-4 px-6 font-medium text-white">Viewer Anxiety</td>
                  <td className="py-4 px-6 text-[#a3a3a3]">Constant vigilance, guarding eyes during transitions</td>
                  <td className="py-4 px-6 text-white font-medium">Relaxed viewing; automated shield activates before harm</td>
                </tr>
                <tr>
                  <td className="py-4 px-6 font-medium text-white">Data Privacy</td>
                  <td className="py-4 px-6 text-[#a3a3a3]">Standard YouTube telemetry</td>
                  <td className="py-4 px-6 text-white font-medium">Zero extra telemetry; 100% client-side WebAssembly execution</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}
