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
  metadataBase: new URL("https://avijitvilla.vercel.app"),
  title: {
    default: "Avijit Villa | Luxury 3D Architectural Experience",
    template: "%s | Avijit Project",
  },
  applicationName: "Avijit Project",
  description: "Bespoke architectural residence showcased through interactive 3D scroll canvas",
  verification: {
    google: "4cNcV9J0qgYAa9nLDHNlt8Yhn0du1ZjCu-9uD0u0hAo",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.png", type: "image/png", sizes: "256x256" },
      { url: "/images/avijit-favicon.png", type: "image/png", sizes: "256x256" },
    ],
    shortcut: "/favicon.ico",
    apple: [
      { url: "/apple-icon.png", sizes: "180x180", type: "image/png" },
      { url: "/apple-touch-icon.png", sizes: "256x256", type: "image/png" },
    ],
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://avijitvilla.vercel.app",
    siteName: "Avijit Project",
    title: "Avijit Villa | Luxury 3D Architectural Experience",
    description: "Bespoke architectural residence showcased through interactive 3D scroll canvas",
    images: [
      {
        url: "/images/white-marble.jpg",
        width: 1200,
        height: 630,
        alt: "Avijit Villa",
      },
    ],
  },
  appleWebApp: {
    capable: true,
    title: "Avijit Project",
    statusBarStyle: "black-translucent",
  },
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Avijit Project",
  alternateName: ["Avijit Villa", "Avijit Project Villa"],
  url: "https://avijitvilla.vercel.app",
  publisher: {
    "@type": "Organization",
    name: "Avijit Project",
    logo: {
      "@type": "ImageObject",
      url: "https://avijitvilla.vercel.app/icon.png",
      width: 256,
      height: 256,
    },
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
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" type="image/png" sizes="256x256" href="/icon.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-icon.png" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
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
