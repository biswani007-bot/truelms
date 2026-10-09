"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";

const sections = [
  { id: "acceptance", label: "1. Acceptance of Terms" },
  { id: "eligibility", label: "2. Eligibility & Accounts" },
  { id: "enrollment", label: "3. Enrollment & Subscriptions" },
  { id: "payments", label: "4. Payments & Billing" },
  { id: "conduct", label: "5. Respectful Code of Conduct" },
  { id: "technology", label: "6. Tech Requirements" },
  { id: "schedules", label: "7. Updates to Batches & Coaches" },
  { id: "liability", label: "8. Disclaimer & Liability Limit" },
];

export function TermsOfUseClient() {
  const [activeSection, setActiveSection] = useState("acceptance");

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="legal-page">
      <section className="legal-hero">
        <div className="container">
          <span className="legal-badge-pill">⚖️ Legal Framework</span>
          <h1>Terms of Use</h1>
          <p className="legal-meta-info">Last Updated: June 6, 2026</p>
          
          <div className="legal-notice-box">
            <span className="legal-notice-icon">⚠️</span>
            <span><strong>Draft Notice:</strong> This policy is a draft and should be reviewed by legal counsel before public launch.</span>
          </div>
        </div>
      </section>

      <section className="legal-content-section">
        <div className="container legal-grid">
          <aside className="legal-sidebar">
            <h3>Terms Navigation</h3>
            <ul className="legal-nav-list">
              {sections.map((sec) => (
                <li key={sec.id} className={`legal-nav-item ${activeSection === sec.id ? "active" : ""}`}>
                  <button onClick={() => scrollToSection(sec.id)}>{sec.label}</button>
                </li>
              ))}
            </ul>
          </aside>

          <div className="legal-document-card">
            <h2>Website &amp; Academy Service Terms</h2>
            <div className="legal-doc-content">
              
              <section id="acceptance">
                <h3>1. Acceptance of Terms</h3>
                <p>By accessing the website and enrolling a child in live cohorts at TrueLern, you (&quot;Parent&quot;, &quot;Guardian&quot;, &quot;User&quot;) agree to be bound by these Terms of Use and our policies. If you do not agree, please do not use our website or purchase access to our classes.</p>
              </section>

              <section id="eligibility">
                <h3>2. Eligibility &amp; Accounts</h3>
                <p>Our services are intended for children aged 6 to 14. However, registration, scheduling, billing, and portal access must be set up, managed, and approved by a parent or legal guardian over 18 years of age.</p>
                <p>Parents agree to provide accurate information (names, child&apos;s age, contact details, and location) and must keep their login details confidential. You are responsible for all activity occurring under your account.</p>
              </section>

              <section id="enrollment">
                <h3>3. Enrollment &amp; Subscriptions</h3>
                <p>TrueLern provides live online cohorts structured in levels (e.g., 36-class blocks). Enrollment reserves a seat in a specific batch for the duration of the level.</p>
                <ul>
                  <li>Seats are non-transferable between families.</li>
                  <li>Students are assigned cohorts based on age and developmental evaluations.</li>
                  <li>Truelern reserves the right to modify cohort levels if a child is found to be significantly misplaced in skill brackets.</li>
                </ul>
              </section>

              <section id="payments">
                <h3>4. Payments &amp; Billing</h3>
                <p>All fees must be paid in advance via our secure payment gateway prior to the commencement of the learning block.</p>
                <ul>
                  <li><strong>Refund Policy:</strong> We offer a 100% money-back guarantee for the first two classes if the child is unsatisfied. After the second class, refunds are issued on a pro-rata basis minus administrative fees.</li>
                  <li><strong>Subscription Renewal:</strong> Progressing to the next level requires a new subscription authorization.</li>
                </ul>
              </section>

              <section id="conduct">
                <h3>5. Respectful Code of Conduct</h3>
                <p>Because TrueLern focuses on communication and confidence, class environments must remain psychologically safe. We enforce a strict Anti-Bullying Protocol.</p>
                <ul>
                  <li>Any harassment, mocking, or disrespectful behavior during live sessions may result in immediate muting or removal from the cohort.</li>
                  <li>Repeated violations will result in permanent suspension without a refund.</li>
                </ul>
              </section>

              <section id="technology">
                <h3>6. Tech Requirements</h3>
                <p>Parents must ensure their child has access to a working webcam, microphone, stable internet, and a distraction-free physical room. Truelern is not responsible for missed classes due to a parent&apos;s hardware or network failure.</p>
              </section>

              <section id="schedules">
                <h3>7. Updates to Batches &amp; Coaches</h3>
                <p>We strive for consistency, but we reserve the right to merge batches if attendance drops below operational viability or to substitute coaches in the event of illness or emergency.</p>
              </section>

              <section id="liability">
                <h3>8. Disclaimer &amp; Liability Limit</h3>
                <p>TrueLern operates as a supplemental education tool. We do not guarantee specific academic grades or psychological transformations. Our total liability for any claim arising from these terms will not exceed the total fees paid by the parent during the current subscription block.</p>
              </section>
              
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
