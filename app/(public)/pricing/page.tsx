// @ts-nocheck
"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { FAQAccordion } from "../../../components/public/FAQAccordion";
import { WaveSeparator } from "../../../components/public/wave-separator";
import { FloatingDecorations } from "../../../components/public/floating-decorations";

/**
 * Pricing Page — uses ep-pricing-page design system from Pricing.css
 * NOTE: Pricing amounts are placeholders pending business confirmation.
 * The UI is production-ready; update the plan data below with real values.
 */

const plans = [
  {
    icon: "🌅",
    title: "Junior Foundation",
    age: "Ages 6 to 10",
    price: "$99 to $149",
    priceNote: "CAD",
    period: "month",
    features: [
      "Live classes",
      "Activities",
      "Parent updates",
      "Milestone tasks",
    ],
    cta: "Book Free Demo",
    ctaHref: "/book-demo",
    highlight: false,
  },
  {
    icon: "🚀",
    title: "Future-Ready Builders",
    age: "Ages 9 to 14",
    price: "$149 to $249",
    priceNote: "CAD",
    period: "month",
    features: [
      "Live classes",
      "Worksheets",
      "Projects",
      "Progress reports and showcase",
    ],
    cta: "Book Free Demo",
    ctaHref: "/book-demo",
    highlight: true,
    badge: "Most Popular",
  },
  {
    icon: "💎",
    title: "Premium Small Batch",
    age: "Families wanting more attention",
    price: "$249 to $349",
    priceNote: "CAD",
    period: "month",
    features: [
      "Smaller group",
      "Master coach",
      "Additional feedback",
    ],
    cta: "Book Free Demo",
    ctaHref: "/book-demo",
    highlight: false,
  },
  {
    icon: "⚡",
    title: "Workshops",
    age: "Trying one skill area",
    price: "$19 to $49",
    priceNote: "CAD",
    period: "session",
    features: [
      "Single topic session or parent-child workshop",
    ],
    cta: "Book Free Demo",
    ctaHref: "/book-demo",
    highlight: false,
  },
];

const pricingFaqs = [
  {
    q: "How does pricing work for TrueLern programs?",
    a: "TrueLern offers structured live cohort programs. Each program is a 36-class level with a one-time enrollment fee. Book a free demo first — we will match your child to the right program and share detailed pricing after the evaluation session.",
  },
  {
    q: "Is there a free trial or evaluation class?",
    a: "Yes. Every child starts with a completely free 45-minute live evaluation class. There is no payment required for the demo. You receive a detailed placement report after the session.",
  },
  {
    q: "What is the refund policy?",
    a: "We offer a full refund for cancellations made before the third live class of your enrolled level. Contact our support team within that window for a hassle-free refund.",
  },
  {
    q: "Can I pause a program if my child needs a break?",
    a: "Yes. We offer a 30-day program pause option once per level enrollment. Simply notify your batch coordinator at least 5 days in advance.",
  },
  {
    q: "Are there any hidden fees?",
    a: "No. The enrollment fee covers the full 36-class level, all course materials, progress reports, and the graduation ceremony. There are no additional charges.",
  },
];

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

