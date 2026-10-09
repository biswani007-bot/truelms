import React from "react";
import Link from "next/link";
import { announcementRepository } from "../../repositories/announcement.repository";
import { connectDB } from "../../config/db";
import { Poppins, Nunito } from "next/font/google";

/* ── Shared public component CSS (Navbar + Footer + Floating Actions) ── */
import "./css/components/Navbar.css";
import "./css/components/Footer.css";
import "./css/components/FloatingActions.css";
import "./css/components/FloatingDecorations.css";
import "./css/components/WaveSeparator.css";
import "./css/components/AnnouncementBar.css";

/* ── Global Vite design system ── */
import "./css/global/global.css";

/* ── Page-level CSS (all pages, loaded once) ── */
import "./css/pages/user/Home.css";
import "./css/pages/user/About.css";
import "./css/pages/user/Programs.css";
import "./css/pages/user/BookDemo.css";
import "./css/pages/user/Contact.css";
import "./css/pages/user/Pricing.css";
import "./css/pages/user/HowItWorks.css";
import "./css/pages/user/ParentProgress.css";
import "./css/pages/user/Coaches.css";
import "./css/pages/user/TeachWithUs.css";
import "./css/pages/user/FAQ.css";
import "./css/pages/user/StudentShowcase.css";
import "./css/pages/user/Referral.css";
import "./css/pages/user/Blog.css";
import "./css/pages/user/BlogPost.css";
import "./css/pages/user/JuniorFoundation.css";
import "./css/pages/user/FutureReadyBuilders.css";
import "./css/pages/user/Communication.css";
import "./css/pages/user/MoneySkills.css";
import "./css/pages/user/EmotionalIntelligence.css";
import "./css/pages/user/AIReadiness.css";
import "./css/pages/user/TimeManagement.css";
import "./css/pages/user/PracticalThinking.css";
import "./css/pages/user/LegalPages.css";
import "./css/pages/user/Login.css";
import "./css/pages/user/CampaignLanding.css";
import "./css/pages/user/CityLanding.css";
import "./css/pages/user/CRMCommunicationCenter.css";

import { ViteNavbar } from "../../components/public/vite-navbar";
import { ViteFooter } from "../../components/public/vite-footer";
import { FloatingActions } from "../../components/public/floating-actions";

const poppins = Poppins({
  weight: ["400", "500", "600", "700", "800", "900"],
  subsets: ["latin"],
  variable: "--font-poppins",
  display: "swap",
});

const nunito = Nunito({
  subsets: ["latin"],
  variable: "--font-nunito",
  display: "swap",
});

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await connectDB();

  let activeAnnouncement = null;
  try {
    activeAnnouncement = await announcementRepository.findOne({ active: true });
  } catch {
    // Non-critical
  }

  return (
    <div className={`public-layout-root ${poppins.variable} ${nunito.variable}`}>
      {/* Skip to main content — accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 focus:z-50 focus:px-4 focus:py-2 focus:bg-indigo-600 focus:text-white"
      >
        Skip to main content
      </a>

      {/* Announcement bar - Modern Marquee */}
      {activeAnnouncement && (
        <div className="announcement-bar flex w-full h-[40px] items-center overflow-hidden whitespace-nowrap relative z-[1010]" style={{ background: "linear-gradient(90deg, #072C45, #0f4c75)" }}>
          <div className="announcement-bar-track inline-flex items-center min-w-full animate-[marquee-slide_25s_linear_infinite] hover:[animation-play-state:paused] whitespace-nowrap px-[100vw]">
            <div className="announcement-content flex items-center gap-3 text-sm font-medium tracking-wide text-white">
              <span>{activeAnnouncement.message}</span>
              {activeAnnouncement.link && (
                <Link href={activeAnnouncement.link} className="announcement-link text-[#22D3EE] font-bold transition-opacity hover:opacity-85 hover:underline">
                  {activeAnnouncement.linkText || "Learn More"} &rarr;
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Navbar */}
      <ViteNavbar />

      {/* Page content */}
      <main id="main-content">{children}</main>

      {/* Footer */}
      <ViteFooter />

      {/* Floating action buttons (WhatsApp, Call, Book Demo) */}
      <FloatingActions />
    </div>
  );
}
