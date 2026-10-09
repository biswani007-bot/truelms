import type { Metadata } from "next";
import { ProgramDetailClient } from "../../../components/public/ProgramDetailClient";

export const metadata: Metadata = {
  title: "AI Readiness — Ages 8–18 | TrueLern",
  description:
    "TrueLern's AI Readiness track helps children aged 8–18 understand artificial intelligence, use it responsibly, and think critically about technology in an AI-driven world.",
};

const cfg = {
  badge: "🤖 Ages 8 to 18 — Skill Track",
  title: "AI Readiness",
  subtitle:
    "Artificial intelligence is already reshaping every area of life. Children who grow up understanding AI, using it thoughtfully and thinking critically about its limitations will have a decisive advantage in education, work and citizenship.",
  heroImage: "/img/public/ai_readiness_illus.png",
  heroImageAlt: "Friendly AI robot helping children explore technology responsibly",
  heroBadge1: { icon: "🤖", title: "AI Literacy", sub: "Not just coding" },
  heroBadge2: { icon: "🧠", title: "Critical Thinking", sub: "Question AI outputs" },
  metaStrip: ["👥 Max 5 Kids/Group", "⏱️ 50-Min Live Sessions", "📊 Parent Reports"],
  problemStatement:
    "Most children use AI tools daily without understanding how they work, where they fail, or how to use them ethically. AI literacy — the ability to understand, use and critique artificial intelligence responsibly — is the skill of the decade.",
  problemCards: [
    { icon: "🤖", title: "AI Tools", desc: "Hands-on experience with age-appropriate AI tools for learning, creativity and problem-solving." },
    { icon: "💬", title: "Prompt Engineering", desc: "Crafting clear, specific prompts that generate high-quality, useful AI outputs." },
    { icon: "🧠", title: "Critical Thinking", desc: "Identifying bias, hallucinations and limitations in AI-generated content." },
    { icon: "⚖️", title: "Digital Ethics", desc: "Understanding copyright, privacy, safety and responsible AI use." },
  ],
  problemImage: "/img/public/ai_readiness_illus.png",
  milestones: [
    { num: 1, title: "AI fundamentals", desc: "Understands how AI models are trained and what they can and cannot do." },
    { num: 2, title: "Prompt mastery", desc: "Crafts precise prompts that produce reliable, high-quality outputs." },
    { num: 3, title: "Critical evaluation", desc: "Identifies AI bias, errors and hallucinations in real examples." },
    { num: 4, title: "Creative application", desc: "Uses AI tools to enhance learning, writing and creative projects." },
    { num: 5, title: "Ethical reasoning", desc: "Applies ethical frameworks to AI-related decisions and behaviors." },
  ],
  goalIcon: "/img/public/robot_ai.png",
  goalHeading: "AI-Literate Children Ready for the Future",
  goalStatement:
    "Children who complete this track become more discerning consumers of technology, more confident users of digital tools and more thoughtful citizens of an AI-driven world.",
  goalBullets: [
    { icon: "🤖", label: "AI Understanding", desc: "Knowing how AI works demystifies it and removes fear." },
    { icon: "💬", label: "Prompt Mastery", desc: "Better prompts produce better results in every AI application." },
    { icon: "⚖️", label: "Ethical Grounding", desc: "AI ethics is a lifelong skill increasingly required in every profession." },
  ],
  curriculumTitle: "36-Class AI Readiness Curriculum",
  curriculumModules: [
    { week: "Weeks 1–6", title: "What Is AI?", items: ["How AI models learn", "Types of AI", "AI vs human intelligence", "Real-world AI examples"] },
    { week: "Weeks 7–12", title: "Prompt Engineering", items: ["Anatomy of a prompt", "Specific vs vague requests", "Iterating prompts", "Prompt templates"] },
    { week: "Weeks 13–18", title: "AI for Learning", items: ["Using AI for research", "Verifying AI outputs", "AI writing assistants", "AI and creativity"] },
    { week: "Weeks 19–24", title: "Critical Evaluation", items: ["Spotting AI hallucinations", "Identifying bias", "Fact-checking AI content", "Media literacy"] },
    { week: "Weeks 25–30", title: "Ethics & Safety", items: ["Copyright and attribution", "Privacy in the age of AI", "AI safety principles", "Responsible use pledges"] },
    { week: "Weeks 31–36", title: "Project & Showcase", items: ["AI project creation", "Ethical justification", "Parent showcase", "Certificate ceremony"] },
  ],
  outcomes: [
    "Explains how AI models are trained in simple terms",
    "Creates effective prompts for reliable AI outputs",
    "Identifies bias and errors in AI-generated content",
    "Uses AI tools to enhance learning and creativity",
    "Makes ethical decisions about AI use",
    "Understands privacy implications of digital tools",
    "Evaluates media with AI-literacy awareness",
    "Thinks critically before accepting any AI-generated output",
  ],
  faqs: [
    { question: "Is this a coding or programming course?", answer: "No. This track is about AI literacy — understanding, using and critiquing AI. It is not about programming or building AI models." },
    { question: "What AI tools do children use?", answer: "We use age-appropriate, school-safe AI tools including text generation assistants, image creation tools and research aids. All tool use is supervised and guided." },
    { question: "Is this suitable for children who are not tech-savvy?", answer: "Absolutely. We start from the very basics. No technical background is required." },
    { question: "How does this prepare children for the future?", answer: "AI literacy is increasingly required in every career and civic context. Children who understand AI will navigate the future with confidence; those who don't will be at a disadvantage." },
    { question: "What is the age range?", answer: "Ages 8 to 18. Content is adapted by age — younger children explore AI concepts through games and stories; older students engage in prompt engineering and ethics debates." },
  ],
  ctaHeading: "Prepare your child for an AI-driven world.",
  ctaBody:
    "Book a free demo class and see how TrueLern's AI Readiness track helps children aged 8 to 18 understand, use and think critically about artificial intelligence.",
};

export default function AIReadinessPage() {
  return <ProgramDetailClient cfg={cfg} pageClass="ai-readiness-page" />;
}
