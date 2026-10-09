"use client";

import React, { useState } from "react";
import Link from "next/link";

const sections = [
  { id: "principles", label: "1. Safety Principles" },
  { id: "platforms", label: "2. Approved Platforms" },
  { id: "teachers", label: "3. Coach Verification" },
  { id: "supervision", label: "4. Class Supervision" },
  { id: "communication", label: "5. Child-Friendly Code" },
  { id: "escalation", label: "6. Parent Escalation" },
  { id: "complaints", label: "7. Complaint Handling" },
];

export function ChildSafetyPolicyClient() {
  const [activeSection, setActiveSection] = useState("principles");

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
          <span className="legal-badge-pill">🛡️ Safety &amp; Trust</span>
          <h1>Child Safety Policy</h1>
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
            <h2>Online Safety &amp; Child Protection Standards</h2>
            <div className="legal-doc-content">
              
              <section id="principles">
                <h3>1. Safety Principles</h3>
                <p>At TrueLern, child safety is our highest priority. We maintain a zero-tolerance stance towards child abuse, harassment, discrimination, or digital neglect. Our cohorts are designed to ensure an encouraging, secure, and monitored digital workspace for children aged 6 to 14.</p>
              </section>

              <section id="platforms">
                <h3>2. Approved Platforms</h3>
                <p>All live cohorts are hosted on secure enterprise-grade systems with specific safety configurations:</p>
                <ul>
                  <li><strong>Encrypted Video Streams:</strong> Cohorts are held on secure Zoom licenses with random password generations and waiting rooms enabled.</li>
                  <li><strong>Locked Classrooms:</strong> Coaches lock classrooms 10 minutes after starting to prevent unauthorized guests from joining.</li>
                  <li><strong>No Private Messaging:</strong> Student-to-student private chat is deactivated inside classes. All messaging must go through the main public window visible to the coach.</li>
                </ul>
              </section>

              <section id="teachers">
                <h3>3. Coach Verification</h3>
                <p>We ensure that children interact only with verified, qualified, and highly trained coaches:</p>
                <ul>
                  <li><strong>Background Audits:</strong> Every cohort instructor must pass a Vulnerable Sector Check (VSC) and police background clearance before starting.</li>
                  <li><strong>Professional History:</strong> We verify academic credentials in child psychology, early education, coaching, or related disciplines.</li>
                  <li><strong>Behavior Training:</strong> Coaches complete child abuse prevention, respectful management, and digital escalation modules.</li>
                </ul>
              </section>

              <section id="supervision">
                <h3>4. Class Supervision</h3>
                <p>We manage classroom supervision standards to prevent isolation and protect students:</p>
                <ul>
                  <li>Coaches are strictly prohibited from conducting one-on-one sessions with a child without a parent or a second coordinator present.</li>
                  <li>Random safety audits of live streams are conducted by TrueLern&apos;s internal operations leads.</li>
                  <li>Video cameras are required to be kept active during class to verify identity and peer participation.</li>
                </ul>
              </section>

              <section id="communication">
                <h3>5. Child-Friendly Code</h3>
                <p>All communications between teachers, students, and coordinators must remain child-friendly, professional, and transparent:</p>
                <ul>
                  <li><strong>Approved Channels:</strong> Staff are strictly prohibited from messaging students on personal social media, personal emails, or telephone channels. All communication goes through parents.</li>
                  <li><strong>Tone of Voice:</strong> Instructions are delivered using encouraging, positive, and construct-focused language. Negative labeling or shouting is banned.</li>
                </ul>
              </section>

              <section id="escalation">
                <h3>6. Parent Escalation Process</h3>
                <div className="legal-callout-box">
                  <strong>Reporting Safety Concerns</strong>
                  <br />
                  If a student or parent notices any inappropriate behavior from another student or instructor, they can report it immediately. Send an email to <a href="mailto:safety@truelern.com">safety@truelern.com</a> or call our safety helpdesk at 1-800-123-4567. All reports are investigated with complete confidentiality.
                </div>
              </section>

              <section id="complaints">
                <h3>7. Complaint Handling</h3>
                <p>Upon receiving a safety complaint:</p>
                <ol>
                  <li>The implicated account (instructor or student) is placed on temporary suspension pending investigation.</li>
                  <li>An internal audit committee reviews recording archives and class logs within 24 hours.</li>
                  <li>Findings are shared with the reporting parents and appropriate legal/administrative bodies if local child protection statutes require it.</li>
                </ol>
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
