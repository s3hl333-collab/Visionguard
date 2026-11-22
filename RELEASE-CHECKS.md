# Vision Guard 0.2.0 verification

This is an experimental developer preview, not a medically validated safety release.

## New YouTube workflow

Real YouTube frame access was verified on a short public video using standard Canvas reads. The actual unpacked extension performed a covered pre-scan, reached the end, rewound and began replay. Results apply to the tested video/session, not every video or browser.

The automated YouTube test additionally runs an encoded 8-second controlled fixture in headless Chromium. It checks real detected intervals spanning the fixture's flashing portion, picture covering during scanning and replay, continued replay, restoration after seeking outside intervals, original audio-state restoration, ad invalidation and a CORS-tainted video remaining covered on failure. No hazardous footage appears in the landing page or artifacts.

Missed frames produce padded opaque gaps. Coverage is continuity of observed timeline, not exhaustive content or clinical safety. Buffering, background tabs, ads, DRM, access challenges and YouTube changes can interrupt analysis. The user must keep the tab visible. Full-video scanning incurs an initial wait approximately equal to the video duration.

## Existing regression checks

Run the production build, lint, five detector tests, local-file extension browser test and desktop/mobile landing-page accessibility/download audit. The landing-page test compares the downloaded ZIP hash to the package in public/downloads. These are automated checks, not exhaustive screen-reader, cross-browser, security or clinical validation. Audio-state assertions verify mute/speed restoration, not audible fidelity.

## Reproduction

See README.md for commands. Use package-extension.ps1 after extension changes. The generated detector-content.js and packaged ZIP are committed deliverables; detector.mjs is the detector source of truth.
