import { Logo } from "./Logo";

export function Footer() {
  return (
    <footer className="bg-[#070707] border-t border-[#1a1a1a] text-xs text-[#737373] py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Top Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          {/* Brand Info (col 4/12) */}
          <div className="md:col-span-4 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-1 rounded-md bg-[#141414] border border-[#262626]">
                <Logo size={22} />
              </div>
              <span className="font-semibold tracking-[0.16em] text-sm text-[#f5f5f5]">
                VISION GUARD
              </span>
            </div>

            <p className="text-[#a3a3a3] text-xs leading-relaxed max-w-sm">
              Watch freely. Stay aware. Experimental YouTube frame inspection with optional pre-scanning. Not medically validated.
            </p>

            <div className="flex items-center gap-2 pt-1 font-mono text-[11px] text-[#525252]">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Manifest V3 Active • Local WebAssembly Engine</span>
            </div>
          </div>

          {/* Links Columns (col 8/12) */}
          <div className="md:col-span-8 grid grid-cols-2 sm:grid-cols-3 gap-6">
            <div className="space-y-3">
              <h4 className="font-mono text-xs uppercase tracking-wider text-[#e5e5e5]">
                Product
              </h4>
              <ul className="space-y-2">
                <li>
                  <a href="#interactive-demo" className="hover:text-white transition-colors">
                    Interactive Simulator
                  </a>
                </li>
                <li>
                  <a href="#how-it-works" className="hover:text-white transition-colors">
                    Detection Pipeline
                  </a>
                </li>
                <li>
                  <a href="#features" className="hover:text-white transition-colors">
                    Core Capabilities
                  </a>
                </li>
                <li>
                  <a href="#technology" className="hover:text-white transition-colors">
                    Standards & ITU-R
                  </a>
                </li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="font-mono text-xs uppercase tracking-wider text-[#e5e5e5]">
                Accessibility
              </h4>
              <ul className="space-y-2">
                <li>
                  <a href="#technology" className="hover:text-white transition-colors">
                    W3C WCAG 2.2 §2.3.1
                  </a>
                </li>
                <li>
                  <a href="#technology" className="hover:text-white transition-colors">
                    ITU-R BT.1702 Metrics
                  </a>
                </li>
                <li>
                  <a href="#faq" className="hover:text-white transition-colors">
                    Epilepsy FAQ
                  </a>
                </li>
                <li>
                  <a href="#install" className="hover:text-white transition-colors">
                    Browser Support
                  </a>
                </li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="font-mono text-xs uppercase tracking-wider text-[#e5e5e5]">
                Resources
              </h4>
              <ul className="space-y-2">
                <li>
                  <a href="#install" className="hover:text-white transition-colors">
                    Chrome Web Store
                  </a>
                </li>
                <li>
                  <a href="#features" className="hover:text-white transition-colors">
                    Privacy Protocol
                  </a>
                </li>
                <li>
                  <a href="#technology" className="hover:text-white transition-colors">
                    Clinical Research
                  </a>
                </li>
                <li>
                  <a href="#faq" className="hover:text-white transition-colors">
                    Troubleshooting
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Medical & Legal Accessibility Disclaimer */}
        <div className="p-4 rounded-xl bg-[#0f0f0f] border border-[#1f1f1f] text-[11px] leading-relaxed text-[#737373] space-y-1">
          <p className="font-medium text-[#a3a3a3] uppercase font-mono tracking-wider">
            Assistive Technology & Health Notice:
          </p>
          <p>
            Vision Guard is an accessibility software extension designed to mitigate exposure to rapid flickering, high-contrast strobes, and alternating color transitions in web video. It is not an FDA-cleared medical device, does not provide medical diagnoses, and cannot guarantee the absolute prevention of seizures in all individuals. Anyone diagnosed with photosensitive epilepsy (PSE) should continue adhering to prescribed medical care and professional neurological consultation.
          </p>
        </div>

        {/* Bottom Row */}
        <div className="pt-6 border-t border-[#1a1a1a] flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-[11px]">
          <div>
            © 2026 Vision Guard Project. All rights reserved.
          </div>

          <div className="flex items-center gap-4">
            <span className="text-[#525252]">Crafted for viewer calm and visual accessibility</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
