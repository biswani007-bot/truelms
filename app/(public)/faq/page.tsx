import React from "react";
import { FAQClient } from "./FAQClient";

export const metadata = {
  title: "FAQs | TrueLern",
  description: "Find answers to common questions about TrueLern programs, classes, pricing, demos, coaches and parent progress updates.",
};

export default function FAQPage() {
  const defaultFAQs = [
    {
      question: "What is truelern.com?",
      answer: "truelern.com is a live online academy that helps children build practical skills beyond school, including confidence, communication, emotional intelligence, money skills, AI readiness, time management and real-world thinking."
    },
    {
      question: "Is truelern.com a tutoring platform?",
      answer: "No. truelern.com is not academic tutoring. It is a practical development academy for skills that support confidence, independence and future-readiness."
    },
    {
      question: "What age groups do you teach?",
      answer: "truelern.com focuses on two main age groups: 6 to 10 and 9 to 14. Placement depends on the child's age, maturity, confidence level and parent goals."
    },
    {
      question: "How many classes are in a level?",
      answer: "Each core level is designed around a structured 36-class learning block. After completing one level, students can move into the next level for continued development."
    },
    {
      question: "Is this a short course?",
      answer: "No. truelern.com is designed for long-term development. A child can continue through multiple levels over one to two years or more."
    },
    {
      question: "How many classes are held per week?",
      answer: "The standard model is two live classes per week, usually on weekends. Some programs may offer two to three classes per week depending on batch and schedule."
    },
    {
      question: "Are classes live or recorded?",
      answer: "Core classes are live because children need practice, interaction and feedback. Recorded resources may be added later as support material."
    },
    {
      question: "How do parents see progress?",
      answer: "Parents receive progress updates, teacher feedback, milestone summaries and child activity outcomes. truelern.com is built around parent-visible progress."
    },
    {
      question: "Do you teach AI coding?",
      answer: "truelern.com's AI Readiness program is not a coding course. It teaches children how to understand AI, ask better questions, verify answers, use tools responsibly and build human judgment."
    },
    {
      question: "Do you teach financial literacy?",
      answer: "Yes. truelern.com teaches money skills such as needs vs wants, saving, smart spending, budgeting, digital money, scams, earning through skills and responsible financial thinking."
    },
    {
      question: "How do I start?",
      answer: "Book a free demo class. After the demo, the truelern.com team will recommend the right program and level for your child."
    }
  ];

  return <FAQClient faqs={defaultFAQs} />;
}
