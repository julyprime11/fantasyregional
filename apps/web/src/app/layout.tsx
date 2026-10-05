import type {
  Metadata,
  Viewport,
} from "next";

import {
  Geist,
  Geist_Mono,
} from "next/font/google";

import "./globals.css";

const geistSans = Geist({
  variable:
    "--font-geist-sans",

  subsets: [
    "latin",
  ],
});

const geistMono = Geist_Mono({
  variable:
    "--font-geist-mono",

  subsets: [
    "latin",
  ],
});

export const metadata: Metadata = {
  metadataBase:
    new URL(
      "https://fantasyregional.com",
    ),

  title: {
    default:
      "Fantasy Regional",

    template:
      "%s · Fantasy Regional",
  },

  description:
    "Fantasy de fútbol regional con ligas, jornadas, alineaciones y votaciones.",

  applicationName:
    "Fantasy Regional",

  manifest:
    "/manifest.webmanifest",

  appleWebApp: {
    capable:
      true,

    title:
      "Fantasy Regional",

    statusBarStyle:
      "black-translucent",
  },

  formatDetection: {
    telephone:
      false,
  },

  icons: {
    icon: [
      {
        url:
          "/icon-192.png",

        sizes:
          "192x192",

        type:
          "image/png",
      },

      {
        url:
          "/icon-512.png",

        sizes:
          "512x512",

        type:
          "image/png",
      },
    ],

    apple: [
      {
        url:
          "/apple-touch-icon.png",

        sizes:
          "180x180",

        type:
          "image/png",
      },
    ],
  },
};

export const viewport: Viewport = {
  width:
    "device-width",

  initialScale:
    1,

  viewportFit:
    "cover",

  themeColor:
    "#0f3d2e",
};

export default function RootLayout({
  children,
}: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-screen bg-[#f5f6f4] font-sans text-zinc-950 antialiased">
        {children}
      </body>
    </html>
  );
}