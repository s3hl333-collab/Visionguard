# Vision Guard 0.1.0 developer preview

Release scope: experimental developer-mode installation. Not a Chrome Web Store release, clinically validated device, WCAG-certified detector, or assurance that content is safe.

## Verified on this checkout

- Production Next.js build passes.
- ESLint passes with zero warnings and zero errors.
- Five detector tests pass (known transitions, steady content, seek lookup, invalid input, interval boundaries).
- Chrome landing-page download succeeds; SHA-256 matches public/downloads/vision-guard-extension.zip.
- Desktop and 390px mobile automated axe WCAG A/AA checks report zero violations in tested states.
- No landing-page browser script errors in those tests.
- Actual unpacked extension loads in Chromium. A headlessly generated 6-second WebM containing a controlled 1–3 second strobe is analyzed before playback. Observed padded interval: 0.43–4.17 seconds.
- Browser assertions pass for cover activation, continued playback, seek restoration, playback speed, fullscreen, and covered failure on an invalid video. No extension-page script errors observed.
- Production dependency npm audit reported zero known vulnerabilities in the preceding hardening audit.

## Limits

This does not constitute exhaustive accessibility, security or clinical validation. Manual screen-reader checks and real-world YouTube compatibility remain unverified. The controlled fixture tests video progression, not audible output. Detection is sampled and heuristic; frame timing and interval boundaries are approximate and padded. YouTube advance analysis remains unavailable, and continuous cover is optional. Local captions and additional file codecs require further testing. Do not market this preview as seizure prevention.

## Installation

Download from the landing page, extract the ZIP, enable Developer Mode at chrome://extensions and select Load unpacked. Choose the folder containing manifest.json. Reload existing YouTube tabs. The main landing-page CTA downloads /downloads/vision-guard-extension.zip directly.

## Rebuild and test

Run npm run lint, npm run build, and node --test extension/detector.test.mjs. Run package-extension.ps1 after changing extension files. Browser release checks require Playwright Chromium and @axe-core/playwright; audit scripts are in release-tests.
