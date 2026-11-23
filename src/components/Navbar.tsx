"use client";

import { ArrowUpRight,Menu,ShieldCheck,X } from "lucide-react";
import Link from "next/link";
import { useEffect,useState } from "react";
import { Logo } from "./Logo";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { label: "Product", href: "#interactive-demo" },
    { label: "How It Works", href: "#how-it-works" },
    { label: "Features", href: "#features" },
    { label: "Technology", href: "#technology" },
    { label: "FAQ", href: "#faq" },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-[#090909]/90 backdrop-blur-md border-b border-[#262626]/80 py-3 shadow-[0_4px_30px_rgba(0,0,0,0.5)]"
          : "bg-[#090909]/40 backdrop-blur-sm border-b border-[#262626]/30 py-4"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Brand Logo & Wordmark */}
          <Link
            href="/"
            className="flex items-center gap-3 group focus:outline-none focus-visible:ring-1 focus-visible:ring-sky-400 rounded-sm"
          >
            <div className="p-1 rounded-md bg-[#141414] border border-[#262626] group-hover:border-[#38bdf8]/40 transition-colors">
              <Logo size={24} />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-semibold tracking-[0.16em] text-sm text-[#f5f5f5] group-hover:text-white transition-colors">
                VISION GUARD
              </span>
              <span className="hidden sm:inline-block text-[10px] font-mono px-1.5 py-0.5 rounded border border-[#262626] text-[#a3a3a3] bg-[#141414]">
                v0.3.6 · preview
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 bg-[#141414]/60 p-1 rounded-full border border-[#262626]/80">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="px-3.5 py-1.5 text-xs text-[#a3a3a3] hover:text-[#f5f5f5] rounded-full hover:bg-[#1c1c1c] transition-all duration-200"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Action CTAs */}
          <div className="hidden md:flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#737373] px-2.5 py-1 rounded bg-[#141414] border border-[#262626]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>Manifest V3</span>
            </div>

            <a
              href="#install"
              className="relative group overflow-hidden inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-white bg-[#141414] hover:bg-[#1c1c1c] border border-[#262626] hover:border-sky-500/50 rounded-lg shadow-sm transition-all duration-200"
            >
              <span>Get Extension</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-[#a3a3a3] group-hover:text-sky-400 transition-colors" />
            </a>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-2">
            <a
              href="#install"
              className="px-3 py-1.5 text-xs font-medium text-white bg-[#1c1c1c] border border-[#262626] rounded-md"
            >
              Get Extension
            </a>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 rounded-md text-[#a3a3a3] hover:text-white border border-[#262626] bg-[#141414]"
              aria-label="Toggle menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <nav aria-label="Page sections" className="md:hidden border-b border-[#262626] bg-[#090909]/95 backdrop-blur-xl px-4 py-4 space-y-2 mt-2">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 text-sm text-[#a3a3a3] hover:text-white hover:bg-[#141414] rounded-md"
            >
              {link.label}
            </a>
          ))}
          <div className="pt-2 border-t border-[#262626] flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-[11px] text-[#737373] font-mono">
              <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
              Manifest V3 · Experimental
            </span>
            <span className="text-[11px] font-mono text-[#525252]">
              Free & Open Source
            </span>
          </div>
        </nav>
      )}
    </header>
  );
}
