"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { WaveSeparator } from "../../../components/public/wave-separator";

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] } },
};

const journeySteps = [
  { icon: "📅", label: "Book Demo", step: 1, title: "Book a free demo class.", desc: "Select a convenient day and time slot to introduce your child to the TrueLern interactive platform." },
  { icon: "📋", label: "Parent Form", step: 2, title: "Tell us your child's age, goals and key concerns.", desc: "Complete a quick prep profile detailing their age, specific goals, social comfort levels, and key concerns." },
  { icon: "🎯", label: "Demo Class", step: 3, title: "Attend a short interactive demo.", desc: "Your child participates in a fun 45-minute live class, working through simple communication and puzzle scenarios." },
  { icon: "📊", label: "Recommendation", step: 4, title: "Receive the recommended program and batch timing.", desc: "Receive a structured placement report mapping your child's speaking, confidence, and focus index with program fit details." },
  { icon: "✅", label: "Enrollment", step: 5, title: "Enroll into the right 36-class level.", desc: "Lock in a slot matching your timezone, group age brackets, and weekend/weekday schedule preferences." },
  { icon: "💻", label: "Live Classes", step: 6, title: "Attend weekly live classes.", desc: "Join highly engaging live cohort sessions with expert mentors and a maximum of 5 students per batch." },
  { icon: "📈", label: "Progress Updates", step: 7, title: "Receive parent progress updates.", desc: "Track detailed class observations, attendance logs, and coach suggestions directly from the parent dashboard." },
  { icon: "🏆", label: "Projects", step: 8, title: "Complete a project or milestone.", desc: "Submit homework logs, complete real-life activities, and present independent end-of-level projects." },
  { icon: "🎓", label: "Next Level", step: 9, title: "Move into the next level for continued development.", desc: "Graduate, earn badges, and transition into advanced tracks to develop long-term future leadership habits." },
];

const differentiators = [
  { icon: "🏛️", title: "Structured Learning", desc: "Every class follows a proven curriculum with clear learning objectives and measurable outcomes." },
  { icon: "👥", title: "Small Group Classes", desc: "Maximum 5 students per batch ensures every child receives high individual attention and peer collaboration." },
  { icon: "💬", title: "Teacher Feedback", desc: "Weekly structured coach observations with actionable home practice tips sent directly to parents." },
  { icon: "👁️", title: "Parent Visibility", desc: "Transparent dashboards, milestone scorecards, and video snippets keep parents fully informed." },
  { icon: "🧠", title: "Skill-Based Development", desc: "Focus on real-world life skills — communication, confidence, money, AI readiness, and habits." },
  { icon: "📶", title: "Progressive Levels", desc: "Children graduate through structured levels, building complexity and depth with every 36-class cycle." },
];

const journeyTabs: Record<string, { title: string; desc: string; xp: string; badge: string }> = {
  demo: {
    title: "1. The Spark (Demo Class)",
    desc: "Your child attends a 45-minute interactive small-group session. We evaluate their starting comfort level, speaking participation, and core focus patterns.",
    xp: "+100 XP unlocked",
    badge: "🎯 Spark Badge",
  },
  placement: {
    title: "2. Program & Batch Matching",
    desc: "Based on the demo, we map your child into a cohort of max 5 peers of the exact same age bracket and developmental starting point.",
    xp: "Cohort matched",
    badge: "👥 Peer Group Badge",
  },
  weekly: {
    title: "3. Weekly Skill Sprints",
    desc: "Students attend interactive live sessions focusing on practice, case scenarios, and roleplays. No passive lectures — just active participation.",
    xp: "+50 XP per class",
    badge: "⚡ Focus Habit Badge",
  },
  reports: {
    title: "4. Parent Transparency Logs",
    desc: "Every week, the coach uploads a structured update to your dashboard. Parents receive clear notes on confidence, structure, and home practice tips.",
    xp: "Weekly reports delivered",
    badge: "📊 Diagnostic Badge",
  },
  graduation: {
    title: "5. Level Milestone & Showcase",
    desc: "After completing their 36-class cycle, students present an independent showcase project to peers and graduate to the next progressive track.",
    xp: "Level Graduation unlocked",
    badge: "🎓 Academy Graduation",
  },
};

