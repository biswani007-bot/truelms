"use client";

import React, { useState } from "react";

export function FAQAccordion({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  
  return (
    <div className={`fq-accordion-item glass-panel ${open ? "active" : ""}`}>
      <button 
        className="fq-accordion-question" 
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        <span>{q}</span>
        <span className="fq-accordion-arrow">{open ? "−" : "+"}</span>
      </button>
      <div 
        className="fq-accordion-answer-wrapper"
        style={{
          display: "grid",
          gridTemplateRows: open ? "1fr" : "0fr",
          transition: "grid-template-rows 0.3s ease",
        }}
      >
        <div style={{ overflow: "hidden" }}>
          <div className="fq-accordion-answer">
            <p>{a}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
