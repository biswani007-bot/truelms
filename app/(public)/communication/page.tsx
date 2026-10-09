import type { Metadata } from "next";
import { ProgramDetailClient } from "../../../components/public/ProgramDetailClient";

export const metadata: Metadata = {
  title: "Communication, Confidence & Public Speaking — Ages 8–18 | TrueLern",
  description:
    "TrueLern's Communication & Confidence track teaches children aged 8–18 structured speaking, debate, body language, and public speaking skills through live cohort sessions.",
};

const cfg = {
  badge: "🗣️ Ages 8 to 18 — Skill Track",
  title: "Communication, Confidence and Public Speaking",
  subtitle:
    "One of the most requested programs worldwide. Children learn to communicate clearly, confidently and respectfully — and develop speaking skills that give them an advantage in every area of life.",
  heroImage: "/img/public/communication_illus.png",
  heroImageAlt: "Child speaking confidently on stage in front of an audience",
  heroBadge1: { icon: "🎤", title: "Public Speaking", sub: "Real presentation practice" },
  heroBadge2: { icon: "🏆", title: "Stage Confidence", sub: "Zero fear of speaking" },
  metaStrip: ["👥 Max 5 Kids/Group", "⏱️ 50-Min Live Sessions", "📊 Parent Reports"],
  problemStatement:
    "Most children are not taught how to communicate clearly. They grow up unable to express ideas without stumbling, avoid presentations, and freeze in social situations. This track directly addresses that gap from age 8 onward.",
  problemCards: [
    { icon: "🎤", title: "Public Speaking", desc: "Structured techniques for confident presentations and speeches at any scale." },
    { icon: "⚡", title: "Speaking Anxiety", desc: "Psychology of stage fright — understanding and managing anxiety." },
    { icon: "💬", title: "Debate Skills", desc: "Evidence-based argumentation, rebuttal and respectful disagreement." },
    { icon: "👁️", title: "Body Language", desc: "Eye contact, posture, voice modulation and physical presence." },
  ],
  problemImage: "/img/public/communication_illus.png",
  milestones: [
    { num: 1, title: "Clear articulation", desc: "Speaks at correct pace and volume without filler words." },
    { num: 2, title: "Structured presentation", desc: "Opens, organizes and closes speeches with intention." },
    { num: 3, title: "Physical confidence", desc: "Eye contact, posture and gestures support the message." },
    { num: 4, title: "Debate readiness", desc: "Presents evidence-backed arguments and handles objections." },
    { num: 5, title: "Social confidence", desc: "Participates actively in groups, panels and interviews." },
  ],
  goalIcon: "/img/public/communication_illus.png",
  goalHeading: "A Voice That Commands Attention",
  goalStatement:
    "Children who complete this track report significantly reduced fear of public speaking, higher academic participation and greater social confidence.",
  goalBullets: [
    { icon: "🎤", label: "Speech Mastery", desc: "Opening, body and close — every speech is structured intentionally." },
    { icon: "💬", label: "Debate & Dialogue", desc: "Presenting and defending ideas while respecting opposing views." },
    { icon: "🧠", label: "Anxiety Management", desc: "Understanding the psychology of speaking anxiety and overcoming it." },
  ],
  curriculumTitle: "36-Class Communication & Confidence Curriculum",
  curriculumModules: [
    { week: "Weeks 1–6", title: "Voice & Foundation", items: ["Pace and volume control", "Filler word elimination", "Eye contact practice", "Breathing techniques"] },
    { week: "Weeks 7–12", title: "Speech Structure", items: ["Opening techniques", "Point organization", "Transitions and closings", "Mini-speech practice"] },
    { week: "Weeks 13–18", title: "Body Language", items: ["Posture and presence", "Purposeful gestures", "Facial expression", "Stage movement"] },
    { week: "Weeks 19–24", title: "Debate & Argumentation", items: ["Claim and evidence", "Rebuttal techniques", "Respectful disagreement", "Q&A handling"] },
    { week: "Weeks 25–30", title: "Real-World Scenarios", items: ["Job interview simulation", "Group presentation", "Storytelling competition", "Panel discussion"] },
    { week: "Weeks 31–36", title: "Showcase & Certification", items: ["Final speech project", "Live audience presentation", "Peer evaluation", "Certificate ceremony"] },
  ],
  outcomes: [
    "Delivers structured speeches without notes",
    "Maintains comfortable eye contact throughout presentations",
    "Uses voice modulation to emphasize key points",
    "Participates actively in group discussions",
    "Handles unexpected questions with composure",
    "Demonstrates measurably reduced speaking anxiety",
    "Presents arguments with evidence and logic",
    "Commands attention and respect in social settings",
  ],
  faqs: [
    { question: "What age range does this track cover?", answer: "This track is available for children from age 8 to 18. Content is adapted based on age group." },
    { question: "Can this be taken alongside another program?", answer: "Yes. This track runs alongside any of our Academy programs or can be enrolled in as a standalone skill module." },
    { question: "My child freezes when speaking in public. Will this help?", answer: "Absolutely. Managing speaking anxiety is one of the core components of this track. Our coaches are trained specifically to work with shy and anxious speakers." },
    { question: "How quickly will I see results?", answer: "Most parents report noticeable improvements in confidence within the first 6–8 sessions. Full skill integration typically takes the full 36-class block." },
    { question: "Is debate part of the curriculum?", answer: "Yes. Structured argumentation, rebuttal and debate are taught from Week 13 onward, adapted to the child's age and ability level." },
  ],
  ctaHeading: "Help your child find their voice.",
  ctaBody:
    "Book a free demo class and see how TrueLern's Communication & Confidence track helps children aged 8 to 18 develop a voice that commands attention in every room they enter.",
};

export default function CommunicationPage() {
  return <ProgramDetailClient cfg={cfg} pageClass="communication-confidence-page" />;
}
