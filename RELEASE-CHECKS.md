# Vision Guard 0.3.6 native playback and regional dimming

The opt-in Native playback mode lets Chrome present the video at its original resolution and speed. It monitors 96×54 samples. Each of 144 regions independently counts alternating changes in brightness and a saturated-red signal. Seven qualifying transitions inside one second activate a translucent neutral mask for that region. The mask reduces the difference between bright and dark frames and fades after the sequence. Separate regions can dim independently. Single cuts and low-amplitude pulses do not accumulate unrelated changes elsewhere in the picture.

The transition count and brightness threshold are informed by [W3C flash guidance](https://www.w3.org/WAI/WCAG22/Understanding/three-flashes-or-below-threshold.html). The sampled regions and saturated-red signal are heuristics. They do not model viewing distance, HDR display luminance or the full W3C red chromaticity test. This mode can miss flashes and allows the beginning of a sequence to appear. For advance screening, use pre-scan. [Chrome's video callback documentation](https://web.dev/articles/requestvideoframecallback-rvfc) explains why live sampling can miss a presented frame.

In five-second headless Chromium trials on an ordinary 1080p/60 VP9 clip, native playback with regional monitoring showed 301 frames at a 480 px player width and 302 at 960 px, with zero reported drops or dimming events. Page main-thread time was 2.81 and 3.07 ms per presented frame. The existing inspected-frame mode showed 233 and 263 frames in a separate run of the same fixture. These are local measurements. Reproduce with `VG_ENCODED=1` and `node release-tests/playback-cost.cjs --native extension --regional`.

## Earlier 0.3.5 playback performance

Fast mode captures each inspected frame once. For small players it uses a private canvas sized for the displayed player and device pixel ratio, up to the existing 720p limit. At 960×540 output pixels or larger it retains a decoded VideoFrame when available, avoiding a second large canvas copy. Both sampling and presentation use the same snapshot. The next video callback is requested before readback starts. During confirmation of a localized change, the renderer holds a padded rectangle around all suspect tiles and can redraw the inspected remainder. A confirmed trigger freezes and filters the whole picture. Full-frame changes can still hold the entire picture while the detector waits for a reversal.

Chrome documents that video-frame callbacks run on the main thread and can arrive a display refresh late. The HTML standard specifies which video frame a canvas draw captures. Those constraints informed the single-snapshot design. The frequent CPU readback stays on the small analysis canvas. [Chrome video callback guide](https://web.dev/articles/requestvideoframecallback-rvfc) · [HTML canvas image sources](https://html.spec.whatwg.org/multipage/canvas.html#image-sources-for-2d-rendering-contexts) · [Chrome canvas readback guidance](https://developer.chrome.com/blog/canvas2d)

The playback benchmark loads each unpacked build in headless Chromium and samples approximately five seconds after warm-up. Run `node release-tests/playback-cost.cjs --native <old-extension> <new-extension>` for a 1080p moving canvas stream, or set `VG_ENCODED=1` for an identical prerecorded 1080p/60 VP9 clip. It checks that every inspected frame of this steady-motion clip is shown during measurement and that the filter stays inactive. It reports page main-thread time per displayed frame. Native counts come from Chrome's playback counters and extension counts come from canvas presentations. The counters are sampled separately, so their time windows can differ slightly. Device, decoder, GPU, player size and system load affect the result.

In the encoded local-trigger test, the left-hand bright region stayed held while the right-hand region updated within the first 200 ms. The final ordinary cuts and motion test recorded zero blurred or covered samples out of 357. Separate regressions passed for abrupt luminance changes, gradual pulses, color changes and stripes. The production landing page served the expected ZIP, and automated desktop and mobile accessibility checks reported zero violations on the tested views.

| 1080p/60 steady motion | Native frames | 0.3.4 frames | 0.3.5 frames | 0.3.4 main thread ms/frame | 0.3.5 main thread ms/frame |
|---|---:|---:|---:|---:|---:|
| 480 px player | 303 | 244 | 255 | 5.97 | 4.61 |
| 960 px player | 303 | 238 | 265 | 6.03 | 6.13 |

These figures come from one back-to-back run of the packaged source on this machine. Both versions showed every frame they inspected during the measurement. Chrome recorded zero decoder drops in this run, even where the extension presented fewer pictures than native playback. Main-thread cost decreased at the smaller size and was similar at the larger size. Timing varied between runs. Fast mode still has a playback cost on ordinary video.

## Earlier 0.3.4 research and verification

## What changed

The previous detector could miss a brightness pulse whose individual frame changes were small. W3C defines a transition in terms of a peak and valley in brightness. Fast mode and pre-scan now compare regional luminance over up to 100 ms and check for a reversal in the same parts of the image. This additional check requires agreement across at least a quarter of the sampled frame. The 100 ms window and spatial threshold are engineering choices. [W3C flash definitions](https://www.w3.org/WAI/WCAG22/Understanding/three-flashes-or-below-threshold.html)

Pre-scan counts seven alternating brightness transitions in a sliding one-second window. Fast mode can intervene on the first confirmed reversal because it has no future frames to inspect. It can show early, low-contrast steps of a gradual pulse before it freezes the picture. Color-change detection has separate heuristics.

The old stripe check counted strong edges in one direction. It flagged the static random texture in our test and missed horizontal bands. The new check looks for repeated light/dark spacing along both rows and columns. It detected the horizontal, vertical and diagonal bands we tested. Curved, fine and localized patterns remain harder after downsampling. ITU guidance also considers displayed area and luminance, which this browser extension cannot measure at the viewer’s eye. [ITU-R BT.1702-3](https://www.itu.int/rec/R-REC-BT.1702/en)

## Published luminance comparison

We evaluated all 234 temporal CSVs in the TRACE `rel_lum` suite at revision `ef78542`. Each CSV row supplied a uniform full-frame color at 30 fps. The table counts sequences receiving at least one filter decision or pre-scan interval. The published labels classify the temporal signal. This comparison does not exercise the project’s spatial masks, red-flash suite, video decoding or clinical outcomes. We used this suite during development, so the numbers are descriptive and cannot estimate accuracy on unseen videos. [Jordan’s evaluation method](https://doi.org/10.1007/978-3-031-93848-1_7) · [TRACE reference data](https://github.com/traceRERC/pse-test-media/tree/ef78542aad496827f25064f57aaf13d6a741ba75/lum_flash_patterns/rel_lum)

| Reference group | Sequences | Fast 0.3.3 | Fast 0.3.4 | Pre-scan 0.3.3 | Pre-scan 0.3.4 |
|---|---:|---:|---:|---:|---:|
| Exceeds luminance and count thresholds | 90 | 90 | 90 | 90 | 90 |
| Passes on count | 54 | 54 | 54 | 54 | 0 |
| Passes on luminance | 54 | 0 | 9 | 0 | 0 |
| Includes a below-threshold flash that makes the sequence pass | 36 | 36 | 36 | 0 | 0 |

Fast mode filtered nine additional below-threshold sequences after gaining sensitivity to multi-frame excursions. Pre-scan agreed with all 234 temporal labels. To reproduce, check out the pinned TRACE revision and run `node release-tests/reference-luminance.mjs <path-to-lum_flash_patterns/rel_lum>` from the Vision Guard project. This reads numbers locally and displays no flashing media.

## Browser and detector regressions

Headless Chromium exercised abrupt brightness flashes, abrupt color changes, a gradual four-level pulse and horizontal stripes. The gradual pulse test checks that the picture stays frozen once filtered and that playback recovers. A separate control checks that ordinary cuts and a moving subject keep advancing. The unit suite additionally exercises gradual reversals at 24, 30, 60 and 120 fps, a slow exposure change, irregular texture and the one-second counting boundary.

On the final build, the ordinary-motion fixture showed zero blurred samples out of 360. Blur began about 92 ms into the brightness flash, 73 ms into the color change, 200 ms into the gradual pulse and 13 ms into the band pattern. The gradual pulse held at gray level 119 while the source reached 147. On the first 12 seconds of one live YouTube clip, neither release chose blur on any of 163 common samples. The revised detector held the clear picture on ten samples. Its core analysis took about 0.1 ms median and 0.2 ms at the 95th percentile after ten warm-up samples. The measurement excludes video decoding, canvas readback and rendering.

The live whole-video pre-scan reached replay on a 19.02-second clip. Its measured coverage was 57%, with two sampling gaps kept opaque. The benchmark above supplies every frame and therefore cannot predict coverage on a live player.

## Earlier 0.3.3 verification

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
