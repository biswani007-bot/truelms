/**
 * TrueLern Curriculum Seed Script
 *
 * Idempotent seeder for the 8 canonical TrueLern course tracks.
 * Safe to run multiple times — uses upsert by slug.
 *
 * Usage:
 *   node scripts/seed-curriculum.js
 *
 * Requires: MONGODB_URI env variable (loaded from .env automatically)
 */

require("dotenv").config();
const mongoose = require("mongoose");

const TRACKS = [
  {
    courseCode: "TL-JF-01",
    courseName: "Junior Foundation",
    slug: "junior-foundation-ages-6-to-10",
    shortDescription:
      "A foundational learning program for children aged 6–10, building curiosity, numeracy, and creative thinking.",
    longDescription:
      "Junior Foundation is TrueLern's flagship early-childhood program. Through interactive live sessions, storytelling, and guided activities, children aged 6–10 develop core numeracy, literacy, and creative-thinking skills in a nurturing group environment. Each cohort runs for 12 weeks with two live sessions per week.",
    level: "beginner",
    difficulty: "easy",
    duration: 12,
    durationUnit: "weeks",
    deliveryMode: "live-cohort",
    pricing: { type: "one-time", price: 29900, currency: "USD", taxPercentage: 0 },
    outcomes: {
      learningOutcomes: [
        "Develop number sense and early arithmetic",
        "Build reading comprehension and vocabulary",
        "Practice creative expression through art and storytelling",
        "Cultivate confidence in group participation",
      ],
      skills: ["Numeracy", "Literacy", "Creative Thinking", "Communication", "Focus"],
    },
    faqs: [
      { question: "What age group is this for?", answer: "Children aged 6 to 10 years old." },
      { question: "How long is each session?", answer: "Each live session is 45 minutes, held twice weekly." },
    ],
  },
  {
    courseCode: "TL-FRB-02",
    courseName: "Future-Ready Builders",
    slug: "future-ready-builders-ages-9-to-14",
    shortDescription:
      "A project-based program for ages 9–14 covering technology, problem-solving, and entrepreneurial thinking.",
    longDescription:
      "Future-Ready Builders equips pre-teens and early teens with the skills needed for tomorrow's challenges. Students learn logical reasoning, basic coding concepts, design thinking, and project management through hands-on mini-projects. Live classes run twice weekly over 16 weeks.",
    level: "intermediate",
    difficulty: "medium",
    duration: 16,
    durationUnit: "weeks",
    deliveryMode: "live-cohort",
    pricing: { type: "one-time", price: 39900, currency: "USD", taxPercentage: 0 },
    outcomes: {
      learningOutcomes: [
        "Understand logical and computational thinking",
        "Design and present a personal project",
        "Apply problem-solving frameworks",
        "Develop basic financial and entrepreneurial awareness",
      ],
      skills: ["Logical Thinking", "Project Management", "Design Thinking", "Basic Coding", "Entrepreneurship"],
    },
    faqs: [
      { question: "What age group is this for?", answer: "Children aged 9 to 14 years old." },
      { question: "Is prior coding experience required?", answer: "No. The program starts from scratch." },
    ],
  },
  {
    courseCode: "TL-CC-03",
    courseName: "Communication & Confidence",
    slug: "communication-and-confidence",
    shortDescription:
      "Develop public speaking, expressive communication, and self-confidence skills through live interactive sessions.",
    longDescription:
      "Communication & Confidence is TrueLern's most popular program. Students learn to speak clearly, listen actively, express ideas persuasively, and manage speaking anxiety. Sessions include debates, storytelling, presentations, and live peer feedback. Suitable for ages 8–16.",
    level: "beginner",
    difficulty: "easy",
    duration: 10,
    durationUnit: "weeks",
    deliveryMode: "live-cohort",
    pricing: { type: "one-time", price: 24900, currency: "USD", taxPercentage: 0 },
    outcomes: {
      learningOutcomes: [
        "Speak clearly and confidently in front of a group",
        "Structure ideas for effective communication",
        "Practice active listening and peer feedback",
        "Overcome public speaking anxiety",
      ],
      skills: ["Public Speaking", "Active Listening", "Storytelling", "Debate", "Self-Confidence"],
    },
    faqs: [
      { question: "What age group is this for?", answer: "Ages 8 to 16. Cohorts are grouped by age." },
      { question: "Are there assignments?", answer: "Yes — short weekly speaking exercises and reflections." },
    ],
  },
  {
    courseCode: "TL-MS-04",
    courseName: "Money Skills",
    slug: "money-skills",
    shortDescription: "Practical financial literacy for young learners: budgeting, saving, earning, and smart spending.",
    longDescription:
      "Money Skills teaches children and teens the fundamentals of personal finance in age-appropriate, engaging live sessions. Topics include earning, saving, budgeting, giving, and avoiding debt. Students complete real budgeting exercises with play money and group simulations. Suitable for ages 10–16.",
    level: "beginner",
    difficulty: "easy",
    duration: 8,
    durationUnit: "weeks",
    deliveryMode: "live-cohort",
    pricing: { type: "one-time", price: 19900, currency: "USD", taxPercentage: 0 },
    outcomes: {
      learningOutcomes: [
        "Understand the difference between needs and wants",
        "Build and maintain a personal budget",
        "Develop saving habits and delayed gratification",
        "Understand the basics of entrepreneurship and earning",
      ],
      skills: ["Financial Literacy", "Budgeting", "Saving", "Decision Making", "Goal Setting"],
    },
    faqs: [
      { question: "What age group is this for?", answer: "Ages 10 to 16." },
      {
        question: "Do students need real money?",
        answer: "No. All exercises use simulated budgets and play scenarios.",
      },
    ],
  },
  {
    courseCode: "TL-EI-05",
    courseName: "Emotional Intelligence",
    slug: "emotional-intelligence",
    shortDescription:
      "Help children understand, express, and manage their emotions through structured live group sessions.",
    longDescription:
      "Emotional Intelligence (EQ) is TrueLern's social-emotional learning program. Students learn to identify and name emotions, empathize with others, resolve conflicts peacefully, and build resilience. Delivered through stories, role-plays, and reflection activities in small groups. Suitable for ages 6–14.",
    level: "beginner",
    difficulty: "easy",
    duration: 10,
    durationUnit: "weeks",
    deliveryMode: "live-cohort",
    pricing: { type: "one-time", price: 22900, currency: "USD", taxPercentage: 0 },
    outcomes: {
      learningOutcomes: [
        "Identify and name a full range of emotions",
        "Develop empathy and perspective-taking",
        "Practice conflict resolution strategies",
        "Build emotional resilience and self-regulation",
      ],
      skills: ["Emotional Awareness", "Empathy", "Self-Regulation", "Conflict Resolution", "Resilience"],
    },
    faqs: [
      { question: "What age group is this for?", answer: "Ages 6 to 14 (grouped by age)." },
      {
        question: "Is this a therapy program?",
        answer: "No. This is an educational EQ program and is not a substitute for professional mental health support.",
      },
    ],
  },
  {
    courseCode: "TL-AIR-06",
    courseName: "AI Readiness",
    slug: "ai-readiness",
    shortDescription:
      "Prepare young learners for an AI-driven world with hands-on exploration of AI concepts, tools, and ethics.",
    longDescription:
      "AI Readiness introduces students aged 10–16 to artificial intelligence in an accessible, age-appropriate way. Students explore how AI works, practice using AI tools responsibly, understand algorithmic thinking, and discuss the ethical dimensions of technology. No prior coding required.",
    level: "intermediate",
    difficulty: "medium",
    duration: 12,
    durationUnit: "weeks",
    deliveryMode: "live-cohort",
    pricing: { type: "one-time", price: 34900, currency: "USD", taxPercentage: 0 },
    outcomes: {
      learningOutcomes: [
        "Understand what AI is and how it is used in everyday life",
        "Explore AI tools and use them responsibly",
        "Develop algorithmic thinking skills",
        "Discuss the ethics and societal impact of AI",
      ],
      skills: ["AI Literacy", "Algorithmic Thinking", "Critical Thinking", "Digital Ethics", "Curiosity"],
    },
    faqs: [
      { question: "What age group is this for?", answer: "Ages 10 to 16." },
      { question: "Do students need any coding knowledge?", answer: "No. The program is accessible to all levels." },
    ],
  },
  {
    courseCode: "TL-TMH-07",
    courseName: "Time Management & Habits",
    slug: "time-management-and-habits",
    shortDescription:
      "Equip young learners with proven time management, habit-building, and self-discipline skills for school and life.",
    longDescription:
      "Time Management & Habits teaches students aged 8–16 how to plan their time, prioritize tasks, build productive routines, and overcome procrastination. Using practical frameworks like time-blocking, habit trackers, and goal-setting tools, students develop skills that last a lifetime.",
    level: "beginner",
    difficulty: "easy",
    duration: 8,
    durationUnit: "weeks",
    deliveryMode: "live-cohort",
    pricing: { type: "one-time", price: 19900, currency: "USD", taxPercentage: 0 },
    outcomes: {
      learningOutcomes: [
        "Create and maintain a weekly schedule",
        "Identify priorities and manage distractions",
        "Build productive daily habits using proven frameworks",
        "Set SMART goals and track progress",
      ],
      skills: ["Time Blocking", "Goal Setting", "Habit Formation", "Prioritization", "Self-Discipline"],
    },
    faqs: [
      { question: "What age group is this for?", answer: "Ages 8 to 16." },
      {
        question: "What tools are used?",
        answer: "Printable habit trackers, planners, and digital worksheets shared in class.",
      },
    ],
  },
  {
    courseCode: "TL-PRT-08",
    courseName: "Practical Real-World Thinking",
    slug: "practical-real-world-thinking",
    shortDescription:
      "Bridge the gap between classroom learning and real-world challenges through scenario-based live sessions.",
    longDescription:
      "Practical Real-World Thinking is TrueLern's critical thinking and applied problem-solving program. Students aged 11–16 tackle real-world scenarios across finance, civic life, environment, and technology — developing analytical reasoning, decision-making, and collaborative skills that schools rarely teach.",
    level: "intermediate",
    difficulty: "medium",
    duration: 12,
    durationUnit: "weeks",
    deliveryMode: "live-cohort",
    pricing: { type: "one-time", price: 29900, currency: "USD", taxPercentage: 0 },
    outcomes: {
      learningOutcomes: [
        "Apply critical thinking to real-world scenarios",
        "Develop structured decision-making skills",
        "Analyze problems from multiple perspectives",
        "Build collaborative problem-solving habits",
      ],
      skills: [
        "Critical Thinking",
        "Decision Making",
        "Systems Thinking",
        "Collaboration",
        "Real-World Application",
      ],
    },
    faqs: [
      { question: "What age group is this for?", answer: "Ages 11 to 16." },
      { question: "How are scenarios chosen?", answer: "Scenarios are sourced from current events and real-life challenges relevant to the student's age group." },
    ],
  },
];

