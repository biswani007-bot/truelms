"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { FloatingDecorations } from "../../../components/public/floating-decorations";
import { WaveSeparator } from "../../../components/public/wave-separator";

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] } },
};

const studentData: Record<string, {
  name: string; track: string;
  weeks: Record<string, { confidence: number; communication: number; selfRegulation: number; badge: string; coachNote: string; project: string }>;
}> = {
  lucas: {
    name: "Lucas (Age 10)", track: "Future-Ready Builders Track",
    weeks: {
      "4": { confidence: 65, communication: 60, selfRegulation: 55, badge: "🎯 Spark Explorer", coachNote: "Lucas is starting to voice his ideas during discussions. Active in group exercises but needs practice structuring his speaking points.", project: "Needs vs Wants Worksheet Log" },
      "12": { confidence: 78, communication: 75, selfRegulation: 70, badge: "🤝 Peer Negotiator", coachNote: "Lucas led his peer group in the debate exercise! Great improvement in speaking structure and active listening.", project: "Negotiation Strategy Map" },
      "24": { confidence: 90, communication: 88, selfRegulation: 82, badge: "🎓 Academy Presenter", coachNote: "Lucas delivered his showcase project on budget management with total confidence. Clear posture and handled peer questions perfectly.", project: "Lucas's Tech Budget Pitch Video" },
    },
  },
  maya: {
    name: "Maya (Age 7)", track: "Junior Foundation Track",
    weeks: {
      "4": { confidence: 50, communication: 45, selfRegulation: 60, badge: "🌱 Routine Beginner", coachNote: "Maya is quiet during group presentations but follows instructions meticulously. Encouraging her to speak during storytelling modules.", project: "My Daily Routine Sketch" },
      "12": { confidence: 70, communication: 68, selfRegulation: 72, badge: "⚡ Storyteller Pro", coachNote: "Maya presented her weekend routine plan today. Maintained excellent voice volume and responded to two peer questions!", project: "Weekend Routine Calendar Log" },
      "24": { confidence: 88, communication: 85, selfRegulation: 90, badge: "🏆 Junior Champion", coachNote: "Maya has shown remarkable growth. She now leads the storytelling activities and encourages quieter peers to participate.", project: "Maya's Community Helper Story" },
    },
  },
};

const ProgressBar = ({ label, value }: { label: string; value: number }) => (
  <div className="pp-progress-item">
    <div className="pp-progress-label"><span>{label}</span><strong>{value}%</strong></div>
    <div className="pp-progress-track"><div className="pp-progress-fill" style={{ width: `${value}%` }} /></div>
  </div>
);

const visibilityFeatures = [
  { icon: "📊", title: "Monthly Skill Diagnostics", desc: "Full diagnostic scores across confidence, communication, self-regulation and practical thinking delivered at the end of each month." },
  { icon: "📹", title: "Video Clip Highlights", desc: "Short coach-selected video moments of your child's best class moments — milestone-speaking, project presentations and active participation." },
  { icon: "📝", title: "Weekly Coach Notes", desc: "Structured written observations uploaded after each class with specific improvement notes and at-home practice suggestions." },
  { icon: "🏆", title: "Milestone Badges", desc: "Achievement badges earned at each skill milestone automatically appear in the parent dashboard with the coach's notes attached." },
  { icon: "📅", title: "Attendance Log", desc: "Full transparent attendance record with makeup class scheduling when sessions are missed." },
  { icon: "🎯", title: "Next Level Roadmap", desc: "At the end of each 36-class block, receive a detailed next-level recommendation and progression plan from the coach." },
];

