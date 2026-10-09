// @ts-nocheck
"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { FloatingDecorations } from "../../../components/public/floating-decorations";

// Note: API integration will be done in the backend connection phase.

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] } },
};

export function ReferralClient() {
  const [formData, setFormData] = useState({
    referrerName: "", referrerContact: "", referredName: "", referredContact: "",
    childAge: "", programInterest: "Junior Foundation", permission: false,
  });
  const [status, setStatus] = useState<{ loading: boolean; success: boolean; error: string | null }>({ loading: false, success: false, error: null });

  const isFormValid =
    formData.referrerName.trim() !== "" &&
    formData.referrerContact.trim() !== "" &&
    formData.referredName.trim() !== "" &&
    formData.referredContact.trim() !== "" &&
    formData.childAge.trim() !== "" &&
    formData.permission;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const value = e.target.type === "checkbox" ? (e.target as HTMLInputElement).checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) {
      setStatus({ loading: false, success: false, error: "Please fill in all required fields and check the permission box." });
      return;
    }
    if (!formData.permission) {
      setStatus({ loading: false, success: false, error: "You must confirm permission to contact the referred parent." });
      return;
    }
    setStatus({ loading: true, success: false, error: null });

    // Mock API submission
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setStatus({ loading: false, success: true, error: null });
      setFormData({
        referrerName: "", referrerContact: "", referredName: "", referredContact: "",
        childAge: "", programInterest: "Junior Foundation", permission: false,
      });
    } catch (err: any) {
      console.error(err);
      setStatus({ loading: false, success: false, error: err.message || "Something went wrong. Please try again." });
    }
  };

  return (
    <div className="rp-referral-page">
      {/* ── HERO ── */}
      <section className="rp-hero">
        <FloatingDecorations count={10} />
        <div className="container rp-hero-container">
          <motion.div className="rp-hero-content text-center" initial="hidden" animate="visible" variants={fadeInUp}>
            <span className="rp-badge-pill">🤝 Community Network</span>
            <h1>Know a family whose child could benefit from TrueLern?</h1>
            <p className="rp-hero-sub">Refer them to TrueLern and help another child build practical skills beyond school.</p>
            <div className="rp-hero-actions">
              <a href="#referral-form" className="rp-btn-primary">Invite a Family</a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── EXPLANATION ── */}
      <section className="rp-section rp-explanation">
        <div className="container">
          <motion.div className="rp-explanation-card glass-panel text-center" initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={fadeInUp}>
            <h3>TrueLern Grows Best Through Parent Trust</h3>
            <p className="rp-highlight-desc">
              &ldquo;If you know a family looking for confidence, communication, money skills, emotional intelligence or future-readiness programs for their child, invite them to book a free demo.&rdquo;
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── REWARDS ── */}
      <section className="rp-section rp-rewards">
        <div className="container">
          <div className="rp-grid-rewards">
            <motion.div className="rp-rewards-content" initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={fadeInUp}>
              <span className="rp-section-tag">Referral Benefits</span>
              <h2>Why Refer Your Friends?</h2>
              <p>We believe learning is more impactful when kids share experiences with peers they trust.</p>

              <div className="rp-benefits-list">
                <div className="rp-benefit-box glass-panel">
                  <span className="rp-benefit-emoji">🎁</span>
                  <div><h4>Gift a Free Evaluation Class</h4><p>Your referred friend receives a completely free 45-minute live trial and a detailed developmental diagnostic scorecard report.</p></div>
                </div>
                <div className="rp-benefit-box glass-panel">
                  <span className="rp-benefit-emoji">👥</span>
                  <div><h4>Co-Learning Cohort Buddies</h4><p>Peer activities are more engaging when friends or cousins join public speaking debates, prompt battles, or budgeting sandboxes together.</p></div>
                </div>
                <div className="rp-benefit-box glass-panel">
                  <span className="rp-benefit-emoji">💳</span>
                  <div><h4>Earn Learning Rewards</h4><p>Receive a $50 Amazon Gift Card or monthly learning credits toward your child&apos;s subscription when the referred family enrolls in a full track.</p></div>
                </div>
              </div>
            </motion.div>

            <motion.div className="rp-rewards-visual" initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={fadeInUp}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/img/public/trophy_star.png" alt="Parent Referral Illustration" className="rp-3d-visual bob-animation" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── FORM ── */}
      <section id="referral-form" className="rp-section rp-form-section">
        <div className="container rp-container-form">
          <div className="rp-grid-form">
            <motion.div className="rp-form-visual" initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={fadeInUp}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/img/public/rocket_space.png" alt="Family Recommendation Visuals" className="rp-3d-visual bob-animation" />
            </motion.div>

            <motion.div className="rp-form-card glass-panel" initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={fadeInUp}>
              <div className="rp-form-header text-center">
                <h3>Share the Gift of Practical Skills</h3>
                <p>Provide contact details below. We will send the family an invitation on your behalf.</p>
              </div>

              {status.success && (
                <div className="rp-alert rp-alert-success">
                  🎉 Referral submitted successfully! We will contact the referred family and copy you on the email.
                </div>
              )}
              
              {status.error && (
                <div className="rp-alert rp-alert-danger">
                  ⚠️ {status.error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="rp-form">
                <div className="rp-form-row">
                  <div className="rp-input-group">
                    <label htmlFor="referrerName">Your Name*</label>
                    <input type="text" id="referrerName" name="referrerName" required placeholder="Enter your name" value={formData.referrerName} onChange={handleChange} />
                  </div>
                  <div className="rp-input-group">
                    <label htmlFor="referrerContact">Your Phone / Email*</label>
                    <input type="text" id="referrerContact" name="referrerContact" required placeholder="Enter your phone or email" value={formData.referrerContact} onChange={handleChange} />
                  </div>
                </div>

                <div className="rp-form-row">
                  <div className="rp-input-group">
                    <label htmlFor="referredName">Referred Parent Name*</label>
                    <input type="text" id="referredName" name="referredName" required placeholder="Enter your friend's name" value={formData.referredName} onChange={handleChange} />
                  </div>
                  <div className="rp-input-group">
                    <label htmlFor="referredContact">Referred Parent Phone / Email*</label>
                    <input type="text" id="referredContact" name="referredContact" required placeholder="Enter friend's phone or email" value={formData.referredContact} onChange={handleChange} />
                  </div>
                </div>

                <div className="rp-form-row">
                  <div className="rp-input-group">
                    <label htmlFor="childAge">Child Age*</label>
                    <input type="number" id="childAge" name="childAge" required placeholder="Child's age (e.g. 9)" value={formData.childAge} onChange={handleChange} />
                  </div>
                  <div className="rp-input-group">
                    <label htmlFor="programInterest">Program Interest*</label>
                    <select id="programInterest" name="programInterest" value={formData.programInterest} onChange={handleChange}>
                      <option value="Junior Foundation">Junior Foundation (Ages 6-10)</option>
                      <option value="Future-Ready Builders">Future-Ready Builders (Ages 9-14)</option>
                      <option value="Communication">Communication & Public Speaking</option>
                      <option value="Money Skills">Money Skills & Budgeting</option>
                      <option value="AI Readiness">AI Readiness & Tech</option>
                      <option value="Time Management">Time Management & Habits</option>
                      <option value="Practical Thinking">Practical Thinking & Logic</option>
                    </select>
                  </div>
                </div>

                <div className="rp-checkbox-group">
                  <input type="checkbox" id="permission" name="permission" required checked={formData.permission} onChange={handleChange} />
                  <label htmlFor="permission">I confirm that the referred parent is open to being contacted about TrueLern.*</label>
                </div>

                <button
                  type="submit"
                  className={`rp-btn-submit${status.loading ? " rp-btn-submit--disabled" : ""}`}
                  disabled={status.loading}
                  aria-disabled={status.loading}
                  title={status.loading ? "Sending invitation" : "Send invitation"}
                >
                  {status.loading
                    ? "Sending Invitation..."
                    : "Send Invitation →"}
                </button>
              </form>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}
