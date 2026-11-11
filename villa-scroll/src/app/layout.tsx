import type { Metadata } from "next";
import {
  Cinzel,
  Cormorant_Garamond,
  Playfair_Display,
  Plus_Jakarta_Sans,
  Space_Mono,
} from "next/font/google";
import SmoothScroll from "@/components/SmoothScroll";
import { SiteConfigProvider } from "@/context/SiteConfigContext";
import "./globals.css";

const cinzel = Cinzel({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--next-font-cinzel",
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "600"],
  style: ["normal", "italic"],
  variable: "--next-font-cormorant",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--next-font-playfair",
  display: "swap",
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--next-font-sans",
  display: "swap",
});

const spaceMono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--next-font-space-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Avijit Villa | Luxury 3D Architectural Experience",
  description: "Bespoke architectural residence showcased through interactive 3D scroll canvas",
  icons: {
    icon: [
      { url: "/images/avijit-favicon.png?v=2", type: "image/png" },
      { url: "/icon.png", type: "image/png" },
    ],
    shortcut: "/images/avijit-favicon.png?v=2",
    apple: "/apple-icon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const fontVars = `${cinzel.variable} ${cormorant.variable} ${playfair.variable} ${plusJakarta.variable} ${spaceMono.variable}`;

  return (
    <html lang="en" className={`dark ${fontVars}`}>
      <head>
        <link rel="preload" as="image" href="/frames-opt/frame_0001.webp?v=clean7" media="(min-width: 768px)" fetchPriority="high" />
        <link rel="preload" as="image" href="/frames-mobile/frame_0001.webp?v=clean7" media="(max-width: 767px)" fetchPriority="high" />
      </head>
      <body className="bg-black text-white selection:bg-amber-400 selection:text-black">
        <SiteConfigProvider>
          <SmoothScroll>{children}</SmoothScroll>
        </SiteConfigProvider>
      </body>
    </html>
  );
}