export function HowItWorksClient() {
  const [activeStep, setActiveStep] = useState(0);
  const [activeTab, setActiveTab] = useState("demo");

  return (
    <div className="hiw-page">
      {/* ── HERO ── */}
      <section className="hiw-hero">
        <div className="hiw-hero-bg">
          <div className="hiw-orb hiw-orb-1" />
          <div className="hiw-orb hiw-orb-2" />
          <div className="hiw-orb hiw-orb-3" />
          {["📚", "🎯", "🏆", "💡", "🧠", "✏️", "🚀", "⭐"].map((icon, i) => (
            <motion.span
              key={i}
              className="hiw-float-icon"
              style={{ left: `${10 + i * 11}%`, top: `${15 + (i % 3) * 25}%` }}
              animate={{ y: [0, -18, 0], rotate: [0, i % 2 === 0 ? 10 : -10, 0] }}
              transition={{ duration: 3 + i * 0.4, repeat: Infinity, ease: "easeInOut", delay: i * 0.3 }}
            >
              {icon}
            </motion.span>
          ))}
        </div>

        <div className="container hiw-hero-grid">
          <motion.div
            className="hiw-hero-content"
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
          >
            <span className="hiw-badge-pill">🗺️ The Learning Pathway</span>
            <h1>How TrueLern works.</h1>
            <p className="hiw-hero-sub">
              A simple, structured process that helps your child start at the right level, learn through live practice and continue growing through progressive learning blocks.
            </p>
            <div className="hiw-hero-actions">
              <Link href="/book-demo" className="hiw-btn-primary">Book a Free Demo <span>→</span></Link>
              <Link href="/programs" className="hiw-btn-ghost">Explore Programs</Link>
            </div>
            <div className="hiw-hero-stats">
              <div className="hiw-stat"><strong>36</strong><span>Classes per Level</span></div>
              <div className="hiw-stat-divider" />
              <div className="hiw-stat"><strong>5</strong><span>Max Students/Batch</span></div>
              <div className="hiw-stat-divider" />
              <div className="hiw-stat"><strong>100%</strong><span>Live &amp; Interactive</span></div>
            </div>
          </motion.div>

          <motion.div
            className="hiw-hero-visual"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="hiw-journey-panel">
              <div className="hiw-panel-header">
                <span className="hiw-panel-dot blue" />
                <span className="hiw-panel-dot purple" />
                <span className="hiw-panel-dot teal" />
                <span className="hiw-panel-title">🛣️ The Learning Journey</span>
                <span className="hiw-panel-live">● LIVE</span>
              </div>
              <div className="hiw-tab-row">
                {Object.keys(journeyTabs).map((key) => (
                  <button key={key} onClick={() => setActiveTab(key)} className={`hiw-tab-btn${activeTab === key ? " active" : ""}`}>
                    {key.charAt(0).toUpperCase() + key.slice(1)}
                  </button>
                ))}
              </div>
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  className="hiw-tab-body"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  <h3>{journeyTabs[activeTab].title}</h3>
                  <p>{journeyTabs[activeTab].desc}</p>
                  <div className="hiw-tab-rewards">
                    <span className="hiw-xp-tag">{journeyTabs[activeTab].xp}</span>
                    <span className="hiw-badge-tag">{journeyTabs[activeTab].badge}</span>
                  </div>
                </motion.div>
              </AnimatePresence>
              <div className="hiw-panel-progress">
                {Object.keys(journeyTabs).map((key, i) => (
                  <button key={i} className={`hiw-prog-dot${activeTab === key ? " active" : ""}`} onClick={() => setActiveTab(key)} />
                ))}
              </div>
            </div>
            <motion.div className="hiw-float-card hiw-float-card-1" animate={{ y: [0, -8, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}>
              <span>🎓</span><div><strong>Level Completed!</strong><small>Advanced to Level 2</small></div>
            </motion.div>
            <motion.div className="hiw-float-card hiw-float-card-2" animate={{ y: [0, 10, 0] }} transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}>
              <span>📊</span><div><strong>Weekly Report Ready</strong><small>Confidence ↑ 15%</small></div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <WaveSeparator color="var(--light-bg)" direction="bottom" />

      {/* ── 9-STEP JOURNEY ── */}
      <section className="hiw-journey-section">
        <div className="container">
          <div className="section-header text-center">
            <span className="section-tag">The Journey</span>
            <h2>The Complete Learning Journey — 9 Steps</h2>
            <p className="hiw-journey-intro">From your first free demo to your child&apos;s graduation — here is exactly what happens.</p>
          </div>
          <div className="hiw-journey-steps-wrapper">
            {/* Visual step progress strip */}
            <div className="hiw-step-progress-strip">
              <div
                className="hiw-step-progress-fill"
                style={{ width: `${((activeStep + 1) / journeySteps.length) * 100}%` }}
              />
            </div>
            <div className="hiw-journey-steps-nav">
              {journeySteps.map((step, i) => (
                <button
                  key={step.step}
                  className={`hiw-step-nav-btn${activeStep === i ? " active" : ""}`}
                  onClick={() => setActiveStep(i)}
                  aria-label={`Go to step ${step.step}: ${step.label}`}
                >
                  <span className="step-nav-num">{step.step}</span>
                  <span className="step-nav-icon">{step.icon}</span>
                  <span className="step-nav-label">{step.label}</span>
                </button>
              ))}
            </div>
            <AnimatePresence mode="wait">
              <motion.div
                key={activeStep}
                className="hiw-step-detail-panel glass-panel"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.35 }}
              >
                <div className="step-detail-icon">{journeySteps[activeStep].icon}</div>
                <span className="step-detail-num">Step {journeySteps[activeStep].step} of 9</span>
                <h3>{journeySteps[activeStep].title}</h3>
                <p>{journeySteps[activeStep].desc}</p>
                <div className="step-detail-actions">
                  {activeStep > 0 && (
                    <button className="btn btn-secondary hiw-prev-btn" onClick={() => setActiveStep(activeStep - 1)}>← Previous</button>
                  )}
                  {activeStep < journeySteps.length - 1 ? (
                    <button className="btn btn-primary" onClick={() => setActiveStep(activeStep + 1)}>Next Step →</button>
                  ) : (
                    <Link href="/book-demo" className="btn btn-primary">Start Your Journey →</Link>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </section>

      <WaveSeparator color="var(--light-surface-elevated)" direction="bottom" flip={true} />

      {/* ── DIFFERENTIATORS ── */}
      <section className="hiw-diff-section">
        <div className="container">
          <div className="section-header text-center">
            <span className="section-tag">Why TrueLern</span>
            <h2>What Makes Our Method Different</h2>
          </div>
          <div className="hiw-diff-grid">
            {differentiators.map((d, i) => (
              <motion.div
                key={d.title}
                className="hiw-diff-card glass-panel"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.5, delay: (i % 3) * 0.1 }}
              >
                <span className="hiw-diff-icon">{d.icon}</span>
                <h4>{d.title}</h4>
                <p>{d.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <WaveSeparator color="var(--light-bg)" direction="bottom" />

      {/* ── CTA ── */}
      <section className="hiw-cta-section">
        <div className="container">
          <div className="programs-assessment-container">
            <div className="programs-assessment-content">
              <span className="programs-assessment-badge">Free Demo</span>
              <h2>Ready to start your child&apos;s journey?</h2>
              <p>Book a free demo class. We match your child to the perfect cohort level and program based on a 45-minute live assessment session.</p>
              <div className="programs-assessment-actions">
                <Link href="/book-demo" className="btn primary-btn">Book Free Demo</Link>
                <Link href="/programs" className="btn secondary-btn">Explore Programs</Link>
              </div>
            </div>
            <div className="programs-assessment-visual">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/img/public/final_cta_child.png" alt="Happy child ready to start learning" />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
