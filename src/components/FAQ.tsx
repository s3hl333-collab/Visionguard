"use client";

import { ChevronDown,HelpCircle } from "lucide-react";
import { useState } from "react";

interface FAQItem {
  question: string;
  answer: string;
}

const FAQS: FAQItem[] = [
  {
    question: "Does Vision Guard pause or stop my YouTube videos?",
    answer: "Before viewing, an initial pass plays with visuals covered and audio muted while the extension analyzes accessible frames. It then rewinds and restores your audio and speed settings for replay. During replay, timestamp-based covering does not intentionally pause playback. Expect an initial wait approximately equal to the video duration. Scans interrupted by ads or inaccessible frames may need restarting.",
  },
  {
    question: "How does Vision Guard detect dangerous flashing sequences?",
    answer: "For YouTube, browser video-frame callbacks and Canvas analyze the existing player during a covered pass. Local files use sampled seeking. Experimental luminance, red-intensity and edge heuristics identify potential intervals. There is no certified standards compliance; brief events can be missed. Access restrictions are never bypassed.",
  },
  {
    question: "Does Vision Guard upload my viewing history or video frames to any server?",
    answer: "The extension processes local files on this device and contains no upload or telemetry service. YouTube itself still makes its normal network requests.",
  },
  {
    question: "Can I customize the visual filter appearance?",
    answer: "Choose an opaque cover or experimental blur and dimming for detected intervals during replay. Scanning, unknown gaps and failures always use an opaque cover. Blur can preserve flashing. Sensitivity adjustment and monochrome mode are not implemented.",
  },
  {
    question: "What flash frequencies are most hazardous for photosensitive epilepsy?",
    answer: "This prototype cannot determine individual seizure risk. A missed detection or an empty hazard timeline does not establish safety. It has not undergone clinical validation.",
  },
  {
    question: "Does Vision Guard work on browsers other than Chrome?",
    answer: "The prototype targets Chrome Manifest V3. Other Chromium browsers have not been validated, and no Firefox edition is included.",
  },
  {
    question: "Does this replace medical treatment or clinical advice?",
    answer: "No. This is an experimental assistive tool, not a medically validated seizure-prevention device or a replacement for professional medical advice.",
  },
];

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <section id="faq" className="py-24 md:py-32 bg-[#090909] border-t border-[#1c1c1c] relative">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#262626] bg-[#141414] text-xs font-mono text-[#a3a3a3]">
            <HelpCircle className="w-3.5 h-3.5 text-sky-400" />
            <span>COMMON QUESTIONS</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-semibold tracking-tight text-[#f5f5f5]">
            Frequently Asked Questions
          </h2>

          <p className="text-base text-[#a3a3a3] leading-relaxed">
            Everything you need to know about Vision Guard&apos;s protection mechanisms, browser privacy, and experimental limitations.
          </p>
        </div>

        {/* FAQ Accordion */}
        <div className="space-y-3">
          {FAQS.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className="rounded-xl border border-[#222222] bg-[#121212] overflow-hidden transition-colors"
              >
                <button
                  onClick={() => toggle(idx)}
                  className="w-full py-4 px-6 text-left flex items-center justify-between gap-4 hover:bg-[#161616] transition-colors focus:outline-none"
                  aria-expanded={isOpen}
                >
                  <span className="text-sm sm:text-base font-medium text-[#f5f5f5]">
                    {faq.question}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-[#737373] shrink-0 transition-transform duration-200 ${
                      isOpen ? "rotate-180 text-sky-400" : ""
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className="px-6 pb-5 pt-1 text-xs sm:text-sm text-[#a3a3a3] leading-relaxed border-t border-[#1a1a1a]">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
