"use client";

import React, { useEffect, useRef } from "react";
import Link from "next/link";
import { WaveSeparator } from "../../../components/public/wave-separator";
import { FloatingDecorations } from "../../../components/public/floating-decorations";

// ── UI MARKETING ASSETS MAP ───────────────────────────────────────────────────
// These visual elements (colors, emojis) enhance the dynamic DB content based on slug.
const programAssetsMap: Record<string, any> = {
  "junior-foundation-ages-6-to-10": {
    emoji: "🌱",
    theme: "sky",
    illustration: "/img/public/coach_teacher.png",
    illustrationAlt: "Happy children learning together",
    cta: "View Junior Program",
    highlights: ["Storytelling", "Confidence", "Social learning", "Activities"],
  },
  "future-ready-builders-ages-9-to-14": {
    emoji: "🏗️",
    theme: "violet",
    illustration: "/img/public/future_ready_illus.png",
    illustrationAlt: "Children presenting projects",
    cta: "View Future-Ready Program",
    highlights: ["Leadership", "Technology", "Projects", "Innovation"],
  },
  "communication-and-confidence": {
    emoji: "🗣️",
    theme: "orange",
    illustration: "/img/public/communication_illus.png",
    illustrationAlt: "Child speaking confidently",
    cta: "View Communication Track",
    highlights: ["Public speaking", "Debate", "Clarity", "Stage confidence"],
  },
  "money-skills": {
    emoji: "🪙",
    theme: "green",
    illustration: "/img/public/money_skills_illus.png",
    illustrationAlt: "Child learning budgeting",
    cta: "View Money Track",
    highlights: ["Budgeting", "Saving", "Investing", "Entrepreneurship"],
  },
  "ai-readiness": {
    emoji: "🤖",
    theme: "blue",
    illustration: "/img/public/ai_readiness_illus.png",
    illustrationAlt: "AI robot helping children explore",
    cta: "View AI Track",
    highlights: ["Prompt engineering", "Critical thinking", "AI tools", "Digital ethics"],
  },
  "emotional-intelligence": {
    emoji: "💜",
    theme: "pink",
    illustration: "/img/public/emotional_intel_illus.png",
    illustrationAlt: "Children practicing empathy",
    cta: "View EI Track",
    highlights: ["Empathy", "Self-awareness", "Conflict resolution", "Teamwork"],
  },
  "time-management-and-habits": {
    emoji: "⏰",
    theme: "teal",
    illustration: "/img/public/time_mgmt_illus.png",
    illustrationAlt: "Child organizing schedule",
    cta: "View Time Management Track",
    highlights: ["Goal setting", "Focus", "Habits", "Productivity"],
  },
  "practical-real-world-thinking": {
    emoji: "🧩",
    theme: "purple",
    illustration: "/img/public/practical_thinking_illus.png",
    illustrationAlt: "Children problem-solving",
    cta: "View Practical Thinking Track",
    highlights: ["Critical thinking", "Problem solving", "Decision making", "Logic"],
  }
};

// ── LEARNING PATH DATA ──────────────────────────────────────────────────────────
const learningPath = [
  { step: 1, label: "Foundation", icon: "🌱", color: "teal", desc: "Build core communication, confidence & emotional habits through guided play and structured group activities." },
  { step: 2, label: "Growth", icon: "🚀", color: "blue", desc: "Develop money sense, AI awareness and independent thinking with project-based cohort challenges." },
  { step: 3, label: "Mastery", icon: "🏆", color: "violet", desc: "Refine public speaking, debate, leadership and advanced practical skills through real-world scenarios." },
  { step: 4, label: "Future Ready", icon: "⭐", color: "orange", desc: "Synthesize all skills into a portfolio-worthy showcase and emerge as a confident, capable young leader." },
];

