import type { Metadata } from "next";
import { ProgramDetailClient } from "../../../components/public/ProgramDetailClient";

export const metadata: Metadata = {
  title: "Junior Foundation Academy — Ages 6–10 | TrueLern",
  description:
    "The Junior Foundation Academy builds communication, confidence, emotional awareness and social skills in children aged 6 to 10 through live cohort sessions of maximum 5 children.",
};

const cfg = {
  badge: "🌈 Ages 6 to 10 Program",
  title: "Junior Foundation Academy",
  subtitle:
    "A structured live online program for children aged 6 to 10. The program helps children build practical skills through guided classes, activities, practice, feedback and parent-visible progress.",
  heroImage: "/img/public/junior-foundation-hero.png",
  heroImageAlt: "Children learning together in Junior Foundation Academy",
  heroBadge1: { icon: "⭐", title: "Live Storytelling", sub: "Interactive peer feedback" },
  heroBadge2: { icon: "🏆", title: "Confidence Booster", sub: "Speaking without fear" },
  metaStrip: ["👥 Max 5 Kids/Group", "⏱️ 45-Min Live Sessions", "📊 Progress Reports"],
  problemStatement:
    "Many children are bright, but they do not always know how to express themselves, manage themselves or make practical decisions. Junior Foundation Academy gives children guided practice in the skills that are difficult to build through schoolwork alone.",
  problemCards: [
    { icon: "✨", title: "Confidence", desc: "Building positive body language, projecting voice, and presenting ideas to others." },
    { icon: "🗣️", title: "Communication", desc: "Expressing thoughts clearly, listening actively, and sharing stories structured step-by-step." },
    { icon: "👥", title: "Social Skills", desc: "Collaborating, sharing, emotional empathy, and turn-taking in small group cohorts." },
    { icon: "🔍", title: "Practical Thinking", desc: "Making everyday logic decisions, managing pocket money, and organizing daily routines." },
  ],
  problemImage: "/img/public/demo_learning.png",
  milestones: [
    { num: 1, title: "Expressive foundation", desc: "Introduces self and projects voice cleanly." },
    { num: 2, title: "Comfortable communication", desc: "Shares thoughts and questions with confidence." },
    { num: 3, title: "Emotionally aware", desc: "Identifies feelings and regulates emotions." },
    { num: 4, title: "Socially confident", desc: "Active listening, team collaboration, and peer empathy." },
    { num: 5, title: "Ready for structured learning", desc: "Follows class routines and presents mini-projects." },
  ],
  goalIcon: "/img/public/robot_ai.png",
  goalHeading: "Empowered for Future Success",
  goalStatement:
    "The child should become more expressive, comfortable, emotionally aware, socially confident and ready for structured learning.",
  goalBullets: [
    { icon: "🌱", label: "Foundation Building", desc: "Moving from hesitant answers to structured speech patterns." },
    { icon: "💜", label: "Self-Regulation", desc: "Recognizing emotions before reacting to daily challenges." },
    { icon: "🤝", label: "Peer Collaboration", desc: "Social feedback loops via safe cohort groups." },
  ],
  goalBgImage: "/img/public/program_goal_boy.png",
  curriculumTitle: "36-Class Junior Foundation Curriculum",
  curriculumModules: [
    { week: "Weeks 1–6", title: "Voice & Presence", items: ["Self-introduction techniques", "Body language basics", "Speaking volume control", "Story starters"] },
    { week: "Weeks 7–12", title: "Listening & Empathy", items: ["Active listening exercises", "Emotion identification", "Turn-taking practice", "Peer storytelling"] },
    { week: "Weeks 13–18", title: "Social Communication", items: ["Group discussion rules", "Respectful disagreement", "Collaborative play", "Peer feedback"] },
    { week: "Weeks 19–24", title: "Practical Thinking", items: ["Needs vs wants", "Money basics", "Simple decision-making", "Goal setting"] },
    { week: "Weeks 25–30", title: "Confidence Building", items: ["Mini-presentations", "Show and tell", "Debate games", "Public speaking anxiety"] },
    { week: "Weeks 31–36", title: "Showcase & Celebration", items: ["Final project", "Portfolio review", "Parent showcase", "Certificate ceremony"] },
  ],
  outcomes: [
    "Speaks clearly and confidently in front of peers",
    "Listens actively and takes turns in conversations",
    "Identifies and names their own emotions accurately",
    "Makes simple decisions using logic and values",
    "Collaborates respectfully in small group settings",
    "Presents simple stories and projects with confidence",
    "Manages frustration and disappointment constructively",
    "Demonstrates improved social confidence at home and school",
  ],
  faqs: [
    { question: "What age group is the Junior Foundation Academy for?", answer: "The Junior Foundation Academy is designed for children aged 6 to 10. Children are grouped with peers of the same age range." },
    { question: "How long is each session?", answer: "Each session is 45 minutes long, conducted live online. This is the optimal attention span for children in this age group." },
    { question: "How many children are in each group?", answer: "A maximum of 5 children per cohort. This ensures every child receives individual attention and meaningful participation time." },
    { question: "How do I see my child's progress?", answer: "Parents receive a detailed monthly progress report including video clips, activity records and coach observations. Weekly micro-updates are also sent." },
    { question: "What if my child is very shy?", answer: "Our coaches are specifically trained to work with shy and introverted children. The first few sessions are designed to make every child feel safe and comfortable." },
    { question: "Can we try before committing?", answer: "Yes. We offer a free demo class where your child participates in a live session. There is no obligation to enroll." },
  ],
  ctaHeading: "Start your child's Junior Foundation journey.",
  ctaBody:
    "Book a free demo class and see how we help children aged 6 to 10 build confidence, communication and essential life skills in a safe, structured, live online environment.",
};

export default function JuniorFoundationPage() {
  return <ProgramDetailClient cfg={cfg} pageClass="junior-foundation-page" />;
}
