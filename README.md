# VISION GUARD — Premium Landing Page

> **Watch freely. Stay aware.**

A premium, dark-themed, modern landing page for **Vision Guard**, an open-source Chrome extension engineered to help individuals with photosensitive epilepsy and light sensitivity by detecting hazardous flashing sequences in YouTube videos and applying protective visual filtering at detected timestamps without interrupting playback.

---

## 🎨 Design Philosophy & Principles

Inspired by the editorial aesthetics of **Linear, Ollama, ElevenLabs, and Vercel**:

- **Color Palette**: Deep charcoal and obsidian (`#090909`, `#141414`, `#1C1C1C`) with subtle borders (`#262626`) and restrained cool sky/teal accents (`#38bdf8`, `#2dd4bf`).
- **Atmosphere**: Calm, clinical, technically authoritative, and distraction-free. Avoids generic AI gradient clichés and excessive 3D blobs.
- **Micro-Interactions**: Purposeful telemetry gauges, interactive scrubbing timeline, dynamic filter switcher, and live visualizer with safe synthetic previews.
- **Safety First**: Safe demonstration previewing without exposing viewers to rapid strobe or seizure-inducing frequencies.

---

## 🚀 Key Sections

1. **Section 1 — Navigation (`src/components/Navbar.tsx`)**:
   - Distinctive minimal geometric aperture shield logo.
   - Sticky translucent frosted navbar (`backdrop-blur-md`).
   - Links to Product, How It Works, Features, Technology Standards, and FAQ.
   - Primary "Get Extension" and GitHub source triggers.

2. **Section 2 — Hero (`src/components/Hero.tsx`)**:
   - Eyebrow: `INTRODUCING VISION GUARD`.
   - Headline: `A safer way to experience video.`
   - Supporting narrative on zero-pause uninterrupted viewing.
   - Cinematic YouTube video player visualization with Vision Guard's real-time protection HUD.
   - Technical trust badges: `0s Playback Pauses`, `100% On-Device & Private`, `WCAG 2.2 §2.3.1 compliant`.

3. **Section 3 — Interactive Product Demonstration (`src/components/InteractiveDemo.tsx`)**:
   - **The Centerpiece**: Fully interactive mock video player.
   - Scrubber with marked hazard zones (`00:08 - 00:15` and `00:26 - 00:33`).
   - Automated shield activation when playback crosses hazardous timestamps.
   - Live telemetry console: Flash Frequency meter (Hz), Luminance Variance ($\Delta L$), and response latency ($3.4\,\text{ms}$).
   - 3 customizable shield modes: Frosted Veil (Gaussian blur), Monochrome Dampen, and Obsidian Shield.
   - Simulation safety guarantee: Strictly static and calm motion—contains 0 seizure-inducing strobes.

4. **Section 4 — How It Works (`src/components/HowItWorks.tsx`)**:
   - **01 / Analyze**: Frame ingestion and luminance extraction via OffscreenCanvas.
   - **02 / Detect**: ITU-R BT.1702 rolling window analysis triggering on $>3\,\text{Hz}$ flash rate.
   - **03 / Protect**: Hardware-accelerated CSS filter mask deploying at the micro-second while audio continues.
   - Interactive code pipeline explorer.

5. **Section 5 — Core Features (`src/components/Features.tsx`)**:
   - Asymmetric editorial bento grid showcasing: Proactive Detection, Seamless Playback, Timestamp Precision, Adaptive Visual Protection, and Privacy First (zero data uploaded).

6. **Section 6 — Clinical & Safety Standards (`src/components/TechnologyStandards.tsx`)**:
   - Grounded in W3C WCAG 2.2 §2.3.1, ITU-R BT.1702, and ISO 9241-391.
   - Comprehensive comparative matrix: Standard Video Player vs Vision Guard Protected Experience.

7. **Section 7 — FAQ (`src/components/FAQ.tsx`)**:
   - Accordion addressing common questions regarding playback continuity, on-device privacy, medical disclaimers, and browser compatibility.

8. **Section 8 — CTA & Footer (`src/components/CTASection.tsx`, `src/components/Footer.tsx`)**:
   - High-impact call to action with browser compatibility pills.
   - Complete footer with accessibility statement, MIT license, and clinical disclaimer.

---

## 🛠️ Technology Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4 with custom dark theme tokens
- **Icons**: Lucide Icons & Custom SVG aperture assets
- **Typography**: Geist Sans & Geist Mono

---

## 💻 Development & Production

To run the project locally:

```bash
# Navigate to project
cd C:\Users\s3hl3\.gemini\antigravity\scratch\vision-guard

# Run production server
npm run build
npm run start -p 3000
```
Open [http://localhost:3000](http://localhost:3000) in your browser.
