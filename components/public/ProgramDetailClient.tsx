// @ts-nocheck
"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { FAQAccordion } from "./FAQAccordion";
import { FloatingDecorations } from "../../components/public/floating-decorations";
import { WaveSeparator } from "../../components/public/wave-separator";
import { InfiniteMarquee } from "../../components/public/InfiniteMarquee";

interface FAQItem {
  question: string;
  answer: string;
}

interface ProgramConfig {
  badge: string;
  title: string;
  subtitle: string;
  heroImage: string;
  heroImageAlt: string;
  heroBadge1: { icon: string; title: string; sub: string };
  heroBadge2: { icon: string; title: string; sub: string };
  metaStrip: string[];
  problemStatement: string;
  problemCards: { icon: string; title: string; desc: string }[];
  problemImage: string;
  milestones: { num: number; title: string; desc: string }[];
  goalIcon: string;
  goalHeading: string;
  goalStatement: string;
  goalBullets: { icon: string; label: string; desc: string }[];
  curriculumTitle: string;
  curriculumModules: { week: string; title: string; items: string[] }[];
  outcomes: string[];
  faqs: FAQItem[];
  ctaHeading: string;
  ctaBody: string;
  goalBgImage?: string;
}

const fadeInUp = {
  hidden: { opacity: 0, y: 40 },
  visible: (delay = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.65, delay, ease: [0.16, 1, 0.3, 1] } }),
};

const staggerContainer = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.05,
    },
  },
};

const cardReveal = {
  hidden: { opacity: 0, y: 24, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] },
  },
};