export function ProgramsClient() {
  const [programs, setPrograms] = React.useState<any[]>([]);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    // Fetch dynamic catalog
    fetch('/api/public/courses?category=truelern-programs')
      .then(r => r.json())
      .then(data => {
        if (data?.success && data?.data) {
          // Merge dynamic data with visual assets
          const mapped = data.data.map((course: any) => {
            const assets = programAssetsMap[course.slug] || {
              emoji: "📘", theme: "sky", illustration: "/img/public/coach_teacher.png",
              illustrationAlt: "TrueLern Program", cta: "View Program", highlights: []
            };
            return {
              id: course._id,
              slug: `/${course.slug}`,
              title: course.courseName,
              description: course.shortDescription,
              age: course.requirements?.eligibility || "Ages 6 to 18",
              ...assets
            };
          });
          setPrograms(mapped);
        }
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add("is-visible");
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -40px 0px" }
    );
    
    // Slight delay to ensure DOM is populated
    setTimeout(() => {
      document.querySelectorAll(".reveal").forEach((el) => observerRef.current?.observe(el));
    }, 100);

    return () => observerRef.current?.disconnect();
  }, [programs]);

  return (
    <div className="programs-page">
      {/* ── HERO ── */}
      <section className="prg-hero">
        <FloatingDecorations count={10} />
        <div className="container prg-hero-grid">
          <div className="prg-hero-content">
            <span className="section-tag">Learning Pathways</span>
            <h1>Programs designed for long-term child development.</h1>
            <p className="prg-hero-sub">
              TrueLern does not offer random one-time classes. We offer structured age-wise learning paths that build confidence, communication, emotional intelligence, money sense, AI readiness, time management and practical thinking step by step.
            </p>
            <div className="prg-hero-ctas">
              <a href="#program-cards" className="btn btn-primary">Explore Programs</a>
              <Link href="/book-demo" className="btn btn-secondary">Book Free Demo</Link>
            </div>
            <div className="prg-trust-strip">
              <span>🌟 4.9 / 5 Parent Rating</span>
              <span>👥 Max 5 Kids Per Cohort</span>
              <span>🎓 Expert-Vetted Coaches</span>
            </div>
          </div>
          <div className="prg-hero-visual">
            <div className="prg-hero-img-wrapper glass-panel">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/img/public/hero_kids.png" alt="Children learning, speaking, writing, solving problems and using technology" className="prg-hero-img" />
              <div className="prg-hero-badge">
                <span>🏫</span>
                <div>
                  <strong>8 Life-Skill Tracks</strong>
                  <small>One complete learning journey</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <WaveSeparator color="var(--light-bg)" direction="bottom" flip={false} />

      {/* ── PROGRAM CARDS ── */}
      <section className="prg-cards-section" id="program-cards">
        <div className="container">
          <div className="section-header text-center reveal">
            <span className="section-tag">All Programs</span>
            <h2 className="programs-title">Choose Your Child&apos;s Learning Path</h2>
            <p className="section-subtitle">
              Every program runs in live cohort sessions of maximum 5 children, guided by trained coaches, with monthly parent progress reports.
            </p>
          </div>

          <div className="prg-cards-grid">
            {programs.map((p, i) => (
              <article
                key={p.id}
                className={`prg-card prg-card--${p.theme} glass-panel reveal`}
                style={{ transitionDelay: `${(i % 3) * 0.1}s` }}
              >
                <div className="prg-card-illus-wrap">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.illustration} alt={p.illustrationAlt} className="prg-card-illus" loading="lazy" />
                  <span className="prg-card-emoji">{p.emoji}</span>
                </div>

                <div className="prg-card-meta">
                  <span className="prg-age-badge">{p.age}</span>
                  <div className="prg-highlights">
                    {p.highlights.map((h: string) => (
                      <span key={h} className="prg-highlight-pill">{h}</span>
                    ))}
                  </div>
                </div>

                <div className="prg-card-body">
                  <h3>{p.title}</h3>
                  <p className="prg-card-teaser">{p.description}</p>
                </div>

                <div className="prg-card-footer">
                  <Link href={p.slug} className="btn btn-primary prg-card-cta">
                    {p.cta}
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <WaveSeparator color="var(--light-surface-elevated)" direction="bottom" flip={true} />

      {/* ── LEARNING PATH ── */}
      <section className="prg-learning-path">
        <div className="container">
          <div className="section-header text-center reveal">
            <span className="section-tag">Learning Journey</span>
            <h2>The Long-Term Learning Path</h2>
            <p className="prg-path-intro">
              A child can begin with one level and continue into the next. Every 36-class block builds measurable skills and prepares the child for the next stage.
            </p>
          </div>

          <div className="prg-path-timeline-wrapper">
            <div className="prg-path-timeline">
              {[...learningPath, ...learningPath].map((stage, i) => (
                <div key={`${stage.step}-${i}`} className="prg-path-node">
                  <div className={`prg-path-icon-circle prg-path--${stage.color}`}>
                    <span>{stage.icon}</span>
                  </div>
                  <div className={`prg-path-card glass-panel prg-path-card--${stage.color}`}>
                    <span className="prg-path-step-label">Stage {stage.step}</span>
                    <h4>{stage.label}</h4>
                    <p>{stage.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="prg-achievement-strip reveal">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/img/public/trophy_star.png" alt="Achievement trophy" className="prg-trophy-img" />
            <div className="prg-achievement-text">
              <h3>Certificates of Achievement</h3>
              <p>Every 36-class block concludes with a verified certificate, portfolio showcase and coach recommendation letter.</p>
            </div>
          </div>
        </div>
      </section>

      <WaveSeparator color="var(--light-bg)" direction="bottom" flip={false} />

      {/* ── METHODOLOGY ── */}
      <section className="prg-methodology">
        <div className="container prg-method-grid">
          <div className="prg-method-content reveal">
            <span className="section-tag">Methodology</span>
            <h2>How Our Cohort System Works</h2>
            <p>We believe learning doesn&apos;t happen by watching pre-recorded videos. It happens by creating and interacting.</p>
            <ul className="prg-method-list">
              <li>
                <span className="method-icon">👥</span>
                <div><strong>Peer Learning</strong><p>Maximum of 5 children grouped together by compatibility and skill level.</p></div>
              </li>
              <li>
                <span className="method-icon">🎨</span>
                <div><strong>Portfolio Building</strong><p>Every track concludes with a final showcase project built entirely by the student.</p></div>
              </li>
              <li>
                <span className="method-icon">📈</span>
                <div><strong>Real Feedback</strong><p>Parents receive weekly micro-progress updates and monthly skill diagnostics.</p></div>
              </li>
              <li>
                <span className="method-icon">🎓</span>
                <div><strong>Expert Coaches</strong><p>All coaches are background-checked, child-communication trained and quality-monitored.</p></div>
              </li>
            </ul>
          </div>
          <div className="prg-method-visual reveal">
            <div className="prg-cohort-visual glass-panel">
              <div className="cohort-coach-frame">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/img/public/coach_teacher.png" alt="Expert TrueLern coach" className="cohort-coach-img-large" />
                <div className="cohort-coach-pill"><span>🎓</span><span>Expert Coach</span></div>
              </div>
              <div className="cohort-students-grid">
                {["Child A", "Child B", "Child C", "Child D", "Child E"].map((s) => (
                  <div key={s} className="cohort-student-tile">{s}</div>
                ))}
              </div>
              <div className="cohort-live-label">🔴 Live Cohort Session — Max 5 Students</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="prg-final-cta">
        <div className="container">
          <div className="programs-assessment-container reveal">
            <div className="programs-assessment-content">
              <span className="programs-assessment-badge">Free Assessment</span>
              <h2>Not sure which program matches your child?</h2>
              <p>
                Schedule a free demo class. We observe your child&apos;s communication, confidence, listening skills and thinking style to recommend the perfect learning track and cohort level.
              </p>
              <div className="programs-assessment-actions">
                <Link href="/book-demo" className="btn primary-btn">Book Free Demo</Link>
                <Link href="/contact" className="btn secondary-btn">Talk to an Advisor</Link>
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
