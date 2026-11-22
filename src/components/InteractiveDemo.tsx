"use client";
import { useState } from "react";
export function InteractiveDemo() {
  const [time, setTime] = useState(0);
  const covered = time >= 8 && time <= 15;
  return <section id="interactive-demo" className="py-24 px-6 border-t border-[#262626]">
    <div className="max-w-5xl mx-auto space-y-6">
      <p className="text-sky-300 text-sm">INTERACTION PREVIEW · ILLUSTRATIVE TIMESTAMPS</p>
      <h2 className="text-3xl font-semibold">See timestamp-based covering.</h2>
      <p className="text-[#b8b8b8]">Move the timeline into the example interval, 8–15 seconds. This static illustration contains no video or flashes and does not show analysis results.</p>
      <div className="aspect-video rounded-xl border border-[#363636] relative overflow-hidden bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
        <span>Static preview scene</span>
        {covered && <div className="absolute inset-0 bg-[#151515] flex items-center justify-center">Visuals covered · example interval</div>}
      </div>
      <label className="block space-y-3">Example position: {time.toFixed(1)} seconds
        <input className="block w-full min-h-11" type="range" min="0" max="25" step="0.1" value={time} onChange={event => setTime(Number(event.target.value))} />
      </label>
      <p className="text-[#b8b8b8]">Accessible YouTube videos receive a covered pre-scan before replay. Unknown gaps stay opaque. This illustration is not an analysis result; no detection result establishes safety.</p>
    </div>
  </section>;
}
