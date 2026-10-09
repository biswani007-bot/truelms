"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

export const FloatingActions = () => {
  const [visible, setVisible] = useState(false);
  const [tooltips, setTooltips] = useState<{ whatsapp: boolean; call: boolean; demo: boolean }>({
    whatsapp: false,
    call: false,
    demo: false,
  });

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 1200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className={`floating-actions-stack${visible ? ' fab-visible' : ''}`} aria-label="Quick contact options">
      {/* WhatsApp */}
      <div className="fab-item-wrapper"
        onMouseEnter={() => setTooltips(t => ({ ...t, whatsapp: true }))}
        onMouseLeave={() => setTooltips(t => ({ ...t, whatsapp: false }))}>
        {tooltips.whatsapp && <span className="fab-tooltip">Chat on WhatsApp</span>}
        <a
          href="https://wa.me/15551234567?text=Hello%20TrueLern!%20I%27d%20like%20to%20learn%20more."
          target="_blank"
          rel="noopener noreferrer"
          className="fab-btn fab-whatsapp"
          aria-label="Chat on WhatsApp"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
          </svg>
        </a>
      </div>

      {/* Call */}
      <div className="fab-item-wrapper"
        onMouseEnter={() => setTooltips(t => ({ ...t, call: true }))}
        onMouseLeave={() => setTooltips(t => ({ ...t, call: false }))}>
        {tooltips.call && <span className="fab-tooltip">Call Us</span>}
        <a
          href="tel:+15551234567"
          className="fab-btn fab-call"
          aria-label="Call TrueLern"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 14a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 3.18h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 10a16 16 0 0 0 6 6l.85-.85a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 17.42z" />
          </svg>
        </a>
      </div>

      {/* Book Demo */}
      <div className="fab-item-wrapper"
        onMouseEnter={() => setTooltips(t => ({ ...t, demo: true }))}
        onMouseLeave={() => setTooltips(t => ({ ...t, demo: false }))}>
        {tooltips.demo && <span className="fab-tooltip">Book Free Demo</span>}
        <Link
          href="/book-demo"
          className="fab-btn fab-demo"
          aria-label="Book a free demo class"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
            <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01" />
          </svg>
        </Link>
      </div>
    </div>
  );
};
