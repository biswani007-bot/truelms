// @ts-nocheck
"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
// Note: We'll temporarily mock the API call since we are just doing the UI migration right now.
// The real API integration for this form will be part of the backend connection phase,
// but we will keep the form structure exactly as it was.

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] } },
};

const hiringPipeline = [
  { step: "1", title: "Application Review" },
  { step: "2", title: "Shortlisting" },
  { step: "3", title: "Demo Teaching Test" },
  { step: "4", title: "Interview" },
  { step: "5", title: "Background Verification" },
  { step: "6", title: "Training" },
  { step: "7", title: "Trial Class" },
  { step: "8", title: "Batch Allocation" },
];

export function TeachWithUsClient() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    cityCountry: "",
    qualification: "",
    experience: "1-2 years",
    skills: "",
    preferredAge: "Ages 6-10",
    onlineExperience: "No prior experience",
    resumeUrl: "",
    demoVideoLink: "",
    timeSlots: "",
    statement: "",
  });

  const [status, setStatus] = useState<{ loading: boolean; success: boolean; error: string | null }>({
    loading: false,
    success: false,
    error: null,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus({ loading: true, success: false, error: null });

    // Mock API submission for now to match UI behavior
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setStatus({ loading: false, success: true, error: null });
      setFormData({
        name: "", email: "", phone: "", cityCountry: "", qualification: "",
        experience: "1-2 years", skills: "", preferredAge: "Ages 6-10",
        onlineExperience: "No prior experience", resumeUrl: "", demoVideoLink: "",
        timeSlots: "", statement: "",
      });
    } catch (err: any) {
      console.error(err);
      setStatus({ loading: false, success: false, error: err.message || "Something went wrong. Please try again." });
    }
  };

  return (
    <div className="tp-teach-page">
      {/* ── HERO ── */}
      <section className="tp-hero">
        <div className="tp-hero-bg">
          <div className="tp-orb tp-orb-blue" />
          <div className="tp-orb tp-orb-purple" />
        </div>

        <div className="container tp-hero-container">
          <motion.div className="tp-hero-content text-center" initial="hidden" animate="visible" variants={fadeInUp}>
            <span className="tp-badge-pill">💼 Global Faculty Careers</span>
            <h1>Teach practical skills that children will use for life.</h1>
            <p className="tp-hero-sub">
              TrueLern is looking for child-friendly online coaches who can teach confidence, communication, emotional intelligence, money skills, AI readiness and practical thinking through structured live classes.
            </p>
            <div className="tp-hero-actions">
              <a href="#apply-form" className="tp-btn-primary">Apply Now</a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── PIPELINE ── */}
      <section className="tp-section tp-process">
        <div className="container">
          <div className="tp-section-header text-center">
            <span className="tp-section-tag">Hiring Pipeline</span>
            <h2>Hiring Process Timeline</h2>
            <p className="tp-section-sub">Our transparent 8-stage verification pipeline ensures classroom safety and quality.</p>
          </div>

          <div className="tp-pipeline-grid">
            {hiringPipeline.map((node, index) => (
              <div key={index} className="tp-pipeline-node glass-panel">
                <span className="tp-node-num">{node.step}</span>
                <h4>{node.title}</h4>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FORM ── */}
      <section id="apply-form" className="tp-section tp-form-section">
        <div className="container tp-container-form">
          <div className="tp-form-card glass-panel">
            <div className="tp-form-header text-center">
              <h3>Become an TrueLern Coach</h3>
              <p>Complete the fields below exactly to initiate your screening process.</p>
            </div>

            {status.success && (
              <div className="tp-alert tp-alert-success">
                🎉 Application submitted successfully! Our recruiting team will contact you shortly.
              </div>
            )}
            
            {status.error && (
              <div className="tp-alert tp-alert-danger">
                ⚠️ {status.error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="tp-form">
              <div className="tp-form-grid">
                
                <div className="tp-input-group">
                  <label htmlFor="name">Full Name*</label>
                  <input type="text" id="name" name="name" required placeholder="Enter your full name" value={formData.name} onChange={handleChange} />
                </div>

                <div className="tp-input-group">
                  <label htmlFor="email">Email*</label>
                  <input type="email" id="email" name="email" required placeholder="name@email.com" value={formData.email} onChange={handleChange} />
                </div>

                <div className="tp-input-group">
                  <label htmlFor="phone">Phone / WhatsApp*</label>
                  <input type="tel" id="phone" name="phone" required placeholder="e.g. +1 555-0199" value={formData.phone} onChange={handleChange} />
                </div>

                <div className="tp-input-group">
                  <label htmlFor="cityCountry">City and Country*</label>
                  <input type="text" id="cityCountry" name="cityCountry" required placeholder="e.g. Toronto, Canada" value={formData.cityCountry} onChange={handleChange} />
                </div>

                <div className="tp-input-group">
                  <label htmlFor="qualification">Highest Qualification*</label>
                  <input type="text" id="qualification" name="qualification" required placeholder="e.g. BA in Communication, BS in Computer Science" value={formData.qualification} onChange={handleChange} />
                </div>

                <div className="tp-input-group">
                  <label htmlFor="experience">Teaching Experience*</label>
                  <select id="experience" name="experience" value={formData.experience} onChange={handleChange}>
                    <option value="No prior experience">No prior experience</option>
                    <option value="1-2 years">1-2 years</option>
                    <option value="3-5 years">3-5 years</option>
                    <option value="5+ years">5+ years</option>
                  </select>
                </div>

                <div className="tp-input-group tp-full-width">
                  <label htmlFor="skills">Subjects or Skills You Can Teach*</label>
                  <input type="text" id="skills" name="skills" required placeholder="e.g. Public Speaking, Basic Finance, Debate, Coding basics" value={formData.skills} onChange={handleChange} />
                </div>

                <div className="tp-input-group">
                  <label htmlFor="preferredAge">Preferred Age Group*</label>
                  <select id="preferredAge" name="preferredAge" value={formData.preferredAge} onChange={handleChange}>
                    <option value="Ages 6-10">Ages 6-10</option>
                    <option value="Ages 11-14">Ages 11-14</option>
                    <option value="Ages 15-18">Ages 15-18</option>
                    <option value="All Ages">Comfortable with all ages</option>
                  </select>
                </div>

                <div className="tp-input-group">
                  <label htmlFor="onlineExperience">Online Teaching Experience*</label>
                  <select id="onlineExperience" name="onlineExperience" value={formData.onlineExperience} onChange={handleChange}>
                    <option value="No prior experience">No prior experience</option>
                    <option value="1-2 years">1-2 years</option>
                    <option value="3+ years">3+ years</option>
                  </select>
                </div>

                <div className="tp-input-group">
                  <label htmlFor="resumeUrl">Link to Resume / LinkedIn Profile*</label>
                  <input type="url" id="resumeUrl" name="resumeUrl" required placeholder="https://linkedin.com/in/yourprofile" value={formData.resumeUrl} onChange={handleChange} />
                </div>

                <div className="tp-input-group">
                  <label htmlFor="demoVideoLink">Link to a Demo Teaching Video (Optional)</label>
                  <input type="url" id="demoVideoLink" name="demoVideoLink" placeholder="YouTube or Drive link (max 2-3 mins)" value={formData.demoVideoLink} onChange={handleChange} />
                </div>

                <div className="tp-input-group tp-full-width">
                  <label htmlFor="timeSlots">Available Time Slots (Your Local Time)*</label>
                  <input type="text" id="timeSlots" name="timeSlots" required placeholder="e.g. Weekdays 4 PM - 8 PM, Weekends 10 AM - 2 PM" value={formData.timeSlots} onChange={handleChange} />
                </div>

                <div className="tp-input-group tp-full-width">
                  <label htmlFor="statement">Why do you want to teach at TrueLern?*</label>
                  <textarea id="statement" name="statement" required rows={4} placeholder="Tell us about your teaching philosophy and why you fit our pedagogical model..." value={formData.statement} onChange={handleChange}></textarea>
                </div>

              </div>

              <div className="tp-submit-row">
                <button type="submit" className="tp-btn-submit" disabled={status.loading}>
                  {status.loading ? "Submitting Application..." : "Submit Application"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}
