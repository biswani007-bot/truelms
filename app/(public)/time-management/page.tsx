import type { Metadata } from "next";
import { ProgramDetailClient } from "../../../components/public/ProgramDetailClient";

export const metadata: Metadata = {
  title: "Time Management & Habits — Ages 8–18 | TrueLern",
  description:
    "TrueLern's Time Management & Habits track teaches children aged 8–18 practical time management systems, habit formation and how to organize school, personal and family responsibilities.",
};

const cfg = {
  badge: "⏰ Ages 8 to 18 — Skill Track",
  title: "Time Management and Habits",
  subtitle:
    "Children who manage their time well are calmer, more organized and less overwhelmed. This track teaches practical systems for goal-setting, scheduling, focus and habit formation that children actually use.",
  heroImage: "/img/public/time_mgmt_illus.png",
  heroImageAlt: "Child organizing schedule, goals and daily habits",
  heroBadge1: { icon: "⏰", title: "Real Systems", sub: "Not just tips" },
  heroBadge2: { icon: "🎯", title: "Goal Mastery", sub: "Weekly planning habits" },
  metaStrip: ["👥 Max 5 Kids/Group", "⏱️ 50-Min Live Sessions", "📊 Parent Reports"],
  problemStatement:
    "Most children feel overwhelmed because they have never been taught how to manage their time intentionally. This track gives children practical frameworks for organizing every area of their life — school, family, hobbies and personal goals.",
  problemCards: [
    { icon: "🎯", title: "Goal Setting", desc: "Converting ambitions into concrete, measurable weekly and monthly goals." },
    { icon: "📅", title: "Scheduling", desc: "Creating realistic weekly schedules that balance school, activities and rest." },
    { icon: "🧠", title: "Focus & Deep Work", desc: "Techniques for sustained focus and eliminating distraction." },
    { icon: "⚡", title: "Habit Formation", desc: "Building small daily habits that compound into long-term excellence." },
  ],
  problemImage: "/img/public/time_mgmt_illus.png",
  milestones: [
    { num: 1, title: "Goal clarity", desc: "Sets specific, measurable goals for the week and tracks progress." },
    { num: 2, title: "Weekly scheduling", desc: "Creates and follows a realistic weekly plan independently." },
    { num: 3, title: "Priority management", desc: "Distinguishes urgent from important and acts accordingly." },
    { num: 4, title: "Focus improvement", desc: "Sustains attention on tasks for increasingly longer periods." },
    { num: 5, title: "Habit consistency", desc: "Maintains key daily habits without external reminders." },
  ],
  goalIcon: "/img/public/time_mgmt_illus.png",
  goalHeading: "From Overwhelmed to Organized",
  goalStatement:
    "Children who complete this track manage their school responsibilities independently, maintain consistent daily habits and feel noticeably less stressed about deadlines and commitments.",
  goalBullets: [
    { icon: "🎯", label: "Goal Architecture", desc: "Breaking big ambitions into daily executable steps." },
    { icon: "⚡", label: "Habit Stacking", desc: "Attaching new habits to existing ones for effortless consistency." },
    { icon: "🧠", label: "Focus Training", desc: "Building the ability to resist distraction and do deep work." },
  ],
  curriculumTitle: "36-Class Time Management & Habits Curriculum",
  curriculumModules: [
    { week: "Weeks 1–6", title: "Goal Setting", items: ["SMART goals framework", "Weekly goal setting", "Tracking progress", "Celebrating wins"] },
    { week: "Weeks 7–12", title: "Scheduling Systems", items: ["Time blocking", "Weekly review process", "Realistic time estimation", "Buffer planning"] },
    { week: "Weeks 13–18", title: "Priority & Decision", items: ["Urgency vs importance", "The Eisenhower matrix", "Saying no strategically", "Energy management"] },
    { week: "Weeks 19–24", title: "Focus & Deep Work", items: ["Distraction audit", "The Pomodoro method", "Phone and screen boundaries", "Focus rituals"] },
    { week: "Weeks 25–30", title: "Habit Building", items: ["Keystone habits", "Habit stacking", "Implementation intentions", "Identity-based habits"] },
    { week: "Weeks 31–36", title: "Personal System Showcase", items: ["Personal productivity system", "Progress portfolio", "Parent showcase", "Certificate ceremony"] },
  ],
  outcomes: [
    "Creates and follows a weekly schedule independently",
    "Sets specific, measurable weekly goals and tracks them",
    "Prioritizes tasks by importance rather than urgency",
    "Maintains focus for sustained work periods",
    "Builds and maintains key daily habits without reminders",
    "Manages homework and activities without parental nagging",
    "Reduces stress through proactive planning",
    "Demonstrates measurable improvement in academic organization",
  ],
  faqs: [
    { question: "My child is very disorganized. Is this appropriate?", answer: "Yes — this track is specifically designed for children who struggle with organization and time management. We start from the basics and build gradually." },
    { question: "What is the age range?", answer: "Ages 8 to 18. Content adapts by age — younger children work with simple goal-setting games; older students use professional-grade planning frameworks." },
    { question: "Will my child actually use these systems at home?", answer: "Our systems are designed to be simple enough to use without parental help. Parents report seeing immediate improvements in independence and organization." },
    { question: "How long before we see results?", answer: "Most parents see noticeable changes in routine and habit formation within the first 8–10 sessions." },
    { question: "Is this about study skills?", answer: "Time management is broader than study skills. This track covers every area of a child's life — school, hobbies, relationships and personal growth." },
  ],
  ctaHeading: "Help your child take control of their time.",
  ctaBody:
    "Book a free demo class and see how TrueLern's Time Management & Habits track teaches children aged 8 to 18 to organize their life, set goals and build habits that last.",
};

export default function TimeManagementPage() {
  return <ProgramDetailClient cfg={cfg} pageClass="time-management-page" />;
}