export default function PricingPage() {
  return (
    <div className="ep-pricing-page">
      {/* ── HERO ── */}
      <section className="ep-hero">
        <div className="ep-hero-bg">
          <div className="ep-orb ep-orb-blue" />
          <div className="ep-orb ep-orb-purple" />
          <div className="ep-orb ep-orb-gold" />
          {["💰", "📊", "🎓", "⭐", "🏆", "📈", "✨", "🌟"].map((icon, i) => (
            <motion.span
              key={i}
              className="ep-float-icon"
              style={{ left: `${8 + i * 11}%`, top: `${15 + (i % 3) * 22}%` }}
              animate={{ y: [0, -16, 0], rotate: [0, i % 2 === 0 ? 8 : -8, 0] }}
              transition={{ duration: 3 + i * 0.4, repeat: Infinity, ease: "easeInOut", delay: i * 0.3 }}
            >
              {icon}
            </motion.span>
          ))}
        </div>

        <div className="container ep-hero-grid">
          <motion.div className="ep-hero-content" variants={fadeInUp} initial="hidden" animate="visible">
            <span className="ep-badge-pill">💳 Transparent Pricing</span>
            <h1>Invest in skills that last a lifetime.</h1>
            <p className="ep-hero-sub">
              Every TrueLern program starts with a free evaluation class. We match your child to the right cohort and program level before any commitment.
            </p>
            <div className="ep-hero-actions">
              <Link href="/book-demo" className="ep-btn-primary">Book Free Demo →</Link>
              <Link href="/programs" className="ep-btn-ghost">View All Programs</Link>
            </div>
          </motion.div>

          <motion.div
            className="ep-hero-visual"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="ep-visual-image-wrapper">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/img/public/pricing_hero_illus.png"
                alt="Children learning in live cohort sessions"
                className="ep-hero-illus-img"
              />
            </div>
            <motion.div
              className="ep-float-badge ep-float-badge-1 ep-float-badge-1-anim"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
            >
              <span>🎯</span>
              <div>
                <strong>Free Evaluation</strong>
                <small>No commitment needed</small>
              </div>
            </motion.div>
            <motion.div
              className="ep-float-badge ep-float-badge-2 ep-float-badge-2-anim"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.65 }}
            >
              <span>👥</span>
              <div>
                <strong>Max 5 Kids/Batch</strong>
                <small>Small, focused cohorts</small>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <WaveSeparator color="var(--light-bg)" direction="bottom" />

      {/* ── PLANS ── */}
      <section className="ep-plans-section">
        <div className="container">
          <div className="ep-section-header">
            <span className="ep-section-tag">Our Programs</span>
            <h2>Choose the right program for your child</h2>
            <p className="ep-section-sub">
              All programs start with a free demo class. Enrollment opens only after we confirm the right fit.
            </p>
          </div>

          <motion.div
            className="ep-plans-grid"
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
          >
            {plans.map((plan) => (
              <div key={plan.title} className="ep-plan-card-wrap">
                <motion.div
                  className={`ep-plan-card${plan.highlight ? " ep-plan-recommended" : ""}`}
                  variants={fadeInUp}
                  whileHover={{ y: -6, transition: { duration: 0.25 } }}
                >
                  {plan.highlight && plan.badge && (
                    <div className="ep-recommended-tag">{plan.badge}</div>
                  )}

                  <div className="ep-plan-icon-wrap">
                    <span className="ep-plan-icon">{plan.icon}</span>
                  </div>

                  <div className="ep-plan-header">
                    <h3>{plan.title}</h3>
                    <span className="ep-plan-age">{plan.age}</span>
                    <div className="ep-plan-price">
                      <span className="ep-price-sub">{plan.priceNote}</span>
                      <span className="ep-price-amount">{plan.price}</span>
                      <span className="ep-price-period">/{plan.period}</span>
                    </div>
                  </div>

                  <hr className="ep-plan-divider" />

                  <ul className="ep-plan-features">
                    {plan.features.map((f) => (
                      <li key={f}>
                        <span className="ep-check">✓</span>
                        {f}
                      </li>
                    ))}
                  </ul>

                  <Link
                    href={plan.ctaHref}
                    className={`ep-btn-plan${plan.highlight ? " ep-btn-plan-highlight" : ""}`}
                  >
                    {plan.cta}
                  </Link>
                </motion.div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── NOTE CARD ── */}
      <section className="ep-note-section">
        <div className="container ep-note-wrapper">
          <motion.div
            className="ep-note-card"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <span className="ep-note-icon">💡</span>
            <div className="ep-note-content">
              <p>
                <strong>All pricing is confirmed after your free evaluation class.</strong> We recommend the right program and level based on your child&apos;s assessment — no guesswork required.
              </p>
            </div>
            <Link href="/contact" className="ep-note-btn">Talk to Us →</Link>
          </motion.div>
        </div>
      </section>

      <WaveSeparator color="var(--light-surface-elevated)" direction="bottom" flip={true} />

      {/* ── POLICY SECTION ── */}
      <section className="ep-policy-section">
        <div className="container">
          <div className="ep-policy-grid">
            <motion.div
              className="ep-policy-content"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-80px" }}
              variants={fadeInUp}
            >
              <span className="ep-section-tag">Peace of Mind</span>
              <h2>Transparent &amp; Fair Policies</h2>
              <p className="ep-policy-desc">
                We believe in building trust with every family. Our refund and pause policies are designed to be simple and fair.
              </p>
              <div className="ep-policy-badges">
                <div className="ep-policy-badge">
                  <span className="ep-badge-icon">✅</span>
                  <span>Full refund before the 3rd live class</span>
                </div>
                <div className="ep-policy-badge">
                  <span className="ep-badge-icon">⏸️</span>
                  <span>One 30-day program pause per level</span>
                </div>
                <div className="ep-policy-badge">
                  <span className="ep-badge-icon">🎓</span>
                  <span>Free evaluation class — no strings attached</span>
                </div>
                <div className="ep-policy-badge">
                  <span className="ep-badge-icon">👥</span>
                  <span>Max 5 children per cohort — guaranteed</span>
                </div>
              </div>
            </motion.div>

            <motion.div
              className="ep-transparency-card"
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="ep-trans-header">
                <span className="ep-trans-icon">📋</span>
                <h3>What&apos;s Included in Every Program</h3>
              </div>
              <ul className="ep-trans-list">
                <li>
                  <strong>Live Weekly Sessions</strong>
                  <span>All 36 live classes with an expert TrueLern coach</span>
                </li>
                <li>
                  <strong>Parent Progress Reports</strong>
                  <span>Monthly detailed reports with coach observations and home tips</span>
                </li>
                <li>
                  <strong>Activity Materials</strong>
                  <span>Digital activity decks, worksheets, and prompt cards</span>
                </li>
                <li>
                  <strong>Parent Dashboard</strong>
                  <span>Track attendance, milestones, and weekly updates in real time</span>
                </li>
                <li>
                  <strong>Level Graduation &amp; Certificate</strong>
                  <span>End-of-level showcase event and a personalized certificate</span>
                </li>
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      <WaveSeparator color="var(--light-bg)" direction="bottom" />

      {/* ── FAQ ── */}
      <section style={{ padding: "5rem 0" }}>
        <div className="container" style={{ maxWidth: "780px" }}>
          <div className="ep-section-header">
            <span className="ep-section-tag">Common Questions</span>
            <h2>Pricing FAQs</h2>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {pricingFaqs.map((faq) => (
              <FAQAccordion key={faq.q} q={faq.q} a={faq.a} />
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="ep-cta-section">
        <div className="ep-cta-bg">
          <div className="ep-cta-orb ep-cta-orb-1" />
          <div className="ep-cta-orb ep-cta-orb-2" />
          {["🌟", "🎓", "💡", "🏆"].map((icon, i) => (
            <motion.span
              key={i}
              className="ep-cta-float-icon"
              style={{ left: `${15 + i * 20}%`, top: `${20 + (i % 2) * 40}%` }}
              animate={{ y: [0, -14, 0] }}
              transition={{ duration: 3.5 + i * 0.5, repeat: Infinity, ease: "easeInOut", delay: i * 0.6 }}
            >
              {icon}
            </motion.span>
          ))}
        </div>

        <div className="container ep-cta-inner">
          <motion.div
            className="ep-cta-box"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="ep-cta-trust">
              <span>✅ Free Demo</span>
              <span>·</span>
              <span>👥 Max 5 Kids</span>
              <span>·</span>
              <span>🎓 Level Graduation</span>
              <span>·</span>
              <span>📊 Parent Reports</span>
            </div>

            <h2>Ready to start your child&apos;s journey?</h2>
            <p>
              Book a free 45-minute evaluation class. No payment required. We match your child to the perfect cohort level and share all pricing details after the session.
            </p>

            <div className="ep-cta-actions">
              <Link href="/book-demo" className="ep-btn-cta">
                Book a Free Demo Class
                <span className="ep-cta-btn-shine" aria-hidden="true" />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
