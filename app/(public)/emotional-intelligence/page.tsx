import type { Metadata } from "next";
import { ProgramDetailClient } from "../../../components/public/ProgramDetailClient";

export const metadata: Metadata = {
  title: "Emotional Intelligence — Ages 6–16 | TrueLern",
  description:
    "TrueLern's Emotional Intelligence track helps children aged 6–16 identify emotions, develop empathy, resolve conflict and build the interpersonal skills that underpin success in every area of life.",
};

const cfg = {
  badge: "💜 Ages 6 to 16 — Skill Track",
  title: "Emotional Intelligence",
  subtitle:
    "The foundation of every meaningful relationship and every act of effective leadership. Children who develop emotional intelligence perform better academically, build stronger friendships and grow into more resilient adults.",
  heroImage: "/img/public/emotional_intel_illus.png",
  heroImageAlt: "Children practicing empathy, teamwork and emotional awareness",
  heroBadge1: { icon: "💜", title: "Empathy First", sub: "Understand others" },
  heroBadge2: { icon: "🧘", title: "Self-Regulation", sub: "Calm under pressure" },
  metaStrip: ["👥 Max 5 Kids/Group", "⏱️ 50-Min Live Sessions", "📊 Parent Reports"],
  problemStatement:
    "Emotional intelligence is not a soft skill — it is the foundation of every meaningful relationship, collaboration and leadership act. Yet most schools never teach children to identify, understand or regulate their emotions effectively.",
  problemCards: [
    { icon: "💜", title: "Empathy", desc: "Understanding and genuinely caring about others' feelings and perspectives." },
    { icon: "🧠", title: "Self-Awareness", desc: "Accurately identifying and naming one's own emotional states." },
    { icon: "🤝", title: "Conflict Resolution", desc: "Handling disagreement without aggression or withdrawal." },
    { icon: "👥", title: "Teamwork", desc: "Collaborating with peers who think and feel differently." },
  ],
  problemImage: "/img/public/emotional_intel_illus.png",
  milestones: [
    { num: 1, title: "Emotional vocabulary", desc: "Accurately names and describes their emotional states." },
    { num: 2, title: "Emotion-behavior link", desc: "Understands how emotions affect thinking and decisions." },
    { num: 3, title: "Empathy development", desc: "Genuinely considers others' perspectives before reacting." },
    { num: 4, title: "Conflict repair", desc: "Handles and resolves conflicts without aggression or withdrawal." },
    { num: 5, title: "Boundary communication", desc: "Expresses needs and limits clearly and respectfully." },
  ],
  goalIcon: "/img/public/emotional_intel_illus.png",
  goalHeading: "Emotionally Intelligent Leaders",
  goalStatement:
    "Children who complete this track become calmer under pressure, more capable of repairing relationships after conflict and more likely to lead with understanding rather than authority.",
  goalBullets: [
    { icon: "💜", label: "Emotional Depth", desc: "Moving from 'I'm fine' to accurately naming complex emotional states." },
    { icon: "🤝", label: "Relationship Repair", desc: "Knowing how to restore trust and connection after conflict." },
    { icon: "🧘", label: "Regulation Skills", desc: "Pausing before reacting and choosing a constructive response." },
  ],
  curriculumTitle: "36-Class Emotional Intelligence Curriculum",
  curriculumModules: [
    { week: "Weeks 1–6", title: "Emotional Vocabulary", items: ["Naming emotions precisely", "The emotion wheel", "Body signals of emotion", "Emotion journaling"] },
    { week: "Weeks 7–12", title: "Self-Awareness", items: ["Triggers and patterns", "Emotion-thought connection", "Self-monitoring techniques", "Strengths inventory"] },
    { week: "Weeks 13–18", title: "Empathy Building", items: ["Perspective-taking exercises", "Active listening", "Compassion vs sympathy", "Peer storytelling"] },
    { week: "Weeks 19–24", title: "Regulation Skills", items: ["Pause and reflect strategies", "Managing anger", "Handling anxiety", "Calming toolbox"] },
    { week: "Weeks 25–30", title: "Conflict & Communication", items: ["Conflict without aggression", "I-statements", "Apology and repair", "Boundary setting"] },
    { week: "Weeks 31–36", title: "Leadership & Showcase", items: ["Emotionally intelligent leadership", "Group challenge final project", "Parent showcase", "Certificate ceremony"] },
  ],
  outcomes: [
    "Accurately identifies and names own emotional states",
    "Recognizes how emotions affect decisions and behavior",
    "Demonstrates genuine empathy in peer interactions",
    "Handles conflict without aggression or withdrawal",
    "Communicates needs and limits clearly",
    "Regulates emotional reactions in stressful situations",
    "Repairs relationships after disagreements",
    "Shows increased patience and composure in group settings",
  ],
  faqs: [
    { question: "Is this track suitable for young children?", answer: "Yes. For children aged 6–9, content focuses on basic emotion identification, empathy and simple regulation tools. Older children explore more complex interpersonal dynamics." },
    { question: "My child has anger issues. Can this help?", answer: "Yes. Managing anger and frustration is a core component of this track. Our coaches are trained to work with children who struggle with emotional regulation." },
    { question: "How is EI different from therapy?", answer: "This is a skill-building program, not therapy. We teach practical emotional intelligence skills in a structured group learning environment. For clinical issues, please consult a mental health professional." },
    { question: "Will my child open up in a group?", answer: "Our coaches create a safe, non-judgmental environment. Many initially reserved children become the most expressive participants by Week 6." },
    { question: "Can I see what my child is learning?", answer: "Yes. Parents receive monthly progress reports with specific observations and home practice suggestions from the coach." },
  ],
  ctaHeading: "Build the skill that changes everything.",
  ctaBody:
    "Book a free demo class and see how TrueLern's Emotional Intelligence track helps children aged 6 to 16 develop the empathy, self-awareness and regulation skills that make them exceptional in every relationship.",
};

export default function EmotionalIntelligencePage() {
  return <ProgramDetailClient cfg={cfg} pageClass="emotional-intelligence-page" />;
}
