import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { InteractiveDemo } from "@/components/InteractiveDemo";
import { HowItWorks } from "@/components/HowItWorks";
import { Features } from "@/components/Features";
import { TechnologyStandards } from "@/components/TechnologyStandards";
import { FAQ } from "@/components/FAQ";
import { CTASection } from "@/components/CTASection";
import { Footer } from "@/components/Footer";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#090909] text-[#f5f5f5] selection:bg-sky-500/30 selection:text-white relative">
      <Navbar />
      <main>
        <Hero />
        <InteractiveDemo />
        <HowItWorks />
        <Features />
        <TechnologyStandards />
        <FAQ />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}
