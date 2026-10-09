import type { Metadata } from "next";
import { ProgramDetailClient } from "../../../components/public/ProgramDetailClient";

export const metadata: Metadata = {
  title: "Money Skills & Financial Literacy — Ages 8–18 | TrueLern",
  description:
    "TrueLern's Money Skills track teaches children aged 8–18 budgeting, saving, compound interest, entrepreneurial thinking and financial decision-making through live cohort sessions.",
};

const cfg = {
  badge: "🪙 Ages 8 to 18 — Skill Track",
  title: "Money Skills and Financial Literacy",
  subtitle:
    "Most schools never teach children anything meaningful about money. TrueLern directly fills this gap with practical, age-appropriate financial literacy and entrepreneurial thinking.",
  heroImage: "/img/public/money_skills_illus.png",
  heroImageAlt: "Child learning saving, budgeting and money management",
  heroBadge1: { icon: "💰", title: "Real Money Skills", sub: "Save, budget, invest" },
  heroBadge2: { icon: "🚀", title: "Entrepreneurship", sub: "Early business thinking" },
  metaStrip: ["👥 Max 5 Kids/Group", "⏱️ 50-Min Live Sessions", "📊 Parent Reports"],
  problemStatement:
    "Children grow up without understanding how to save, budget, evaluate purchases or build wealth over time. This track addresses that gap by building real financial intelligence at the age when habits are formed.",
  problemCards: [
    { icon: "💳", title: "Budgeting", desc: "Creating and maintaining budgets across income and expense categories." },
    { icon: "🏦", title: "Saving", desc: "Developing consistent saving habits and understanding delayed gratification." },
    { icon: "📈", title: "Investing", desc: "Compound interest, basic investment concepts and long-term wealth building." },
    { icon: "💡", title: "Entrepreneurship", desc: "Identifying problems, validating ideas and understanding how businesses create value." },
  ],
  problemImage: "/img/public/money_skills_illus.png",
  milestones: [
    { num: 1, title: "Money basics", desc: "Understands needs vs wants, value exchange and basic money concepts." },
    { num: 2, title: "Saving habits", desc: "Creates and follows consistent saving plans." },
    { num: 3, title: "Budget management", desc: "Tracks income and expenses across a simple budget framework." },
    { num: 4, title: "Investment awareness", desc: "Understands compound interest and basic investing principles." },
    { num: 5, title: "Entrepreneurial thinking", desc: "Identifies real problems and proposes simple business solutions." },
  ],
  goalIcon: "/img/public/money_skills_illus.png",
  goalHeading: "Financially Confident Children Become Financially Confident Adults",
  goalStatement:
    "Children who complete this track become more responsible with money at home, ask smarter questions about purchases and develop a long-term relationship with financial planning.",
  goalBullets: [
    { icon: "💰", label: "Smart Spending", desc: "Evaluating purchases critically and avoiding impulsive decisions." },
    { icon: "📈", label: "Wealth Mindset", desc: "Understanding how money grows and why starting early matters." },
    { icon: "💡", label: "Business Thinking", desc: "Spotting opportunities and understanding how value is created." },
  ],
  curriculumTitle: "36-Class Money Skills Curriculum",
  curriculumModules: [
    { week: "Weeks 1–6", title: "Money Foundations", items: ["What is money?", "Needs vs wants", "Value and exchange", "Saving basics"] },
    { week: "Weeks 7–12", title: "Budget & Tracking", items: ["Income and expenses", "Creating budgets", "Tracking spending", "Avoiding common traps"] },
    { week: "Weeks 13–18", title: "Saving Systems", items: ["The 50-30-20 rule", "Emergency funds", "Goal-based saving", "Delayed gratification"] },
    { week: "Weeks 19–24", title: "Investing Basics", items: ["Compound interest", "Stocks and bonds intro", "Why early investing matters", "Risk vs reward"] },
    { week: "Weeks 25–30", title: "Entrepreneurial Thinking", items: ["Identifying problems", "Idea validation", "Revenue models", "Simple pitch creation"] },
    { week: "Weeks 31–36", title: "Financial Plan Showcase", items: ["Personal financial plan", "Business idea presentation", "Parent showcase", "Certificate ceremony"] },
  ],
  outcomes: [
    "Creates and follows a simple personal budget",
    "Consistently saves a portion of any money received",
    "Understands how compound interest grows wealth",
    "Makes purchasing decisions with intentionality",
    "Identifies real-world problems with business potential",
    "Communicates financial decisions with reasoning",
    "Demonstrates measurable improvement in money responsibility",
    "Asks thoughtful questions about prices and value",
  ],
  faqs: [
    { question: "Is this track suitable for younger children?", answer: "Yes. For children aged 8–10, the focus is on needs vs wants, saving habits and simple budgeting using games and real scenarios. Older children explore more complex concepts." },
    { question: "Do children learn about cryptocurrency?", answer: "We focus on foundational financial literacy — saving, budgeting, investing basics and entrepreneurship. Cryptocurrency may be mentioned in context but is not a core topic." },
    { question: "How does this complement school learning?", answer: "Schools rarely teach practical financial skills. This track fills a critical gap that most children never get in formal education." },
    { question: "Will my child start a business after this?", answer: "Some do! But the primary goal is to build a healthy money mindset and entrepreneurial thinking framework that benefits any career or life path." },
    { question: "What age group does this cover?", answer: "Ages 8 to 18. Content is adapted by age group — younger children focus on basics, older children explore investing and entrepreneurship." },
  ],
  ctaHeading: "Give your child a financial head start.",
  ctaBody:
    "Book a free demo class and see how TrueLern's Money Skills track teaches children aged 8 to 18 to save, budget, invest and think like entrepreneurs.",
};

export default function MoneySkillsPage() {
  return <ProgramDetailClient cfg={cfg} pageClass="money-skills-page" />;
}
