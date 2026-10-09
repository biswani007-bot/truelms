import type { Metadata } from "next";
import { ProgramDetailClient } from "../../../components/public/ProgramDetailClient";

export const metadata: Metadata = {
  title: "Future-Ready Builders Academy — Ages 9–14 | TrueLern",
  description:
    "The Future-Ready Builders Academy develops leadership, technology literacy, project-based thinking and entrepreneurial mindset in children aged 9 to 14.",
};

const cfg = {
  badge: "🏗️ Ages 9 to 14 Program",
  title: "Future-Ready Builders Academy",
  subtitle:
    "For children aged 9 to 14 who are ready to go beyond school academics. Build leadership, AI literacy, financial intelligence and independent thinking through project-based live cohort learning.",
  heroImage: "/img/public/future_ready_illus.png",
  heroImageAlt: "Children presenting projects and solving problems confidently",
  heroBadge1: { icon: "🚀", title: "Project-Based", sub: "Real challenge scenarios" },
  heroBadge2: { icon: "🏆", title: "Leadership", sub: "Initiative & independence" },
  metaStrip: ["👥 Max 5 Kids/Group", "⏱️ 50-Min Live Sessions", "📊 Progress Reports"],
  problemStatement:
    "At ages 9 to 14, children begin forming opinions and discovering what they are good at. Without intentional guidance, this critical window for leadership, initiative and independent thinking passes undeveloped.",
  problemCards: [
    { icon: "💡", title: "Leadership", desc: "Taking initiative, guiding peers and making decisions under pressure." },
    { icon: "🤖", title: "Technology", desc: "Understanding AI tools, digital ethics and responsible technology use." },
    { icon: "💰", title: "Money Sense", desc: "Income, expenses, compound interest, budgeting and early entrepreneurial thinking." },
    { icon: "⏰", title: "Time Management", desc: "Weekly goal setting, prioritization frameworks and focus habits." },
  ],
  problemImage: "/img/public/demo_learning.png",
  milestones: [
    { num: 1, title: "Structured argumentation", desc: "Presents clear, evidence-backed opinions in debates." },
    { num: 2, title: "Financial literacy", desc: "Understands budgeting, saving and compound growth concepts." },
    { num: 3, title: "AI literacy", desc: "Uses and critically evaluates AI tools responsibly." },
    { num: 4, title: "Project leadership", desc: "Plans, executes and presents group and solo projects." },
    { num: 5, title: "Independent organization", desc: "Manages academic and personal priorities without prompting." },
  ],
  goalIcon: "/img/public/rocket_space.png",
  goalHeading: "Building Tomorrow's Leaders Today",
  goalStatement:
    "Children are noticeably more organized, more confident in expressing complex opinions and more capable of managing their time and responsibilities independently.",
  goalBullets: [
    { icon: "🚀", label: "Innovation Mindset", desc: "Identifying problems, proposing solutions and presenting to peers." },
    { icon: "💰", label: "Financial Confidence", desc: "Understanding real money decisions before adult life begins." },
    { icon: "🤖", label: "AI Readiness", desc: "Navigating AI tools with critical thinking and ethical awareness." },
  ],
  goalBgImage: "/img/public/program_goal_boy.png",
  curriculumTitle: "36-Class Future-Ready Builders Curriculum",
  curriculumModules: [
    { week: "Weeks 1–6", title: "Advanced Communication", items: ["Structured argumentation", "Persuasive speaking", "Debate techniques", "Constructive feedback"] },
    { week: "Weeks 7–12", title: "Financial Intelligence", items: ["Income and expenses", "Savings frameworks", "Compound interest basics", "Entrepreneurial thinking"] },
    { week: "Weeks 13–18", title: "AI Literacy", items: ["How AI models work", "Responsible AI use", "Prompt engineering basics", "Identifying bias in AI output"] },
    { week: "Weeks 19–24", title: "Time & Goal Mastery", items: ["Weekly planning systems", "Priority frameworks", "Focus habit building", "Overcoming procrastination"] },
    { week: "Weeks 25–30", title: "Leadership & Projects", items: ["Team project leadership", "Research & planning", "Presenting to peers", "Receiving critique"] },
    { week: "Weeks 31–36", title: "Showcase & Certification", items: ["Final independent project", "Portfolio presentation", "Certificate ceremony", "Next-level roadmap"] },
  ],
  outcomes: [
    "Constructs clear, persuasive arguments in debates",
    "Applies basic financial literacy in real-world decisions",
    "Uses AI tools responsibly and critically",
    "Manages weekly schedule independently",
    "Leads small group projects from concept to presentation",
    "Demonstrates measurable improvement in self-organization",
    "Evaluates media and information critically",
    "Communicates complex opinions with clarity and confidence",
  ],
  faqs: [
    { question: "Who is this program designed for?", answer: "Children aged 9 to 14 who are ready to move beyond basic academics and develop real-world leadership, financial and technology skills." },
    { question: "Is this program heavy on homework?", answer: "Sessions are 50 minutes of active learning. There are optional home practice challenges but no traditional homework assignments." },
    { question: "How is this different from school?", answer: "School teaches academic subjects. Future-Ready Builders focuses on leadership, financial literacy, AI readiness and practical project execution — skills that schools rarely teach." },
    { question: "What is the cohort size?", answer: "Maximum 5 children per cohort, grouped by age and skill compatibility." },
    { question: "Can a child join mid-year?", answer: "Yes. We run rolling cohort enrollment. Your child will be placed into the most appropriate cohort start point based on their assessment." },
  ],
  ctaHeading: "Give your child a head start on real-world success.",
  ctaBody:
    "Book a free demo class and see how the Future-Ready Builders Academy develops leadership, financial intelligence, AI literacy and independent thinking in children aged 9 to 14.",
};

export default function FutureReadyBuildersPage() {
  return <ProgramDetailClient cfg={cfg} pageClass="future-ready-builders-page" />;
}
