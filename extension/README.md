# Vision Guard 0.2.0

Extract this ZIP. Open chrome://extensions, enable Developer Mode and select Load unpacked. Choose the folder containing manifest.json. When updating an existing installation, replace its files, click Reload on the extension card and reload YouTube. Check version 0.2.0 in the popup.

YouTube now has a covered first-pass analyzer. With Protection enabled and Automatically pre-scan enabled (defaults), the video is covered and muted while frames are analyzed at normal playback speed. Keep the tab visible. Expect approximately the video duration, plus buffering. On completion, replay starts from the beginning with the original audio and speed settings restored. Press Play if Chrome blocks autoplay.

Detected intervals are automatically covered during replay without intentionally pausing audio or playback. Experimental blur is optional; opaque cover is recommended. Unknown gaps remain opaque in all modes. Scan results are held only for the current video and source. Ads/source changes invalidate them. Errors, blocked frame access, live streams, stopped scans and backgrounded scans retain the cover. Use Scan from beginning to retry. Disabling Protection explicitly removes covering.

No stream extraction, DRM/CORS bypass or uploads. Pixel access must succeed through the browser's normal Canvas API. Coverage and timestamps come from actual frames, not supplied examples. This first pass can take the video's full duration; it is not simultaneous future-frame access.

Local-file pre-analysis is also available from the popup. Source files remain local.

Experimental heuristic detector inspired by https://www.w3.org/WAI/WCAG22/Understanding/three-flashes-or-below-threshold . No certified standards compliance, clinical validation or seizure-prevention guarantee. Downsampling and callback gaps can miss events. A result with no detected hazards does not establish safety. Blur can leave flashes visible. Covering does not protect thumbnails, arbitrary page content or Picture-in-Picture. Browser scheduling, errors and page changes can affect protection.