async function seedCurriculum() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("ERROR: MONGODB_URI environment variable is required.");
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log("[TrueLern Curriculum Seed] Connected to MongoDB.");

  // Ensure a default CourseCategory exists
  let category = await mongoose.connection.collection("coursecategories").findOne({ slug: "truelern-programs" });
  if (!category) {
    const result = await mongoose.connection.collection("coursecategories").insertOne({
      name: "TrueLern Programs",
      slug: "truelern-programs",
      description: "Core TrueLern skill-building programs for children and teens.",
      isDeleted: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    category = { _id: result.insertedId };
    console.log("[TrueLern Curriculum Seed] Created default CourseCategory: TrueLern Programs");
  } else {
    console.log("[TrueLern Curriculum Seed] Using existing CourseCategory:", category._id);
  }

  let created = 0;
  let updated = 0;

  for (const track of TRACKS) {
    const existing = await mongoose.connection.collection("courses").findOne({ slug: track.slug });

    const doc = {
      ...track,
      category: category._id,
      language: "English",
      certificateAvailable: true,
      featured: true,
      status: "published",
      version: "1.0.0",
      requirements: {
        eligibility: "Open to all",
        prerequisites: [],
        software: [],
        hardware: [],
      },
      instructors: [],
      seoTitle: `${track.courseName} — TrueLern`,
      seoDescription: track.shortDescription,
      seoKeywords: track.outcomes.skills,
      isDeleted: false,
      updatedAt: new Date(),
    };

    if (!existing) {
      doc.createdAt = new Date();
      await mongoose.connection.collection("courses").insertOne(doc);
      console.log(`[TrueLern Curriculum Seed] ✅ Created: ${track.courseName} (${track.slug})`);
      created++;
    } else {
      await mongoose.connection.collection("courses").updateOne(
        { _id: existing._id },
        { $set: doc }
      );
      console.log(`[TrueLern Curriculum Seed] 🔄 Updated: ${track.courseName} (${track.slug})`);
      updated++;
    }
  }

  console.log(`\n[TrueLern Curriculum Seed] Completed: ${created} created, ${updated} updated.`);
  await mongoose.disconnect();
}

seedCurriculum().catch((err) => {
  console.error("[TrueLern Curriculum Seed] Execution error:", err);
  process.exit(1);
});