export function ParentProgressClient() {
  const [selectedStudent, setSelectedStudent] = useState("lucas");
  const [selectedWeek, setSelectedWeek] = useState("4");

  const student = studentData[selectedStudent];
  const weekData = student.weeks[selectedWeek];

  return (
    <div className="pp-page">
      {/* ── HERO ── */}
      <section className="pp-hero">
        <FloatingDecorations count={8} />
        <div className="container">
          <motion.div className="pp-hero-content text-center" variants={fadeInUp} initial="hidden" animate="visible">
            <span className="section-tag">📊 Parent Transparency</span>
            <h1>Full visibility into your child&apos;s development.</h1>
            <p className="pp-hero-sub">
              TrueLern gives parents structured, real-time visibility into every aspect of their child&apos;s progress — class by class, week by week, milestone by milestone.
            </p>
            <div className="pp-hero-actions">
              <Link href="/book-demo" className="btn btn-primary">Book Free Demo</Link>
              <Link href="/how-it-works" className="btn btn-secondary">How It Works</Link>
            </div>
          </motion.div>
        </div>
      </section>

      <WaveSeparator color="var(--light-bg)" direction="bottom" />

      {/* ── LIVE PROGRESS DASHBOARD DEMO ── */}
      <section className="pp-dashboard-section">
        <div className="container">
          <div className="section-header text-center">
            <span className="section-tag">Parent Dashboard</span>
            <h2>What the Parent Progress Dashboard Looks Like</h2>
            <p>Below is a sample of the progress data parents see after each reporting period. This is real data structure, not mockups.</p>
          </div>

          <div className="pp-dashboard-demo glass-panel">
            {/* Student selector */}
            <div className="pp-selector-row">
              <div className="pp-student-tabs">
                {Object.keys(studentData).map((key) => (
                  <button key={key} className={`pp-student-tab${selectedStudent === key ? " active" : ""}`} onClick={() => { setSelectedStudent(key); setSelectedWeek("4"); }}>
                    {studentData[key].name}
                  </button>
                ))}
              </div>
              <div className="pp-week-tabs">
                {Object.keys(student.weeks).map((week) => (
                  <button key={week} className={`pp-week-tab${selectedWeek === week ? " active" : ""}`} onClick={() => setSelectedWeek(week)}>
                    Week {week}
                  </button>
                ))}
              </div>
            </div>

            <AnimatePresence mode="wait">
              <motion.div key={`${selectedStudent}-${selectedWeek}`} className="pp-dashboard-body" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
                <div className="pp-dashboard-left">
                  <div className="pp-student-header">
                    <span className="pp-badge">{weekData.badge}</span>
                    <div><h3>{student.name}</h3><p>{student.track} — Week {selectedWeek} Report</p></div>
                  </div>
                  <div className="pp-progress-bars">
                    <ProgressBar label="Confidence & Speaking" value={weekData.confidence} />
                    <ProgressBar label="Communication Clarity" value={weekData.communication} />
                    <ProgressBar label="Self-Regulation" value={weekData.selfRegulation} />
                  </div>
                </div>
                <div className="pp-dashboard-right">
                  <div className="pp-coach-note glass-panel">
                    <h4>🎙️ Coach Observation</h4>
                    <p>&ldquo;{weekData.coachNote}&rdquo;</p>
                  </div>
                  <div className="pp-project-tag">
                    <span>📁 Project Submitted:</span>
                    <strong>{weekData.project}</strong>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </section>

      <WaveSeparator color="var(--light-surface-elevated)" direction="bottom" flip={true} />

      {/* ── VISIBILITY FEATURES ── */}
      <section className="pp-visibility-section">
        <div className="container">
          <div className="section-header text-center">
            <span className="section-tag">What You See</span>
            <h2>Everything That Comes With Your Parent Subscription</h2>
          </div>
          <div className="pp-features-grid">
            {visibilityFeatures.map((f, i) => (
              <motion.div
                key={f.title}
                className="pp-feature-card glass-panel"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.5, delay: (i % 3) * 0.1 }}
              >
                <span className="pp-feature-icon">{f.icon}</span>
                <h4>{f.title}</h4>
                <p>{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="pp-final-cta">
        <div className="container">
          <div className="programs-assessment-container">
            <div className="programs-assessment-content">
              <span className="programs-assessment-badge">Full Visibility</span>
              <h2>Know exactly how your child is growing.</h2>
              <p>Book a free demo and experience the TrueLern parent dashboard firsthand — real progress data, real coach feedback, real outcomes.</p>
              <div className="programs-assessment-actions">
                <Link href="/book-demo" className="btn primary-btn">Book Free Demo</Link>
                <Link href="/how-it-works" className="btn secondary-btn">Learn How It Works</Link>
              </div>
            </div>
            <div className="programs-assessment-visual">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/img/public/trophy_star.png" alt="Achievement trophy" />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
