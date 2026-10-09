"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { FloatingDecorations } from "../../../components/public/floating-decorations";
import "../../../app/(public)/css/pages/user/FAQ.css";

/* eslint-disable @next/next/no-img-element */

export function FAQClient({ faqs }: { faqs: { question: string; answer: string }[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleAccordion = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const fadeInUp: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
  };

  const staggerContainer: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  return (
    <div className="fq-faq-page">
      {/* ── SECTION 1: HERO SECTION ── */}
      <section className="fq-hero">
        <FloatingDecorations count={10} />

        <div className="container fq-hero-container">
          <div className="fq-hero-grid">
            <motion.div
              className="fq-hero-content"
              initial="hidden"
              animate="visible"
              variants={fadeInUp}
            >
              <span className="fq-badge-pill">💬 Parent Support Desk</span>
              <h1>Frequently Asked Questions</h1>
              <p className="fq-hero-sub">
                Find answers to common questions about TrueLern programs, classes, pricing, demos, coaches and parent progress updates.
              </p>
              <div className="fq-hero-actions">
                <Link href="/book-demo" className="fq-btn-primary">
                  Book Free Demo
                </Link>
                <Link href="/contact" className="fq-btn-outline">
                  Contact Us
                </Link>
              </div>
            </motion.div>

            <motion.div
              className="fq-hero-visual"
              initial="hidden"
              animate="visible"
              variants={fadeInUp}
            >
              <div className="fq-visual-box glass-panel">
                <img
                  src="/img/public/coach_teacher.png"
                  alt="Parent asking questions illustration"
                  className="fq-hero-img bob-animation"
                />
                <div className="fq-float-badge fq-badge-1">❓ Classes</div>
                <div className="fq-float-badge fq-badge-2">💡 Pricing</div>
                <div className="fq-float-badge fq-badge-3">🌱 Growth</div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── SECTION 2: FAQ ACCORDION ── */}
      <section className="fq-section fq-accordion-section">
        <div className="container">
          <div className="fq-section-header text-center">
            <span className="fq-section-tag">Direct Answers</span>
            <h2>Academy FAQ</h2>
          </div>

          <motion.div
            className="fq-accordion-list"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
          >
            {faqs.map((item, index) => {
              const isOpen = openIndex === index;
              return (
                <motion.div
                  key={index}
                  className={`fq-accordion-item glass-panel ${isOpen ? "active" : ""}`}
                  variants={fadeInUp}
                >
                  <button
                    className="fq-accordion-question"
                    onClick={() => toggleAccordion(index)}
                    aria-expanded={isOpen}
                  >
                    <span>{item.question}</span>
                    <span className="fq-accordion-arrow">{isOpen ? "−" : "+"}</span>
                  </button>
                  <div
                    className="fq-accordion-answer-wrapper"
                    style={{
                      display: "grid",
                      gridTemplateRows: isOpen ? "1fr" : "0fr",
                      transition: "grid-template-rows 0.25s ease-in-out",
                    }}
                  >
                    <div style={{ overflow: "hidden" }}>
                      <div className="fq-accordion-answer-inner">
                        <p>{item.answer}</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* ── SECTION 3: STILL HAVE QUESTIONS? ── */}
      <section className="fq-section fq-still-questions">
        <div className="container">
          <div className="fq-grid-still glass-panel">
            <div className="fq-still-visual">
              <img
                src="/img/public/robot_ai.png"
                alt="Parent support illustration"
                className="fq-still-img bob-animation"
              />
            </div>

            <div className="fq-still-content">
              <h2>Still have questions?</h2>
              <p>
                Our team is happy to help parents understand the right program, age group and learning path for their child.
              </p>

              <div className="fq-contact-cards">
                <div className="fq-contact-card">
                  <span className="fq-card-icon">💬</span>
                  <div>
                    <strong>WhatsApp Helpdesk</strong>
                    <p>Live coordinators ready to match batches and schedules.</p>
                  </div>
                </div>
                <div className="fq-contact-card">
                  <span className="fq-card-icon">✉️</span>
                  <div>
                    <strong>Email Support</strong>
                    <p>Get a detailed response within 24 business hours.</p>
                  </div>
                </div>
              </div>

              <div className="fq-still-actions">
                <Link href="/book-demo" className="fq-btn-still-primary">
                  Book Free Demo
                </Link>
                <Link href="/contact" className="fq-btn-still-outline">
                  Contact Support
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 4: FINAL CTA ── */}
      <section className="fq-cta">
        <div className="container">
          <div className="fq-cta-card glass-panel text-center">
            <div className="fq-cta-decor">
              <img
                src="/img/public/trophy_star.png"
                alt="Parent and child success illustration"
                className="fq-cta-trophy bob-animation"
              />
              <img
                src="/img/public/rocket_space.png"
                alt="Achievement badges"
                className="fq-cta-rocket float-animation"
              />
            </div>

            <h2>Watch Your Child Build Practical Competence</h2>
            <p>
              Every child starts with a trial evaluation. Receive a detailed developmental diagnostic scorecard report before choosing a plan.
            </p>

            <Link href="/book-demo" className="fq-btn-cta">
              Book Free Demo
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
