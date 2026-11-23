# Vision Guard 0.3.7

For smoother video, select **Native playback · dim flashing areas** in the popup. YouTube renders the original picture. A local mask reduces contrast where brightness or saturated red alternates rapidly. Several quick changes can activate dimming within a short burst, including when nearby lights alternate in different positions. Isolated cuts and low-contrast changes generally remain visible. Early flashes may appear before the sequence is recognized. Static pattern detection and before-display inspection are available in the original Fast mode.

Extract this ZIP. Open chrome://extensions, enable Developer Mode and select Load unpacked. Choose the folder containing manifest.json. When updating an existing installation, replace its files, click Reload on the extension card and reload YouTube. Check version 0.3.7 in the popup.

Fast mode is the default on YouTube. The original picture stays opaque while inspected frames are displayed at up to 1280×720. Audio continues. Detected changes automatically freeze, blur and dim the last inspected picture. If no prior picture is available, the screen stays covered. A possible local trigger briefly holds the changed area while the rest of the picture can advance. Repeated brightness or color changes in the same area and dense high-contrast stripes activate the filter. The detector can miss hazards. For timestamp-based replay, choose section pre-scans (12 seconds at a time) or a whole-video pre-scan in the popup.

Detected intervals are automatically covered during replay without intentionally pausing audio or playback. Experimental blur is optional; opaque cover is recommended. Unknown gaps remain opaque in all modes. Scan results are held only for the current video and source. Ads/source changes invalidate them. Errors, blocked frame access, live streams, stopped scans and backgrounded scans retain the cover. Use Scan from beginning to retry. Disabling Protection explicitly removes covering.

All modes use normal browser media APIs. Pixel-access restrictions keep the picture covered. Coverage is experimental.

Local-file pre-analysis is also available from the popup. Source files remain local.

Experimental heuristic detector inspired by https://www.w3.org/WAI/WCAG22/Understanding/three-flashes-or-below-threshold . No certified standards compliance, clinical validation or seizure-prevention guarantee. Downsampling and callback gaps can miss events. A result with no detected hazards does not establish safety. Blur can leave flashes visible. Covering does not protect thumbnails, arbitrary page content or Picture-in-Picture. Browser scheduling, errors and page changes can affect protection.
