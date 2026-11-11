import type { Metadata } from "next";
import SmoothScroll from "@/components/SmoothScroll";
import { SiteConfigProvider } from "@/context/SiteConfigContext";
import "./globals.css";

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
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preload" as="image" href="/frames-opt/frame_0001.webp?v=clean3" media="(min-width: 768px)" fetchPriority="high" />
        <link rel="preload" as="image" href="/frames-mobile/frame_0001.webp?v=clean4" media="(max-width: 767px)" fetchPriority="high" />
        <link rel="preload" as="image" href="/images/white-marble.jpg" media="(min-width: 768px)" fetchPriority="high" />
        <link rel="preload" as="image" href="/images/house-view-1.jpg" media="(min-width: 768px)" />
        <link rel="preload" as="image" href="/images/house-view-2.jpg" media="(min-width: 768px)" />
      </head>
      <body className="bg-black text-white selection:bg-amber-400 selection:text-black">
        <SiteConfigProvider>
          <SmoothScroll>{children}</SmoothScroll>
        </SiteConfigProvider>
      </body>
    </html>
  );
}
