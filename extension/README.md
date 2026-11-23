# Vision Guard 0.3.2

Extract this ZIP. Open chrome://extensions, enable Developer Mode and select Load unpacked. Choose the folder containing manifest.json. When updating an existing installation, replace its files, click Reload on the extension card and reload YouTube. Check version 0.3.2 in the popup.

Fast mode is the default on YouTube. The original picture stays opaque while inspected frames are displayed at up to 1280×720. Audio continues. Detected changes automatically freeze, blur and dim the last inspected picture. If no prior picture is available, the screen stays covered. Sudden cuts can trigger the filter, and the detector can miss hazards. For timestamp-based replay, choose section pre-scans (12 seconds at a time) or a whole-video pre-scan in the popup.

Detected intervals are automatically covered during replay without intentionally pausing audio or playback. Experimental blur is optional; opaque cover is recommended. Unknown gaps remain opaque in all modes. Scan results are held only for the current video and source. Ads/source changes invalidate them. Errors, blocked frame access, live streams, stopped scans and backgrounded scans retain the cover. Use Scan from beginning to retry. Disabling Protection explicitly removes covering.

All modes use normal browser media APIs. Pixel-access restrictions keep the picture covered. Coverage is experimental.

Local-file pre-analysis is also available from the popup. Source files remain local.

Experimental heuristic detector inspired by https://www.w3.org/WAI/WCAG22/Understanding/three-flashes-or-below-threshold . No certified standards compliance, clinical validation or seizure-prevention guarantee. Downsampling and callback gaps can miss events. A result with no detected hazards does not establish safety. Blur can leave flashes visible. Covering does not protect thumbnails, arbitrary page content or Picture-in-Picture. Browser scheduling, errors and page changes can affect protection.
