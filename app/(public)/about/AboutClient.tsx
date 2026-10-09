"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";

export function AboutClient() {
  const fadeInUp: any = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } }
  };

  const staggerContainer: any = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  return (
    <div className="ap-about-page">
      {/* ── HERO SECTION ── */}
      <section className="ap-hero">
        <div className="ap-hero-bg">
          <div className="ap-orb ap-orb-blue" />
          <div className="ap-orb ap-orb-purple" />
          
          {/* Floating animated school/educational graphics */}
          {['📚', '🎓', '🧩', '💡', '🌟', '🏫'].map((emoji, index) => (
            <motion.span
              key={index}
              className="ap-float-icon"
              style={{
                left: `${15 + index * 14}%`,
                top: `${20 + (index % 2) * 35}%`,
              }}
              animate={{
                y: [0, -12, 0],
                rotate: [0, index % 2 === 0 ? 10 : -10, 0],
              }}
              transition={{
                duration: 5 + index * 0.6,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: index * 0.1,
              }}
            >
              {emoji}
            </motion.span>
          ))}
        </div>

        <div className="container ap-hero-container">
          <motion.div
            className="ap-hero-content text-center"
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
          >
            <span className="ap-badge-pill">🎓 Our Philosophy</span>
            <h1>We created TrueLern because children need more than academic marks.</h1>
            <p className="ap-hero-sub">
              TrueLern is built for families who want children to become confident, capable, emotionally mature, financially aware and future-ready.
            </p>
            <div className="ap-hero-actions">
              <Link href="/book-demo" className="ap-btn-primary">
                Book Free Demo
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── SECTION: WHY TrueLern EXISTS ── */}
      <section className="ap-section ap-why-exists">
        <div className="container">
          <div className="ap-grid-problem">
            <motion.div 
              className="ap-problem-content"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-100px' }}
              variants={fadeInUp}
            >
              <span className="ap-section-tag">Why TrueLern Exists</span>
              <h2>The Gap in Traditional Education</h2>
              <p className="ap-problem-text">
                Most education systems focus heavily on subjects, exams and marks. Those things matter, but they are not enough. A child also needs to know how to speak, listen, manage time, understand money, use technology responsibly, control emotions, make decisions and handle real-world situations.
              </p>
              
              {/* Child learning journey mini-graphic */}
              <div className="ap-learning-journey-visual glass-panel">
                <span className="ap-journey-step">📚 School Subjects</span>
                <span className="ap-journey-arrow">＋</span>
                <span className="ap-journey-step active">🧩 Life Skills (TrueLern)</span>
                <span className="ap-journey-arrow">＝</span>
                <span className="ap-journey-step active-final">🚀 Future-Ready Leader</span>
              </div>
            </motion.div>

            <motion.div 
              className="ap-problem-visual"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-100px' }}
              variants={fadeInUp}
            >
              <div className="ap-image-wrapper">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/img/public/robot_ai.png" alt="Educational Academy Graphics" className="ap-3d-visual bob-animation" />
                <div className="ap-glow-bg" />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── SECTION: FOUNDER STORY ── */}
      <section className="ap-section ap-founder-story">
        <div className="container">
          <div className="ap-grid-founder">
            <motion.div 
              className="ap-founder-visual"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-100px' }}
              variants={fadeInUp}
            >
              <div className="ap-founder-card glass-panel text-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/img/public/coach_teacher.png" alt="Founder Team Illustration" className="ap-founder-avatar bob-animation" />
                <h3>Preparing Kids for the Parts of Life School Misses</h3>
                <p>Standardized and cohort-based modern academy</p>
              </div>
            </motion.div>

            <motion.div 
              className="ap-founder-content"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-100px' }}
              variants={fadeInUp}
            >
              <span className="ap-section-tag">Founder Story</span>
              <h2>Preparing Kids for the Parts of Life School Misses</h2>
              <p>
                TrueLern was created to bring these practical skills into one structured online academy. The goal is not to replace school. The goal is to prepare children for the parts of life that school often does not teach deeply enough.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── SECTION: MISSION & VISION ── */}
      <section className="ap-section ap-mission-vision">
        <div className="container">
          <motion.div 
            className="ap-mv-grid"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={staggerContainer}
          >
            <motion.div className="ap-mv-card glass-panel" variants={fadeInUp}>
              <div className="ap-mv-icon-wrap">🎯</div>
              <h3>Mission</h3>
              <p>
                To equip every child with the confidence to speak, the logic to decide, and the self-regulation to focus.
              </p>
            </motion.div>

            <motion.div className="ap-mv-card glass-panel" variants={fadeInUp}>
              <div className="ap-mv-icon-wrap">👁️</div>
              <h3>Vision</h3>
              <p>
                A future where children transition from passive consumers of technology and rules into proactive leaders of their lives.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── SECTION: VALUES ── */}
      <section className="ap-section ap-values">
        <div className="container">
          <div className="ap-section-header text-center">
            <span className="ap-section-tag">Our Values</span>
            <h2>Values That Guide Us</h2>
            <p className="ap-section-sub">Standardizing children&apos;s developmental paths with core pedagogical integrity.</p>
          </div>

          <motion.div 
            className="ap-values-grid"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            variants={staggerContainer}
          >
            {[
              {
                emoji: '📋',
                title: 'Structured learning over random classes',
                desc: 'Standardized developmental roadmaps that establish permanent cognitive habits.'
              },
              {
                emoji: '⚡',
                title: 'Practice over passive watching',
                desc: 'Every child actively participates and interacts in real time during live classes.'
              },
              {
                emoji: '🔄',
                title: 'Confidence through repetition, not pressure',
                desc: 'We support children through scaffolded, non-threatening speaking opportunities.'
              },
              {
                emoji: '🚀',
                title: 'Future-readiness without hype',
                desc: 'Teaching computational logic and financial models with practical, real-world utility.'
              },
              {
                emoji: '📊',
                title: 'Parent-visible progress',
                desc: 'Documented updates, weekly dashboards, and milestones that show measurable growth.'
              },
              {
                emoji: '💎',
                title: 'Premium quality with practical affordability',
                desc: 'Elite pedagogical training and structured cohorts at accessible monthly pricing.'
              },
              {
                emoji: '🌱',
                title: 'Long-term development over short-term motivation',
                desc: 'Building consistent behaviors that outlive temporary excitement.'
              }
            ].map((value, index) => (
              <motion.div key={index} className="ap-value-card glass-panel" variants={fadeInUp}>
                <span className="ap-value-emoji">{value.emoji}</span>
                <h4>{value.title}</h4>
                <p>{value.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── SECTION: MISSION TIMELINE ── */}
      <section className="ap-section ap-timeline">
        <div className="container">
          <div className="ap-section-header text-center">
            <span className="ap-section-tag">Our Journey</span>
            <h2>Mission Timeline</h2>
            <p className="ap-section-sub">How we are expanding future-skills access globally.</p>
          </div>

          <div className="ap-timeline-track">
            {[
              { year: '2024', title: 'Academy Pilot Sprints', desc: 'Launched initial small group pilot workshops.' },
              { year: '2025', title: '6-Peer Batch Launch', desc: 'Onboarded first cohorts of communication and money skills.' },
              { year: '2026', title: 'Standardized Diagnostic Portals', desc: 'Introduced automated dashboards and parent reporting tracks.' },
              { year: '2027', title: 'Global Expansion', desc: 'Enabling future-ready pathways for children internationally.' }
            ].map((milestone, idx) => (
              <div key={idx} className="ap-timeline-item">
                <div className="ap-timeline-node">{milestone.year}</div>
                <div className="ap-timeline-content glass-panel">
                  <h4>{milestone.title}</h4>
                  <p>{milestone.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="ap-cta">
        <div className="container">
          <div className="ap-cta-card glass-panel text-center">
            <h2>Equip Your Child for the Real World</h2>
            <p>Every child starts with a trial evaluation. Receive a detailed developmental diagnostic report before choosing a plan.</p>
            <Link href="/book-demo" className="ap-btn-cta">
              Book Free Demo
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
