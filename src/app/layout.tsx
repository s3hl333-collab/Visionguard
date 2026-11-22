import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#090909",
  colorScheme: "dark",
};

export const metadata: Metadata = {
  title: "Vision Guard — Experimental video pre-scan",
  description:
    "Experimental covered pre-scan for accessible YouTube videos, followed by timestamp-based visual covering during replay. Initial scanning wait required; not medically validated.",
  keywords: [
    "photosensitive epilepsy",
    "experimental video analysis",
    "video filtering",
    "strobe detection",
    "accessibility extension",
    "YouTube pre-scan",
  ],
  authors: [{ name: "Vision Guard Labs" }],
  openGraph: {
    title: "Vision Guard — Watch freely. Stay aware.",
    description:
      "Scan accessible videos in a covered first pass, then replay with detected intervals obscured. Experimental assistive tool; no seizure-prevention guarantee.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark scroll-smooth">
      <body
        className={`${geistSans.variable} ${geistMono.variable} bg-[#090909] text-[#f5f5f5] font-sans min-h-screen flex flex-col antialiased selection:bg-sky-500/30 selection:text-white`}
      >
        {children}
      </body>
    </html>
  );
}
