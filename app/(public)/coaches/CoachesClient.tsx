"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { WaveSeparator } from "../../../components/public/wave-separator";
import { FloatingDecorations } from "../../../components/public/floating-decorations";

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] } },
};

const hiringTimeline = [
  { step: 1, title: "Application Review", desc: "Checking academic background and prior youth engagement experience." },
  { step: 2, title: "Shortlisting", desc: "Screening profiles for articulation and positive tone." },
  { step: 3, title: "Demo Teaching Test", desc: "A live mock class evaluating patience and energy." },
  { step: 4, title: "Final Interview", desc: "Checking alignment with TrueLern pedagogy." },
  { step: 5, title: "Background Verification", desc: "Global child-safety and credential verification." },
  { step: 6, title: "Methodology Training", desc: "Intensive training on the 60-second active trigger system." },
  { step: 7, title: "Trial Class", desc: "Shadowing master coaches during live sessions." },
  { step: 8, title: "Batch Allocation", desc: "Starting with a single monitored cohort." },
];

export function CoachesClient() {
  const [activeCoachTab, setActiveCoachTab] = useState("sarah");

  const coachRoster = {
    sarah: {
      name: "Coach Sarah Jenkins",
      category: "Master Coach",
      specialty: "Confidence & Public Speaking",
      xp: "8+ Years",
      bio: "Sarah specializes in speech therapy and child public speaking. She is passionate about helping introverted children find their strong vocal cadence.",
      quote: "“My goal is to make sure the quietest child feels safe enough to express their ideas and lead discussions.”",
    },
    marcus: {
      name: "Coach Marcus Sterling",
      category: "Certified Coach",
      specialty: "Money Skills & Budgeting",
      xp: "5+ Years",
      bio: "Marcus has taught youth budgeting courses globally. He utilizes prompt activity decks to make currency and resource allocation intuitive.",
      quote: "“I love teaching children that money is not just about spending—it is about planning, saving, and value creation.”",
    },
    elena: {
      name: "Coach Elena Rostova",
      category: "Expert Mentor",
      specialty: "AI Readiness & Logic",
      xp: "7+ Years",
      bio: "Elena is a child-friendly computer scientist who translates complex technology prompts into sandbox activities.",
      quote: "“AI is a tool, not a shortcut. I teach children to ask better questions and verify the outputs they receive.”",
    },
  };

  return (
    <div className="cp-coaches-page">
      {/* ── HERO SECTION ── */}
      <section className="cp-hero">
        <FloatingDecorations count={8} />
        <div className="cp-hero-bg">
          <div className="cp-orb cp-orb-blue" />
          <div className="cp-orb cp-orb-purple" />
        </div>

        <div className="container cp-hero-container">
          <motion.div className="cp-hero-content text-center" initial="hidden" animate="visible" variants={fadeInUp}>
            <span className="cp-badge-pill">👩‍🏫 Selected Mentors</span>
            <h1>Trained coaches. Structured classes. Child-friendly teaching.</h1>
            <p className="cp-hero-sub">
              TrueLern coaches are selected and trained to deliver interactive online classes that help children participate, practice and improve step by step.
            </p>
            <div className="cp-hero-actions">
              <Link href="/book-demo" className="cp-btn-primary">Book Free Demo</Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── SECTION 1: COACH SELECTION CRITERIA ── */}
      <section className="cp-section cp-selection">
        <div className="container">
          <div className="cp-grid-selection">
            <motion.div className="cp-selection-content" initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={fadeInUp}>
              <span className="cp-section-tag">Selection Criteria</span>
              <h2>Rigorous Coach Selection Criteria</h2>
              <p>We maintain an elite coaching standard to ensure children learn in a supportive, high-retention environment.</p>
              
              <ul className="cp-criteria-list">
                <li>
                  <span className="cp-crit-emoji">🗣️</span>
                  <div><strong>Clear speech articulation:</strong><span>Strong pronunciation and vocal projection to guide young listeners.</span></div>
                </li>
                <li>
                  <span className="cp-crit-emoji">🧘</span>
                  <div><strong>Patience and child engagement comfort:</strong><span>Enthusiasm that commands attention through online classrooms.</span></div>
                </li>
                <li>
                  <span className="cp-crit-emoji">🎓</span>
                  <div><strong>Strong academic/teaching credentials:</strong><span>Proven background in educational development or specialized fields.</span></div>
                </li>
              </ul>
            </motion.div>

            <motion.div className="cp-selection-visual" initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={fadeInUp}>
              <div className="cp-visual-wrapper glass-panel">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/img/public/coach_teacher.png" alt="Teacher on Laptop Live Online" className="cp-3d-visual bob-animation" />
                <div className="cp-visual-overlay"><strong>Active Session</strong><span>● Live feed</span></div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── SECTION 2: COACH CATEGORIES ── */}
      <section className="cp-section cp-categories">
        <div className="container">
          <div className="cp-section-header text-center">
            <span className="cp-section-tag">Roles &amp; Expertise</span>
            <h2>Coach Categories</h2>
            <p className="cp-section-sub">Standardizing teaching levels to meet your child&apos;s learning velocity.</p>
          </div>

          <div className="cp-categories-grid">
            <motion.div className="cp-cat-card glass-panel" whileHover={{ y: -8 }} transition={{ duration: 0.25 }}>
              <span className="cp-cat-badge badge-blue">Tier 1</span>
              <h3>Certified Coach</h3>
              <p className="cp-cat-text">A trained TrueLern coach who delivers standard batches using the academy curriculum.</p>
            </motion.div>

            <motion.div className="cp-cat-card cp-card-highlight glass-panel" whileHover={{ y: -8 }} transition={{ duration: 0.25 }}>
              <span className="cp-cat-badge badge-purple">Tier 2</span>
              <h3>Master Coach</h3>
              <p className="cp-cat-text">A higher-rated, more experienced coach who may lead premium batches and advanced sessions.</p>
            </motion.div>

            <motion.div className="cp-cat-card glass-panel" whileHover={{ y: -8 }} transition={{ duration: 0.25 }}>
              <span className="cp-cat-badge badge-gold">Tier 3</span>
              <h3>Expert Mentor</h3>
              <p className="cp-cat-text">A specialist invited for selected workshops in money skills, AI, entrepreneurship, communication or leadership.</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── SECTION 3: TEACHING STANDARDS ── */}
      <section className="cp-section cp-standards">
        <div className="container">
          <div className="cp-grid-standards">
            <motion.div className="cp-standards-visual" initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={fadeInUp}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/img/public/robot_ai.png" alt="Mentor Coaching Child" className="cp-3d-visual bob-animation" />
            </motion.div>

            <motion.div className="cp-standards-content" initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={fadeInUp}>
              <span className="cp-section-tag">Pedagogy</span>
              <h2>Teaching Standards</h2>
              <p className="cp-standards-desc">TrueLern sets strict standards to keep students engaged, avoiding passive listening models:</p>
              
              <div className="cp-standards-cards">
                <div className="cp-standard-box glass-panel">
                  <strong>💬 Max 5 Peers</strong>
                  <p>Batches are restricted to five children to ensure individual speaking time and attention.</p>
                </div>
                <div className="cp-standard-box glass-panel">
                  <strong>⏳ 60-Second active triggers</strong>
                  <p>Coaches never lecture endlessly. Every minute, students are prompted to respond or coordinate.</p>
                </div>
                <div className="cp-standard-box glass-panel">
                  <strong>🌱 Emotional Safety Guard</strong>
                  <p>Classes use supportive reinforcement where every answer builds courage and trust.</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── SECTION 4: TRAINING PROCESS ── */}
      <section className="cp-section cp-training">
        <div className="container">
          <div className="cp-section-header text-center">
            <span className="cp-section-tag">Onboarding Pipeline</span>
            <h2>Training Process</h2>
            <p className="cp-section-sub">Our pedagogical screening parameters guarantee classroom excellence.</p>
          </div>

          <div className="cp-timeline">
            {hiringTimeline.map((step, i) => (
              <motion.div key={i} className="cp-timeline-item" initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                <div className="cp-timeline-dot">{step.step}</div>
                <div className="cp-timeline-content glass-panel">
                  <h4>{step.title}</h4>
                  <p>{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <WaveSeparator color="var(--light-bg)" direction="bottom" />
    </div>
  );
}
