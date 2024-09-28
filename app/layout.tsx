import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "YouTube Video Downloader - Download High-Quality YouTube Videos",
  description: "Easily download high-quality YouTube videos up to 4K resolution for free. No registration required. Fast and easy to use.",
  keywords: "YouTube downloader, download YouTube videos, YouTube video downloader, free YouTube download, 4K video download",
  openGraph: {
    title: "YouTube Video Downloader",
    description: "Download high-quality YouTube videos effortlessly.",
    url: "https://yourwebsite.com",
    siteName: "YouTube Video Downloader",
    images: [
      {
        url: "https://yourwebsite.com/og-image.jpg",
        width: 800,
        height: 600,
        alt: "YouTube Video Downloader",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "YouTube Video Downloader",
    description: "Download high-quality YouTube videos effortlessly.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
