import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "Poker Table",
  description: "A live Texas Hold'em poker table.",
  applicationName: "Poker Table",
  manifest: "/poker.webmanifest",
  icons: { icon: "/poker/icon.svg" },
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "Poker Table" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0a0a0a",
  viewportFit: "cover",
};

export default function PokerLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
