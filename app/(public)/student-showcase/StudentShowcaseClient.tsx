// @ts-nocheck
"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { FloatingDecorations } from "../../../components/public/floating-decorations";

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] } },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const categories = [
  { emoji: "🎤", title: "Public speaking videos", desc: "Recorded presentations of children delivering speeches on their chosen subjects.", tag: "Communication" },
  { emoji: "💰", title: "Money skills projects", desc: "Simulated household budgets and business plans created in our finance sandbox.", tag: "Finance" },
  { emoji: "🤖", title: "AI readiness projects", desc: "Custom-designed prompt logs and chatbot applications created by senior students.", tag: "Technology" },
  { emoji: "🏆", title: "Confidence challenge certificates", desc: "Credential proofs awarded to students who successfully passed active presentation trials.", tag: "Achievements" },
  { emoji: "💬", title: "Parent-approved testimonials", desc: "Direct reviews and stories from families tracking behavioral improvement.", tag: "Reviews" },
  { emoji: "🔄", title: "Before-after speaking observations", desc: "Comparative progress tracking analyzing articulation rate, eye contact, and volume.", tag: "Diagnostics" },
  { emoji: "🎓", title: "End-of-level presentations", desc: "Capstone speech submissions delivered to coaches and peer groups before graduation.", tag: "Graduation" },
];

export function StudentShowcaseClient() {
  return (
    <div className="ssp-showcase-page">
      {/* ── HERO ── */}
      <section className="ssp-hero">
        <FloatingDecorations count={10} />
        <div className="container ssp-hero-container">
          <motion.div className="ssp-hero-content text-center" initial="hidden" animate="visible" variants={fadeInUp}>
            <span className="ssp-badge-pill">✨ Portfolio Coming Soon</span>
            <h1>Student growth should be visible.</h1>
            <p className="ssp-hero-sub">
              TrueLern students complete activities, presentations, projects and milestones that help parents see confidence, communication and practical skills developing over time.
            </p>
            <div className="ssp-hero-actions">
              <Link href="/book-demo" className="ssp-btn-primary">Book Free Demo</Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── INTRO ── */}
      <section className="ssp-section ssp-intro">
        <div className="container">
          <div className="ssp-grid-intro">
            <motion.div className="ssp-intro-content" initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={fadeInUp}>
              <span className="ssp-section-tag">Showcase Vision</span>
              <h2>A Dedicated Portal for Child Portfolios</h2>
              <p>Instead of just receiving grades, parents will have access to a digital gallery displaying direct evidence of skill building.</p>
              <div className="ssp-milestone-points">
                <div className="ssp-point glass-panel">
                  <strong>🎯 Real Artifacts</strong>
                  <p>Witness actual projects and speech records, not theoretical metrics.</p>
                </div>
                <div className="ssp-point glass-panel">
                  <strong>📈 Measurable Progression</strong>
                  <p>Compare baseline performance with final level capstones easily.</p>
                </div>
              </div>
            </motion.div>

            <motion.div className="ssp-intro-visual" initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={fadeInUp}>
              <div className="ssp-showcase-mockup glass-panel">
                <div className="ssp-mockup-header">
                  <span className="ssp-mock-dot" />
                  <span className="ssp-mock-dot" />
                  <span className="ssp-mock-dot" />
                  <span className="ssp-mock-title">Student Portfolio: Aisha (Age 11)</span>
                </div>
                <div className="ssp-mockup-body text-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/img/public/coach_teacher.png" alt="Student Presentation Illustration" className="ssp-mock-img bob-animation" />
                  <div className="ssp-mockup-stats">
                    <span>🎤 Pitch Score: 95%</span>
                    <span>📈 Growth: +24%</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── CATEGORIES ── */}
      <section className="ssp-section ssp-gallery-section">
        <div className="container">
          <div className="ssp-section-header text-center">
            <span className="ssp-section-tag">Upcoming Releases</span>
            <h2>Future Categories Showcase</h2>
            <p className="ssp-section-sub">Here is what parents will soon be able to inspect and track inside the diagnostic showcase portal.</p>
          </div>

          <motion.div className="ssp-gallery-grid" initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} variants={staggerContainer}>
            {categories.map((cat, index) => (
              <motion.div key={index} className="ssp-showcase-card glass-panel" variants={fadeInUp} whileHover={{ y: -6 }} transition={{ duration: 0.25 }}>
                <div className="ssp-card-icon-wrap">
                  <span className="ssp-card-emoji">{cat.emoji}</span>
                  <span className="ssp-card-tag">{cat.tag}</span>
                </div>
                <h3>{cat.title}</h3>
                <p>{cat.desc}</p>
                <span className="ssp-coming-soon-label">Coming Soon</span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── CERTIFICATES ── */}
      <section className="ssp-section ssp-certificates">
        <div className="container">
          <div className="ssp-grid-certificates">
            <motion.div className="ssp-cert-visual" initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={fadeInUp}>
              <div className="ssp-certificate-mockup glass-panel text-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/img/public/trophy_star.png" alt="Certificates and Achievement Badges" className="ssp-cert-trophy bob-animation" />
                <div className="ssp-cert-seal">🏆</div>
                <h4>Certificate of Mastery</h4>
                <p>Awarded to young creators for prompt architecture and budgeting models.</p>
              </div>
            </motion.div>

            <motion.div className="ssp-cert-content" initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={fadeInUp}>
              <span className="ssp-section-tag">Certifications</span>
              <h2>Achievement Badges &amp; Certificates</h2>
              <p>As students progress through learning blocks, they earn certificates and shareable badges that acknowledge their problem-solving capability.</p>
              <ul className="ssp-badge-list">
                <li>🏅 <strong>Confidence Level 1 Cleared</strong> - Confirmed speech pacing.</li>
                <li>⚙️ <strong>AI Logic Master</strong> - Successfully created multi-node assistant templates.</li>
                <li>📈 <strong>Wealth Sandbox Graduate</strong> - Allocated budget parameters correctly.</li>
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="ssp-cta">
        <div className="container">
          <div className="ssp-cta-card glass-panel text-center">
            <h2>Watch Your Child Build Practical Competence</h2>
            <p>Every child starts with a trial evaluation. Receive a detailed developmental diagnostic report before choosing a plan.</p>
            <Link href="/book-demo" className="ssp-btn-cta">Book Free Demo</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
