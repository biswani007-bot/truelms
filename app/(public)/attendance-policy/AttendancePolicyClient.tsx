"use client";

import React, { useState } from "react";
import Link from "next/link";

const sections = [
  { id: "punctuality", label: "1. Punctuality & Joining" },
  { id: "internet", label: "2. Internet & Technical Prep" },
  { id: "materials", label: "3. Required Class Materials" },
  { id: "workspace", label: "4. Quiet Learning Spaces" },
  { id: "makeups", label: "5. Make-up Class Rules" },
  { id: "recordings", label: "6. Class Recordings" },
  { id: "rescheduling", label: "7. Rescheduling Policies" },
];

export function AttendancePolicyClient() {
  const [activeSection, setActiveSection] = useState("punctuality");

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="legal-page">
      {/* ── HERO ── */}
      <section className="legal-hero">
        <div className="container">
          <span className="legal-badge-pill">📅 Class Rules</span>
          <h1>Attendance &amp; Class Policy</h1>
          <p className="legal-meta-info">Last Updated: June 6, 2026</p>
          
          <div className="legal-notice-box">
            <span className="legal-notice-icon">⚠️</span>
            <span><strong>Draft Notice:</strong> This policy is a draft and should be reviewed by legal counsel before public launch.</span>
          </div>
        </div>
      </section>

      {/* ── CONTENT ── */}
      <section className="legal-content-section">
        <div className="container legal-grid">
          <aside className="legal-sidebar">
            <h3>Policy Navigation</h3>
            <ul className="legal-nav-list">
              {sections.map((sec) => (
                <li key={sec.id} className={`legal-nav-item ${activeSection === sec.id ? "active" : ""}`}>
                  <button onClick={() => scrollToSection(sec.id)}>{sec.label}</button>
                </li>
              ))}
            </ul>
          </aside>

          <div className="legal-document-card">
            <h2>Attendance Expectations &amp; Classroom Rules</h2>
            <div className="legal-doc-content">
              
              <section id="punctuality">
                <h3>1. Punctuality &amp; Joining</h3>
                <p>To maximize learning benefits and minimize disruption to group discussions, students must join sessions on time:</p>
                <ul>
                  <li><strong>Join Early:</strong> We recommend logging into the Zoom waiting room 5 minutes prior to class time.</li>
                  <li><strong>Late Access:</strong> Students arriving more than 10 minutes late will not be admitted to the class. This maintains classroom focus and avoids distracting other students during collaborative sprints.</li>
                </ul>
              </section>

              <section id="internet">
                <h3>2. Internet &amp; Technical Prep</h3>
                <p>Technical reliability is key to effective virtual peer collaboration. Parents must ensure:</p>
                <ul>
                  <li>A broadband internet connection with adequate speeds to support continuous high-quality video streaming.</li>
                  <li>Webcams and microphones must remain enabled and active throughout the session. We teach confidence and communication; coaches must see and hear students to provide feedback.</li>
                  <li>Device software (Zoom client) is kept updated.</li>
                </ul>
              </section>

              <section id="materials">
                <h3>3. Required Class Materials</h3>
                <div className="legal-callout-box">
                  <strong>Standard Prep Materials</strong><br />
                  Every student must have a physical notebook and a pen/pencil ready for every class session. Many activities involve quick-drafting, mind mapping, and written challenges that complement our digital slides. Workbooks provided in the parent portal must be printed and ready.
                </div>
              </section>

              <section id="workspace">
                <h3>4. Quiet Learning Spaces</h3>
                <p>Students must join class from a quiet, distraction-free environment:</p>
                <ul>
                  <li>No background noise (televisions, loud conversation, playing music).</li>
                  <li>A dedicated study desk and ergonomic chair.</li>
                  <li>No other children or siblings playing in the immediate background.</li>
                  <li>Use of headphones with built-in microphones is strongly encouraged.</li>
                </ul>
              </section>

              <section id="makeups">
                <h3>5. Make-up Class Rules</h3>
                <p>If a student must miss a class due to illness or family emergency:</p>
                <ul>
                  <li>Parents can request a make-up class to join a parallel batch of the same level/topic, subject to slot availability.</li>
                  <li>A maximum of two (2) make-up sessions are allowed per 36-class level block.</li>
                  <li>Make-up classes must be completed within 14 days of the missed class.</li>
                </ul>
              </section>

              <section id="recordings">
                <h3>6. Class Recordings</h3>
                <p>To support review and student safety:</p>
                <ul>
                  <li>Classes are recorded for safety audits and to allow absent students to catch up on the coach&apos;s key explanations.</li>
                  <li>Recordings are made available within 24 hours in the parent portal and are automatically deleted after 30 days.</li>
                  <li>Parents and students are strictly prohibited from copying, download-sharing, or posting class recordings online.</li>
                </ul>
              </section>

              <section id="rescheduling">
                <h3>7. Rescheduling Policies</h3>
                <p>For scheduled individual demo sessions or standard classes, parents must provide a minimum of 24 hours&apos; notice to reschedule. Rescheduling requests made within 24 hours of the slot will be marked as a missed class and will count towards the make-up quota.</p>
              </section>

            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="legal-cta-section">
        <div className="container">
          <div className="legal-cta-card">
            <h2>Ready to Join Our Next Cohort?</h2>
            <p>Experience how TrueLern builds life habits and communication confidence in a free, interactive demo session.</p>
            <Link href="/book-demo" className="legal-btn-cta">Book a Free Demo Class</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
