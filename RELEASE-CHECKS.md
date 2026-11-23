# Vision Guard 0.3.3 verification

## Fast-mode false positives

The six-second ordinary-motion fixture has three separate shots and a moving subject. In headless Chromium, 0.3.2 blurred 92 of 357 display samples. Version 0.3.3 blurred zero of 360 samples and continued drawing the moving subject. In a separate comparison on the first 12 seconds of one public YouTube clip, the old and new rules saw the same 145 decoded samples. The old rules selected blur on 116. The new rules selected blur on zero and held the previous clear picture on ten. These examples do not estimate a general false-positive rate.

The existing two-second brightness and color triggers were also tested. The clear picture stayed frozen during confirmation, blur appeared within 100 ms of each onset in the comparison run, and the sampled canvas never displayed the changing source colors. Unit tests cover one-way fades, changes in different regions, localized reversals, quiet recovery and dense stripes. Real video can contain patterns outside these tests.

## Earlier 0.3.2 audit

- In headless Chromium, Fast mode first displayed an inspected frame after 86 ms on the 48-second fixture. Blur first appeared 13 ms after brightness-flash onset and 9 ms after color-change onset. All 238 samples during those intervals retained the previous picture with blur and dimming. Playback continued and the regular picture returned after each interval. On one live YouTube video the first inspected frame appeared after 3.77 seconds. These timings describe individual runs.
- Two simulated back/forward-cache restores reattached the inspection canvas. The test then checked trigger handling on the restored player. Real browser cache eligibility varies by page.
- The sectional scan reached first replay in 13.47 seconds with an induced callback stall. The whole-video regression uses a fixed-rate encoded clip so its hazard timestamps are independent of the test machine’s recording timers. Chromium kept unreadable cross-origin media covered. On a 19.02-second live YouTube video, the whole-video scan reached replay with 74.5% analyzed coverage and kept two sampling gaps opaque.
- The production landing page served the packaged ZIP byte for byte. A keyboard could open the menu and follow its FAQ link at 700 px. Automated axe checks reported zero violations in the tested desktop and mobile views, both popup mode layouts and the local analyzer’s initial view. The local analyzer also passed the playback, seek, fullscreen and invalid-file tests.
- Lint, the production build and all nine detector tests passed. The npm advisory audit reported zero known vulnerabilities in the lockfile. The extension requests storage and active-tab permissions and injects its content scripts on www.youtube.com.

## Earlier 0.3.0 verification

On a controlled 48-second VP9 fixture, the previous whole-video scan reached replay after 48.29 seconds. The new sectional scan reached replay after 13.49 seconds with a forced 400 ms callback stall. Fast mode showed its first inspected picture within 0.1 seconds of Play on the locally available fixture. Timings are from separate headless runs and include different startup work. A live YouTube test showed its first inspected picture 4.4 seconds after Play, after media was already loaded.

The fast-mode test samples the actual canvas during the known flashing interval, checks that source pixels stay covered, and verifies resumed picture, audio settings, continued playback and covered failure on inaccessible media. The segmented test covers a later hazard, a seek into an unscanned block, an induced gap and ad invalidation. Run npm run test:fast to reproduce the fixture tests.

This is an experimental developer preview, not a medically validated safety release.

## Earlier 0.2.0 whole-video checks

Real YouTube frame access was verified on a short public video using standard Canvas reads. The actual unpacked extension performed a covered pre-scan, reached the end, rewound and began replay. Results apply to the tested video/session, not every video or browser.

The automated YouTube test additionally runs an encoded 8-second controlled fixture in headless Chromium. It checks real detected intervals spanning the fixture's flashing portion, picture covering during scanning and replay, continued replay, restoration after seeking outside intervals, original audio-state restoration, ad invalidation and a CORS-tainted video remaining covered on failure. No hazardous footage appears in the landing page or artifacts.

Missed frames produce padded opaque gaps. Coverage is continuity of observed timeline, not exhaustive content or clinical safety. Buffering, background tabs, ads, DRM, access challenges and YouTube changes can interrupt analysis. The user must keep the tab visible. Full-video scanning incurs an initial wait approximately equal to the video duration.

## Existing regression checks

Run the production build, lint, detector tests, local-file extension browser test and desktop/mobile landing-page accessibility/download audit. The landing-page test compares the downloaded ZIP hash to the package in public/downloads. These are automated checks, not exhaustive screen-reader, cross-browser, security or clinical validation. Audio-state assertions verify mute/speed restoration, not audible fidelity.

## Reproduction

See README.md for commands. Use package-extension.ps1 after extension changes. The generated detector-content.js and packaged ZIP are committed deliverables; detector.mjs is the detector source of truth.