export function ProgramDetailClient({ cfg, pageClass }: { cfg: ProgramConfig; pageClass: string }) {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add("is-visible"); }),
      { threshold: 0.08, rootMargin: "0px 0px -40px 0px" }
    );
    document.querySelectorAll(`.${pageClass} .reveal`).forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [pageClass]);

  // Build flat skill list for the curriculum marquee
  const allSkills = cfg.curriculumModules.flatMap((m) => m.items);

  // Build outcomes for the outcomes marquee
  const outcomeItems = cfg.outcomes.map((o) => o);

  return (
    <div className={pageClass}>
      {/* ── HERO ── */}
      <section className="program-hero" style={{ position: "relative", overflow: "hidden" }}>
        <FloatingDecorations count={10} />
        <div className="container hero-grid">
          <div className="hero-content">
            <span className="program-badge">{cfg.badge}</span>
            <h1>{cfg.title}</h1>
            <p className="hero-subtitle">{cfg.subtitle}</p>
            <div className="hero-ctas">
              <Link href="/book-demo" className="btn btn-primary">Book a Free Demo</Link>
              <Link href="/contact" className="btn btn-secondary">Ask About Batches</Link>
            </div>
            <div className="hero-meta-strip">
              {cfg.metaStrip.map((m) => <span key={m}>{m}</span>)}
            </div>
          </div>
          <div className="hero-visual">
            <div className="hero-image-frame glass-panel">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={cfg.heroImage} alt={cfg.heroImageAlt} className="hero-main-img" />
              <div className="floating-badge badge-top">
                <span>{cfg.heroBadge1.icon}</span>
                <div><strong>{cfg.heroBadge1.title}</strong><small>{cfg.heroBadge1.sub}</small></div>
              </div>
              <div className="floating-badge badge-bottom">
                <span>{cfg.heroBadge2.icon}</span>
                <div><strong>{cfg.heroBadge2.title}</strong><small>{cfg.heroBadge2.sub}</small></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <WaveSeparator color="var(--light-bg)" direction="bottom" />

      {/* ── WHY ── */}
      <section className="parent-problem-section">
        <div className="container">
          <div className="section-header text-center reveal">
            <span className="section-tag">The Challenge</span>
            <h2>Why Traditional Academics Fall Short</h2>
          </div>
          <div className="problem-split-grid">
            <div className="problem-left-content reveal">
              <p className="primary-problem-text">{cfg.problemStatement}</p>
              <div className="problem-visual-cards">
                {cfg.problemCards.map((c) => (
                  <div key={c.title} className="problem-visual-card">
                    <span className="card-bullet">{c.icon}</span>
                    <div><h4>{c.title}</h4><p>{c.desc}</p></div>
                  </div>
                ))}
              </div>
            </div>
            <div className="problem-right-visual reveal">
              <div className="dev-illustration-box glass-panel">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={cfg.problemImage} alt="Child in live online class" className="dev-illustration-img" />
                <div className="cohort-size-tag">
                  <strong>Max 5 Children</strong>
                  <span>Personalized development &amp; focus</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <WaveSeparator color="var(--light-surface-elevated)" direction="bottom" flip={true} />

      {/* ── MILESTONES ── */}
      <section className="program-goal-section" style={cfg.goalBgImage ? { backgroundImage: `url(${cfg.goalBgImage})` } : {}}>
        {cfg.goalBgImage && <div className="junior-program-goal__overlay" aria-hidden="true" />}
        <div className="junior-program-goal__content container">
          <div className="section-header text-center reveal">
            <span className="section-tag">Program Goal</span>
            <h2>{cfg.goalHeading}</h2>
          </div>
          <div className="goal-split-grid">
            <div className="goal-left-visual reveal">
              <div className="goal-ladder-matrix glass-panel">
                <h3>Progress Milestones</h3>
                {cfg.milestones.map((m) => (
                  <div key={m.num} className="ladder-milestone">
                    <div className="milestone-badge">{m.num}</div>
                    <div><h4>{m.title}</h4><p>{m.desc}</p></div>
                  </div>
                ))}
              </div>
            </div>
            <div className="goal-right-content reveal">
              <div className="goal-main-card">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={cfg.goalIcon} alt="Program goal illustration" className="goal-icon-img bob-animation" />
                <h3>The Program Vision</h3>
                <p className="goal-core-statement">{cfg.goalStatement}</p>
                <div className="goal-bullet-list">
                  {cfg.goalBullets.map((b) => (
                    <div key={b.label} className="goal-bullet-item">
                      <span>{b.icon}</span>
                      <p><strong>{b.label}:</strong> {b.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <WaveSeparator color="var(--light-bg)" direction="bottom" />

      {/* ── CURRICULUM ── */}
      <section className="curriculum-section">
        <div className="container">
          <div className="section-header text-center reveal">
            <span className="section-tag">Curriculum</span>
            <h2>{cfg.curriculumTitle}</h2>
          </div>

          {/* Seamless infinite skills marquee */}
          <div className="curriculum-marquee-wrapper">
            <InfiniteMarquee
              items={allSkills}
              speed={45}
              direction="left"
              gap={24}
              itemClassName="curriculum-marquee-item"
              pauseOnHover={true}
            />
          </div>

          {/* Horizontal curriculum grid */}
          <motion.div
            className="curriculum-modules-grid"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
          >
            {cfg.curriculumModules.map((mod) => (
              <motion.div
                key={mod.week}
                className="curriculum-module-card glass-panel"
                variants={cardReveal}
                whileHover={{ y: -6, transition: { duration: 0.25 } }}
              >
                <div className="module-header">
                  <span className="module-week">{mod.week}</span>
                  <h4>{mod.title}</h4>
                </div>
                <ul className="module-items">
                  {mod.items.map((item) => (
                    <li key={item}><span className="module-bullet">✓</span>{item}</li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <WaveSeparator color="var(--light-surface-elevated)" direction="bottom" flip={true} />

      {/* ── OUTCOMES ── */}
      <section className="outcomes-section">
        <div className="container">
          <div className="section-header text-center reveal">
            <span className="section-tag">Results</span>
            <h2>What Your Child Will Gain</h2>
          </div>

          {/* Outcomes marquee — scrolls right (opposite direction to curriculum) */}
          <div className="outcomes-marquee-wrapper">
            <InfiniteMarquee
              items={outcomeItems}
              speed={40}
              direction="right"
              gap={28}
              itemClassName="outcomes-marquee-item"
              pauseOnHover={true}
            />
          </div>

          {/* Outcome cards with staggered entrance */}
          <motion.div
            className="outcomes-grid"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
          >
            {cfg.outcomes.map((o, i) => (
              <motion.div
                key={i}
                className="outcome-card glass-panel"
                variants={cardReveal}
                whileHover={{
                  y: -5,
                  scale: 1.02,
                  transition: { duration: 0.22 },
                }}
              >
                <div className="outcome-icon-wrap">
                  <span className="outcome-check">✓</span>
                </div>
                <p>{o}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <WaveSeparator color="var(--light-bg)" direction="bottom" />

      {/* ── FAQ ── */}
      <section className="program-faq-section">
        <div className="container">
          <div className="section-header text-center reveal">
            <span className="section-tag">FAQ</span>
            <h2>Common Questions</h2>
          </div>
          <div className="program-faq-accordion">
            {cfg.faqs.map((f) => (
              <FAQAccordion key={f.question} q={f.question} a={f.answer} />
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="program-final-cta">
        <div className="container">
          <div className="programs-assessment-container reveal">
            <div className="programs-assessment-content">
              <span className="programs-assessment-badge">Free Demo</span>
              <h2>{cfg.ctaHeading}</h2>
              <p>{cfg.ctaBody}</p>
              <div className="programs-assessment-actions">
                <Link href="/book-demo" className="btn primary-btn">Book Free Demo Class</Link>
                <Link href="/programs" className="btn secondary-btn">View All Programs</Link>
              </div>
            </div>
            <div className="programs-assessment-visual">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/img/public/final_cta_child.png" alt="Happy child ready for the future" />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
