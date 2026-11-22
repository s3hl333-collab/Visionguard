# Vision Guard 0.1.0 — experimental prototype

Extract the download ZIP, open chrome://extensions, enable Developer Mode, choose Load unpacked and select the extracted directory containing manifest.json. This is not a Chrome Web Store installation. Reload existing YouTube tabs after installing.

Open the popup and choose Analyze a local video. Select a locally accessible video; it is decoded offscreen by seeking at 60 samples per second. Playback remains covered until the entire duration has been sampled. Press Play after analysis. Potential hazard intervals automatically receive an opaque cover while audio and time continue. Use the provided seek, speed and fullscreen controls. Settings persist through Chrome Storage. No files or frames are uploaded.

YouTube future-frame analysis is unavailable: streaming/DRM/CORS restrictions are not bypassed. Coverage is always 0%; no timestamps are invented. The optional continuous cover blacks out video pixels while leaving controls and subtitles available. It does not cover thumbnails, advertisements outside video elements, Picture-in-Picture, or other page content. Initial extension startup and browser scheduling can delay application. It is not a guarantee of protection.

Detector: linear-light luminance transitions, a conservative 5% changed-area heuristic, six opposing transitions in a rolling second, saturated-red intensity changes, and a horizontal high-contrast edge heuristic. Intervals include temporal padding and are merged. Inspired by https://www.w3.org/WAI/WCAG22/Understanding/three-flashes-or-below-threshold . It does not implement calibrated visual-angle measurements, WCAG red chromaticity thresholds, or validated pattern analysis; do not claim WCAG compliance. Downsampling and seeking can miss brief events, and high-frequency footage can alias. No hazard detected does not mean safe.

Assistive tool, not a medically validated seizure-prevention device. Blur remains experimental and may preserve flashing. Analysis errors retain the opaque cover. Browser rendering cannot guarantee frame-exact transitions.

Run detector checks with `node --test detector.test.mjs`. These are synthetic pixel tests, not browser or clinical validation. Full browser, encoded-video, fullscreen, YouTube and audio continuity acceptance tests are still required before release. No hazardous footage is included in the website.
