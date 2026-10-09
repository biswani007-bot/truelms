"use client";

import React, { useState } from "react";
import "../css/pages/user/Contact.css"; // Ensure Contact CSS is imported

export default function ContactPage() {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setErrorMsg("");

    try {
      const res = await fetch("/api/public/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          phone: form.phone,
          message: form.message,
          courseInterest: form.subject,
          subject: form.subject,
          source: "contact-form",
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.message || "Submission failed.");
      }

      setStatus("success");
      setForm({ firstName: "", lastName: "", email: "", phone: "", subject: "", message: "" });
    } catch (err: unknown) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "An error occurred. Please try again.");
    }
  };

  return (
    <div className="cop-contact-page">
      {/* Hero */}
      <section className="cop-hero">
        <div className="cop-hero-bg">
          <div className="cop-orb cop-orb-blue"></div>
          <div className="cop-orb cop-orb-purple"></div>
          <div className="cop-orb cop-orb-teal"></div>
        </div>
        <div className="container">
          <div className="cop-hero-grid">
            <div className="cop-hero-content">
              <span className="cop-section-tag">Get in Touch</span>
              <h1>Contact TrueLern</h1>
              <p className="cop-hero-sub">
                Have questions about our programs, admissions process, or fees? Our
                coordinators will respond within 24 hours.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="cop-section" style={{ padding: "5rem 0" }}>
        <div className="container" style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "3rem" }}>
          
          {/* Contact Info */}
          <div className="cop-info-col" style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
            <div>
              <h2 style={{ fontSize: "1.5rem", fontWeight: "800", marginBottom: "0.5rem" }}>Contact Details</h2>
              <p style={{ color: "var(--text-muted)", lineHeight: "1.6" }}>
                Reach out through any channel. Our team is available Monday to
                Friday 9 AM – 6 PM PST.
              </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              {[
                {
                  icon: "✉️",
                  label: "Admissions Email",
                  value: "admissions@truelern.com",
                  href: "mailto:admissions@truelern.com",
                },
                {
                  icon: "📞",
                  label: "Phone",
                  value: "+1 (555) 012-3456",
                  href: "tel:+15550123456",
                },
                {
                  icon: "📍",
                  label: "Office Address",
                  value: "100 Pine Street, San Francisco, CA 94111",
                  href: null,
                },
                {
                  icon: "🕐",
                  label: "Business Hours",
                  value: "Monday – Friday: 9 AM – 6 PM PST",
                  href: null,
                },
              ].map((item) => (
                <div key={item.label} style={{ display: "flex", alignItems: "flex-start", gap: "1rem" }}>
                  <div style={{ fontSize: "1.5rem", background: "var(--purple-glow)", width: "45px", height: "45px", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {item.icon}
                  </div>
                  <div>
                    <p style={{ fontSize: "0.8rem", fontWeight: "700", textTransform: "uppercase", color: "var(--text-muted)", letterSpacing: "0.05em", marginBottom: "0.2rem" }}>
                      {item.label}
                    </p>
                    {item.href ? (
                      <a href={item.href} style={{ color: "var(--primary)", fontWeight: "600", textDecoration: "none" }}>
                        {item.value}
                      </a>
                    ) : (
                      <p style={{ fontWeight: "500", color: "var(--text-main)" }}>{item.value}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            {/* Social */}
            <div style={{ paddingTop: "1rem", borderTop: "1px solid rgba(15, 23, 42, 0.08)" }}>
              <p style={{ fontSize: "0.8rem", fontWeight: "700", textTransform: "uppercase", color: "var(--text-muted)", letterSpacing: "0.05em", marginBottom: "1rem" }}>
                Follow Us
              </p>
              <div style={{ display: "flex", gap: "1rem" }}>
                {[
                  { name: "LinkedIn", href: "https://linkedin.com/company/truelern" },
                  { name: "Twitter", href: "https://twitter.com/truelern" },
                ].map((s) => (
                  <a
                    key={s.name}
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ padding: "8px 16px", borderRadius: "8px", border: "1px solid rgba(15, 23, 42, 0.08)", fontSize: "0.9rem", fontWeight: "600", color: "var(--text-main)", textDecoration: "none", transition: "all 0.2s" }}
                  >
                    {s.name}
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="cop-form-wrapper" style={{ padding: "3rem", background: "#ffffff" }}>
            <h2 style={{ fontSize: "1.8rem", fontWeight: "800", marginBottom: "0.5rem" }}>Send an Inquiry</h2>
            <p style={{ color: "var(--text-muted)", marginBottom: "2rem" }}>
              Fill in the form below and our team will get back to you shortly.
            </p>

            {status === "success" ? (
              <div style={{ padding: "2rem", background: "rgba(34, 197, 94, 0.1)", border: "1px solid rgba(34, 197, 94, 0.2)", borderRadius: "16px", textAlign: "center" }}>
                <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🎉</div>
                <h3 style={{ fontSize: "1.3rem", fontWeight: "800", color: "#166534", marginBottom: "0.5rem" }}>Inquiry Received!</h3>
                <p style={{ color: "#15803d" }}>
                  Thank you for reaching out. Our admissions team will contact you
                  within 24 hours.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
                  <div className="cop-input-group" style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    <label htmlFor="contact-firstName" style={{ fontSize: "0.9rem", fontWeight: "700" }}>First Name *</label>
                    <input
                      id="contact-firstName"
                      name="firstName"
                      type="text"
                      required
                      value={form.firstName}
                      onChange={handleChange}
                      placeholder="Sarah"
                      style={{ padding: "0.85rem 1rem", border: "1.5px solid rgba(15, 23, 42, 0.08)", borderRadius: "10px", fontSize: "0.95rem" }}
                    />
                  </div>
                  <div className="cop-input-group" style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    <label htmlFor="contact-lastName" style={{ fontSize: "0.9rem", fontWeight: "700" }}>Last Name *</label>
                    <input
                      id="contact-lastName"
                      name="lastName"
                      type="text"
                      required
                      value={form.lastName}
                      onChange={handleChange}
                      placeholder="Connor"
                      style={{ padding: "0.85rem 1rem", border: "1.5px solid rgba(15, 23, 42, 0.08)", borderRadius: "10px", fontSize: "0.95rem" }}
                    />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
                  <div className="cop-input-group" style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    <label htmlFor="contact-email" style={{ fontSize: "0.9rem", fontWeight: "700" }}>Email Address *</label>
                    <input
                      id="contact-email"
                      name="email"
                      type="email"
                      required
                      value={form.email}
                      onChange={handleChange}
                      placeholder="sarah@example.com"
                      style={{ padding: "0.85rem 1rem", border: "1.5px solid rgba(15, 23, 42, 0.08)", borderRadius: "10px", fontSize: "0.95rem" }}
                    />
                  </div>
                  <div className="cop-input-group" style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    <label htmlFor="contact-phone" style={{ fontSize: "0.9rem", fontWeight: "700" }}>Phone Number</label>
                    <input
                      id="contact-phone"
                      name="phone"
                      type="tel"
                      value={form.phone}
                      onChange={handleChange}
                      placeholder="+1 555 000 0000"
                      style={{ padding: "0.85rem 1rem", border: "1.5px solid rgba(15, 23, 42, 0.08)", borderRadius: "10px", fontSize: "0.95rem" }}
                    />
                  </div>
                </div>

                <div className="cop-input-group" style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  <label htmlFor="contact-subject" style={{ fontSize: "0.9rem", fontWeight: "700" }}>Subject</label>
                  <select
                    id="contact-subject"
                    name="subject"
                    value={form.subject}
                    onChange={handleChange}
                    style={{ padding: "0.85rem 1rem", border: "1.5px solid rgba(15, 23, 42, 0.08)", borderRadius: "10px", fontSize: "0.95rem" }}
                  >
                    <option value="">Select a topic</option>
                    <option value="admissions">Admissions Inquiry</option>
                    <option value="fees">Fees & Payments</option>
                    <option value="courses">Course Information</option>
                    <option value="technical">Technical Support</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="cop-input-group" style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  <label htmlFor="contact-message" style={{ fontSize: "0.9rem", fontWeight: "700" }}>Message *</label>
                  <textarea
                    id="contact-message"
                    name="message"
                    rows={5}
                    required
                    value={form.message}
                    onChange={handleChange}
                    placeholder="Tell us about your learning goals and any specific questions you have..."
                    style={{ padding: "0.85rem 1rem", border: "1.5px solid rgba(15, 23, 42, 0.08)", borderRadius: "10px", fontSize: "0.95rem", resize: "none" }}
                  />
                </div>

                {status === "error" && (
                  <p style={{ padding: "1rem", background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.2)", borderRadius: "8px", color: "#991b1b", fontSize: "0.9rem", fontWeight: "600" }}>
                    {errorMsg}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={status === "loading"}
                  className="cop-btn-primary"
                  style={{ width: "100%", justifyContent: "center", border: "none", cursor: "pointer", marginTop: "0.5rem" }}
                >
                  {status === "loading" ? "Sending..." : "Send Inquiry"}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
