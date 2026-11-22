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
  title: "Vision Guard — A safer way to experience video",
  description:
    "Vision Guard identifies potentially hazardous flashing sequences in YouTube videos and applies protective visual filtering at detected timestamps without interrupting playback.",
  keywords: [
    "photosensitive epilepsy",
    "seizure protection",
    "video filtering",
    "strobe detection",
    "accessibility extension",
    "YouTube safety",
    "WCAG 2.2",
    "ITU-R BT.1702",
  ],
  authors: [{ name: "Vision Guard Labs" }],
  openGraph: {
    title: "Vision Guard — Watch freely. Stay aware.",
    description:
      "Protective visual filtering for photosensitive viewers on YouTube. Keep playback smooth while obscuring hazardous strobe sequences.",
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
