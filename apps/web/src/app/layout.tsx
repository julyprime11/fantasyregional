import type { Metadata } from "next";
import {
  Geist,
  Geist_Mono,
} from "next/font/google";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Fantasy Regional",
    template: "%s · Fantasy Regional",
  },
  description:
    "Fantasy de fútbol regional con ligas, jornadas, alineaciones y votaciones.",
  applicationName:
    "Fantasy Regional",
  themeColor: "#0f3d2e",
};

export default function RootLayout({
  children,
}: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable}`}
    >
      <body className="min-h-screen bg-[#f5f6f4] font-sans text-zinc-950 antialiased">
        {children}
      </body>
    </html>
  );
}