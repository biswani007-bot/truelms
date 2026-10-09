import React from 'react';
import Link from 'next/link';

export const ViteFooter = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        {/* Column 1: Programs */}
        <div className="footer-column">
          <h3>Programs</h3>
          <ul className="footer-links">
            <li>
              <Link href="/junior-foundation">Junior Foundation</Link>
            </li>
            <li>
              <Link href="/future-ready-builders">Future Ready Builders</Link>
            </li>
            <li>
              <Link href="/communication">Communication & Confidence</Link>
            </li>
            <li>
              <Link href="/money-skills">Money Skills</Link>
            </li>
            <li>
              <Link href="/emotional-intelligence">Emotional Intelligence</Link>
            </li>
            <li>
              <Link href="/ai-readiness">AI Readiness</Link>
            </li>
            <li>
              <Link href="/time-management">Time Management & Habits</Link>
            </li>
            <li>
              <Link href="/practical-real-world-thinking">Practical Real-World Thinking</Link>
            </li>
          </ul>
        </div>

        {/* Column 2: Company */}
        <div className="footer-column">
          <h3>Company</h3>
          <ul className="footer-links">
            <li>
              <Link href="/about">About Us</Link>
            </li>
            <li>
              <Link href="/coaches">Our Coaches</Link>
            </li>
            <li>
              <Link href="/parent-progress">Parent Progress</Link>
            </li>
            <li>
              <Link href="/teach-with-us">Teach with Us</Link>
            </li>
            <li>
              <Link href="/referral">Referral Program</Link>
            </li>
            <li>
              <Link href="/blog">Blog</Link>
            </li>
          </ul>
        </div>

        {/* Column 3: Support */}
        <div className="footer-column">
          <h3>Support</h3>
          <ul className="footer-links">
            <li>
              <Link href="/faq">FAQs</Link>
            </li>
            <li>
              <Link href="/how-it-works">How It Works</Link>
            </li>
            <li>
              <Link href="/pricing">Pricing Plans</Link>
            </li>
            <li>
              <Link href="/student-showcase">Student Showcase</Link>
            </li>
            <li>
              <Link href="/contact">Contact Support</Link>
            </li>
            <li>
              <Link href="/book-demo">Book Free Demo</Link>
            </li>
          </ul>
        </div>

        {/* Column 4: Portal Login */}
        <div className="footer-column">
          <h3>Portal Login</h3>
          <ul className="footer-links">
            <li>
              <Link href="/login">Student Login</Link>
            </li>
            <li>
              <Link href="/login">Faculty Login</Link>
            </li>
            <li>
              <Link href="/login">Parent Login</Link>
            </li>
            <li>
              <Link href="/login">Admin Login</Link>
            </li>
          </ul>
        </div>

        {/* Column 4: Contact */}
        <div className="footer-column footer-contact">
          <h3>Contact</h3>
          <p className="contact-info">
            <strong>Email:</strong> <a href="mailto:support@truelern.com">support@truelern.com</a>
          </p>
          <p className="contact-info">
            Serving families globally through live online classes.
          </p>

          <div className="footer-socials">
            <a href="https://facebook.com" className="social-icon" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
              Facebook
            </a>
            <a href="https://twitter.com" className="social-icon" target="_blank" rel="noopener noreferrer" aria-label="Twitter">
              Twitter
            </a>
            <a href="https://linkedin.com" className="social-icon" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
              LinkedIn
            </a>
            <a href="https://instagram.com" className="social-icon" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
              Instagram
            </a>
          </div>
        </div>
      </div>

      {/* Footer Bottom / Copyright */}
      <div className="footer-bottom">
        <div className="container footer-bottom-container">
          <Link href="/" className="footer-logo" aria-label="TrueLern Home">
            <img
              src="/TrueLernLogo_horizontal.png"
              alt="TrueLern"
              className="footer-brand-img"
              style={{ height: "38px", width: "auto", objectFit: "contain" }}
            />
          </Link>
          <p>&copy; {currentYear} TrueLern. All rights reserved.</p>
          <div className="footer-bottom-links">
            <Link href="/privacy-policy">Privacy Policy</Link>
            <Link href="/terms-of-use">Terms of Use</Link>
            <Link href="/refund-policy">Refund &amp; Pause Policy</Link>
            <Link href="/child-safety-policy">Child Safety Policy</Link>
            <Link href="/attendance-policy">Attendance Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
