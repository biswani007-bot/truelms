import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://truelern.com"),
  title: {
    default: "TrueLern — Global Live Cohort Learning Platform",
    template: "%s | TrueLern",
  },
  description:
    "TrueLern delivers instructor-led live cohort programs in engineering, product, and technology. Join a global community of ambitious learners.",
  keywords: [
    "live cohort learning",
    "online education",
    "engineering courses",
    "LMS",
    "bootcamp",
    "TrueLern",
  ],
  authors: [{ name: "TrueLern" }],
  creator: "TrueLern",
  icons: {
    icon: "/Truelernlogo_favicon.png",
    shortcut: "/Truelernlogo_favicon.png",
    apple: "/Truelernlogo_favicon.png",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "TrueLern",
    title: "TrueLern — Global Live Cohort Learning Platform",
    description:
      "Instructor-led live cohort programs in engineering, product, and technology.",
    images: [
      {
        url: "/TrueernLogo_primary.png",
        width: 1200,
        height: 630,
        alt: "TrueLern — Live Cohort Learning",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "TrueLern — Global Live Cohort Learning Platform",
    description:
      "Instructor-led live cohort programs in engineering, product, and technology.",
    images: ["/TrueernLogo_primary.png"],
    creator: "@truelern",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
