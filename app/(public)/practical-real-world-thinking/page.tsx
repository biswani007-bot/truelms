import type { Metadata } from "next";
import { ProgramDetailClient } from "../../../components/public/ProgramDetailClient";

export const metadata: Metadata = {
  title: "Practical Real-World Thinking — Ages 8–18 | TrueLern",
  description:
    "TrueLern's Practical Thinking track teaches children aged 8–18 critical thinking, logical reasoning, problem-solving and sound decision-making across real-world scenarios.",
};

const cfg = {
  badge: "🧩 Ages 8 to 18 — Skill Track",
  title: "Practical Real-World Thinking",
  subtitle:
    "Most children are taught what to think, not how to think. This track develops the ability to reason clearly, analyze situations logically and make sound decisions across academic challenges, social situations and everyday life.",
  heroImage: "/img/public/practical_thinking_illus.png",
  heroImageAlt: "Children problem-solving practical real-world scenarios",
  heroBadge1: { icon: "🧩", title: "Critical Thinking", sub: "Think, don't just react" },
  heroBadge2: { icon: "💡", title: "Problem Solving", sub: "Real scenario practice" },
  metaStrip: ["👥 Max 5 Kids/Group", "⏱️ 50-Min Live Sessions", "📊 Parent Reports"],
  problemStatement:
    "Children are taught facts and formulas, but rarely taught how to think critically, evaluate information, solve novel problems or make decisions under uncertainty. This track fills that gap directly.",
  problemCards: [
    { icon: "🔍", title: "Critical Thinking", desc: "Evaluating claims, identifying assumptions and reasoning from evidence." },
    { icon: "🧩", title: "Problem Solving", desc: "Breaking complex problems into manageable steps and evaluating solutions." },
    { icon: "⚖️", title: "Decision Making", desc: "Making sound decisions with incomplete information under time pressure." },
    { icon: "🔗", title: "Logical Reasoning", desc: "Identifying patterns, causes and consequences in real-world situations." },
  ],
  problemImage: "/img/public/practical_thinking_illus.png",
  milestones: [
    { num: 1, title: "Assumption identification", desc: "Spots hidden assumptions in arguments and everyday claims." },
    { num: 2, title: "Evidence evaluation", desc: "Distinguishes strong evidence from weak or biased sources." },
    { num: 3, title: "Problem decomposition", desc: "Breaks complex problems into clear, manageable components." },
    { num: 4, title: "Decision frameworks", desc: "Uses structured approaches to make decisions under uncertainty." },
    { num: 5, title: "Consequence thinking", desc: "Traces first, second and third-order effects of decisions." },
  ],
  goalIcon: "/img/public/practical_thinking_illus.png",
  goalHeading: "Thinkers Who Thrive in the Real World",
  goalStatement:
    "Children who complete this track approach challenges with curiosity rather than frustration, make better decisions in social and academic situations and develop a lifelong habit of thinking before acting.",
  goalBullets: [
    { icon: "🔍", label: "Evidence-Based Reasoning", desc: "Making arguments from facts rather than feelings or assumptions." },
    { icon: "🧩", label: "Structured Problem Solving", desc: "Decomposing challenges and evaluating multiple solution paths." },
    { icon: "⚖️", label: "Decision Clarity", desc: "Making confident decisions even with imperfect information." },
  ],
  curriculumTitle: "36-Class Practical Thinking Curriculum",
  curriculumModules: [
    { week: "Weeks 1–6", title: "Thinking Foundations", items: ["What is critical thinking?", "Identifying assumptions", "Fact vs opinion", "Observation vs inference"] },
    { week: "Weeks 7–12", title: "Evidence & Logic", items: ["Types of evidence", "Evaluating sources", "Logical fallacies", "Cause and effect"] },
    { week: "Weeks 13–18", title: "Problem Solving", items: ["Problem decomposition", "Root cause analysis", "Brainstorming techniques", "Evaluating solutions"] },
    { week: "Weeks 19–24", title: "Decision Making", items: ["Decision frameworks", "Risk and uncertainty", "Second-order thinking", "Learning from mistakes"] },
    { week: "Weeks 25–30", title: "Real Scenarios", items: ["Social dilemmas", "Academic challenges", "Ethical scenarios", "Current events analysis"] },
    { week: "Weeks 31–36", title: "Showcase Project", items: ["Real-world problem project", "Peer presentation", "Parent showcase", "Certificate ceremony"] },
  ],
  outcomes: [
    "Evaluates claims using evidence rather than emotion",
    "Identifies hidden assumptions in everyday situations",
    "Breaks complex problems into manageable steps",
    "Makes decisions using structured frameworks",
    "Thinks through consequences before acting",
    "Distinguishes reliable from unreliable information sources",
    "Approaches challenges with curiosity rather than frustration",
    "Demonstrates measurably improved reasoning in academic work",
  ],
  faqs: [
    { question: "Is this a philosophy or logic course?", answer: "It draws from both, but is entirely practical. Every concept is taught through real-world scenarios, not abstract theory." },
    { question: "Will this help with school performance?", answer: "Yes. Critical thinking and problem-solving directly improve academic performance, essay writing, exam preparation and class participation." },
    { question: "What age range is this for?", answer: "Ages 8 to 18. Content adapts by age — younger children work with concrete scenarios; older students engage with more abstract reasoning challenges." },
    { question: "My child tends to be impulsive. Will this help?", answer: "Yes. Decision-making under uncertainty and consequence thinking are core components specifically designed to help impulsive thinkers slow down and reason more carefully." },
    { question: "Can this run alongside other TrueLern tracks?", answer: "Yes. Many parents enroll children in this track alongside Communication or Money Skills for a well-rounded life-skills foundation." },
  ],
  ctaHeading: "Raise a child who thinks before acting.",
  ctaBody:
    "Book a free demo class and see how TrueLern's Practical Thinking track teaches children aged 8 to 18 to reason clearly, solve problems and make sound decisions.",
};

export default function PracticalThinkingPage() {
  return <ProgramDetailClient cfg={cfg} pageClass="practical-thinking-page" />;
}
