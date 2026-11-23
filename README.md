# Vision Guard 0.3.8

For smoother video, select **Native playback · dim flashing areas** in the popup. YouTube renders the original picture. A local mask reduces contrast where brightness or saturated red alternates rapidly. Several quick changes can activate dimming within a short burst, including when nearby lights alternate in different positions. Isolated cuts and low-contrast changes generally remain visible. Early flashes may appear before the sequence is recognized. Static pattern detection and before-display inspection are available in the original Fast mode.

Experimental Chrome extension and Next.js landing page. This is an assistive prototype, not a medically validated seizure-prevention device.

## YouTube workflow

1. Open a YouTube watch page with Protection enabled. **Fast · inspect as I watch** is the default.
2. Fast mode keeps the source picture opaque and displays only inspected snapshots, at up to 1280×720. On a detected change, Fast mode freezes, blurs and dims the last inspected picture. Original audio and playback speed continue. During a possible local trigger, playback can advance outside the held area. A full scene change can hold the whole picture for up to 220 ms. Rapid reversals in the same area and dense high-contrast stripes activate the filter. Some triggers can still be missed.
3. For native YouTube playback through analyzed sections with no detected trigger, choose **Pre-scan the whole video**. This puts the scan before viewing. The 12-second option alternates between covered scanning and replay.
4. During replay, potential hazard intervals receive an opaque cover, or experimental blur if selected. Unknown frame gaps always stay opaque. Audio and playback continue during interval covering.

The popup shows inspected and displayed frame counts in fast mode, and timeline coverage in pre-scan modes. Changing modes reloads the active YouTube tab.

All modes use normal browser media APIs. Pixel-access restrictions keep the picture covered. Coverage is experimental.

## Install / update

Download the ZIP from the landing page and extract it. At chrome://extensions, enable Developer Mode and Load unpacked, selecting the folder containing manifest.json. This is not a Web Store installation. For an existing installation replace the extracted files, click Reload on the extension card, then reload your YouTube tab. Check version 0.3.8 in the popup.

## Local files

The popup also opens a local-file analyzer. It samples at 60 seeks per second of media duration before enabling playback. Files stay on the device.

## Build and verify

- npm install
- npm run lint
- npm run test:detector
- npm run build:extension (generates detector-content.js from the shared detector.mjs)
- powershell -File package-extension.ps1 (builds the extension and refreshes public/downloads/vision-guard-extension.zip)
- npm run build
- npm run start -- --port 3100
- npx playwright install chromium
- node release-tests/check.cjs
- node release-tests/extension.cjs
- npm run test:youtube
- npm run test:fast

The YouTube test runs an encoded flashing fixture only in headless Chromium, verifies detection, covering, replay, audio-state restoration, ad interruption and blocked canvas access, then tests a short real YouTube video. Network availability, YouTube changes and access challenges can affect that last test. Do not view hazardous test fixtures directly.

## Limits

Experimental luminance, saturated-red intensity and edge heuristics downsample frames to 96×54. They do not implement calibrated WCAG red-chromaticity or visual-angle measurements or clinically validated pattern analysis. Results can miss hazards and create false positives. Coverage describes observed timeline continuity, not safety. Missed callbacks are mapped as covered gaps. Rendering and seek event timing cannot guarantee frame-exact protection. Browser crashes, other extensions and page changes can defeat visual covering. The tool does not cover thumbnails or arbitrary page content. Picture-in-Picture is disabled for the managed video but is not a supported protection surface. Blur can preserve flashes.

See RELEASE-CHECKS.md for the verification scope. No clinical or seizure-prevention guarantees.
