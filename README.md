# Vision Guard 0.2.0

Experimental Chrome extension and Next.js landing page. This is an assistive prototype, not a medically validated seizure-prevention device.

## YouTube workflow

1. Open a YouTube watch page with protection and automatic pre-scan enabled (defaults).
2. The extension keeps the video picture black, mutes audio, returns to the beginning, and analyzes frames delivered by the existing player at normal speed. Leave the tab visible. Expect roughly the video duration plus buffering time.
3. After reaching the end it rewinds, restores the original mute and speed settings, and starts replay. If autoplay is blocked, press Play.
4. During replay, potential hazard intervals receive an opaque cover, or experimental blur if selected. Unknown frame gaps always stay opaque. Audio and playback continue during interval covering.

The popup reports scan state, progress, observed timeline coverage, potential hazard intervals and unknown gaps. Stop scan retains covering. Scan from beginning retries failed or interrupted scans. Disable protection explicitly to watch without this tool's covering. Continuous cover remains available.

This is a covered first pass, not simultaneous access to unseen future YouTube frames. It uses the normal player and Canvas APIs; it does not extract stream URLs, download restricted streams, disable browser security, or bypass CORS/DRM. Pixel access is tested on each scan. Live streams and encrypted/inaccessible video cannot be analyzed. Ads and source changes invalidate the map; restart afterward. Backgrounding the tab stops the scan with a covered failure state.

## Install / update

Download the ZIP from the landing page and extract it. At chrome://extensions, enable Developer Mode and Load unpacked, selecting the folder containing manifest.json. This is not a Web Store installation. For an existing installation replace the extracted files, click Reload on the extension card, then reload your YouTube tab. Check version 0.2.0 in the popup.

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

The YouTube test runs an encoded flashing fixture only in headless Chromium, verifies detection, covering, replay, audio-state restoration, ad interruption and blocked canvas access, then tests a short real YouTube video. Network availability, YouTube changes and access challenges can affect that last test. Do not view hazardous test fixtures directly.

## Limits

Experimental luminance, saturated-red intensity and edge heuristics downsample frames to 96×54. They do not implement calibrated WCAG red-chromaticity or visual-angle measurements or clinically validated pattern analysis. Results can miss hazards and create false positives. Coverage describes observed timeline continuity, not safety. Missed callbacks are mapped as covered gaps. Rendering and seek event timing cannot guarantee frame-exact protection. Browser crashes, other extensions and page changes can defeat visual covering. The tool does not cover thumbnails or arbitrary page content. Picture-in-Picture is disabled for the managed video but is not a supported protection surface. Blur can preserve flashes.

See RELEASE-CHECKS.md for the verification scope. No clinical or seizure-prevention guarantees.
