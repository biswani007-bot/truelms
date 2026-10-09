// @ts-nocheck
"use client";

import React, { useEffect, useRef, useCallback, useState } from 'react';
import Link from 'next/link';
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from 'framer-motion';
import {
  Bot,
  Brain,
  CircleCheck,
  GraduationCap,
  Quote,
  School,
  Sparkles,
  Star,
  Trophy,
  UsersRound,
} from 'lucide-react';

import { FloatingDecorations } from '../../components/public/floating-decorations';
import { WaveSeparator } from '../../components/public/wave-separator';

// ── Framer Motion variants ──────────────────────────────────────────────────
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 36 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.75, ease: [0.16, 1, 0.3, 1], delay },
});

const fadeIn = (delay = 0) => ({
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: { duration: 0.6, ease: 'easeOut', delay },
});

const slideRight = {
  initial: { opacity: 0, x: 60, scale: 0.94 },
  animate: { opacity: 1, x: 0, scale: 1 },
  transition: { duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.25 },
};

const badgeVariants = [
  { initial: { opacity: 0, x: -30, y: -10 }, animate: { opacity: 1, x: 0, y: 0 }, transition: { duration: 0.6, delay: 0.9, ease: [0.16, 1, 0.3, 1] } },
  { initial: { opacity: 0, x: -30, y: 10 },  animate: { opacity: 1, x: 0, y: 0 }, transition: { duration: 0.6, delay: 1.1, ease: [0.16, 1, 0.3, 1] } },
  { initial: { opacity: 0, x: 30, y: 10 },   animate: { opacity: 1, x: 0, y: 0 }, transition: { duration: 0.6, delay: 1.3, ease: [0.16, 1, 0.3, 1] } },
];

const cardStaggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.25,
    }
  }
};

const cardStaggerItem = {
  hidden: { opacity: 0, y: -60 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
        type: "spring" as const,
        stiffness: 85,
        damping: 14,
        duration: 0.9,
    }
  }
};

// Subcomponents for internal organization
const BenefitCard = ({ img, title, description, badgeColor }: any) => (
  <div className={`benefit-card glass-panel border-${badgeColor}`}>
    <div className="benefit-img-wrapper">
      <img src={img} alt={title} className="decor-3d-image bob-animation" loading="lazy" decoding="async" width={180} height={180} />
    </div>
    <h3>{title}</h3>
    <p>{description}</p>
  </div>
);

const ProgramCard = ({ category, title, ageRange, description, link, themeColor }: any) => (
  <div className={`program-card glass-panel theme-${themeColor}`}>
    <span className="program-category">{category}</span>
    <h3>{title}</h3>
    <span className="program-age">{ageRange}</span>
    <p>{description}</p>
    <Link href={link} className="program-card-link">
      Learn More <span className="arrow">→</span>
    </Link>
  </div>
);

const StepCard = ({ stepNumber, title, description }: any) => (
  <div className="step-card glass-panel">
    <div className="step-number-badge">{stepNumber}</div>
    <h3>{title}</h3>
    <p>{description}</p>
  </div>
);

const MetricItem = ({ value, label }: any) => (
  <div className="metric-item">
    <div className="metric-value">{value}</div>
    <div className="metric-label">{label}</div>
  </div>
);

const TestimonialCard = ({ quote, author, childInfo, rating }: any) => (
  <div className="testimonial-card glass-panel">
    <div className="testimonial-rating">
      {'★'.repeat(rating)}{'☆'.repeat(5 - rating)}
    </div>
    <p className="testimonial-quote">"{quote}"</p>
    <div className="testimonial-author">
      <div className="author-avatar">{author.charAt(0)}</div>
      <div className="author-info">
        <h4>{author}</h4>
        <span>Parent of {childInfo}</span>
      </div>
    </div>
  </div>
);

const testimonialCardVariants = {
  hidden: { opacity: 0, y: 34 },
  visible: (index: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      delay: index * 0.15,
      ease: [0.16, 1, 0.3, 1] as any,
    },
  }),
};

const achievementCards = [
  { label: 'Confidence Builder', Icon: CircleCheck, className: 'achievement-confidence' },
  { label: 'AI Ready', Icon: Bot, className: 'achievement-ai' },
  { label: 'Parent Approved', Icon: UsersRound, className: 'achievement-parent' },
  { label: '10,000+ Students', Icon: GraduationCap, className: 'achievement-students' },
];

const orbitIcons = [
  { Icon: Trophy, className: 'orbit-trophy' },
  { Icon: Sparkles, className: 'orbit-sparkle' },
  { Icon: Brain, className: 'orbit-brain' },
  { Icon: School, className: 'orbit-school' },
  { Icon: Star, className: 'orbit-star' },
];

const PremiumTestimonialCard = ({ quote, author, childInfo, rating, index }: any) => (
  <motion.div
    className="testimonial-card glass-panel"
    custom={index}
    variants={testimonialCardVariants}
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true, amount: 0.3 }}
    whileHover={{ y: -12, scale: 1.03 }}
  >
    <span className="testimonial-quote-icon" aria-hidden="true">
      <Quote />
    </span>
    <div className="testimonial-rating" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, starIndex) => (
        <Star
          key={starIndex}
          className={starIndex < rating ? 'star-filled' : ''}
          aria-hidden="true"
        />
      ))}
    </div>
    <p className="testimonial-quote">"{quote}"</p>
    <div className="testimonial-author">
      <div className="author-avatar">{author.charAt(0)}</div>
      <div className="author-info">
        <h4>{author}</h4>
        <span>Parent of {childInfo}</span>
      </div>
    </div>
  </motion.div>
);

export default function Home() {
  // ── Auto-playing banner slider ───────────────────────────────────────────
  const [currentBanner, setCurrentBanner] = useState(0);
  const banners = [
    '/img/public/banner_flat_1.webp',
    '/img/public/banner_flat_2.webp',
    '/img/public/banner_flat_3.webp'
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentBanner((prev) => (prev + 1) % banners.length);
    }, 3000);
    return () => clearInterval(timer);
  }, [banners.length]);

  // ── Scroll reveal ─────────────────────────────────────────────────────────
  useEffect(() => {
    const animatedElements = document.querySelectorAll('.animate-on-scroll');
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.05, rootMargin: '0px 0px 100px 0px' });
    animatedElements.forEach(el => observer.observe(el));
    return () => { animatedElements.forEach(el => observer.unobserve(el)); };
  }, []);

  // ── Mouse parallax for hero image ────────────────────────────────────────
  const heroRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springCfg = { stiffness: 55, damping: 22, mass: 1 };
  const sX = useSpring(mouseX, springCfg);
  const sY = useSpring(mouseY, springCfg);
  const imgX   = useTransform(sX, [-600, 600], [-18, 18]);
  const imgY   = useTransform(sY, [-400, 400], [-12, 12]);
  const rotX   = useTransform(sY, [-400, 400], [7, -7]);
  const rotY   = useTransform(sX, [-600, 600], [-7, 7]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!heroRef.current) return;
    const r = heroRef.current.getBoundingClientRect();
    mouseX.set(e.clientX - r.left - r.width / 2);
    mouseY.set(e.clientY - r.top  - r.height / 2);
  }, [mouseX, mouseY]);

  const handleMouseLeave = useCallback(() => {
    mouseX.set(0);
    mouseY.set(0);
  }, [mouseX, mouseY]);

  return (
    <div className="home-page">

      {/* ── BANNER STRIP SLIDER ── */}
      <section className="banner-strip-section">
        <div className="banner-slider-container">
          <AnimatePresence initial={false}>
            <motion.img
              key={currentBanner}
              src={banners[currentBanner]}
              alt={`TrueLern — Slide ${currentBanner + 1}`}
              className="banner-strip-img"
              decoding="async"
              initial={{ opacity: 0, filter: 'blur(8px)', x: '70%', scale: 1.04 }}
              animate={{ opacity: 1, filter: 'blur(0px)', x: 0, scale: 1 }}
              exit={{ opacity: 0, filter: 'blur(8px)', x: '-70%', scale: 0.96 }}
              transition={{
                x: { type: "spring", stiffness: 220, damping: 28 },
                opacity: { duration: 0.35 },
                filter: { duration: 0.35 },
                scale: { duration: 0.5, ease: [0.16, 1, 0.3, 1] }
              }}
            />
          </AnimatePresence>
        </div>
      </section>

      {/* ── HERO SECTION ── */}
      <section
        className="hero-section"
        ref={heroRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {/* Ambient glow orbs */}
        <div className="hero-orb hero-orb-1" aria-hidden="true" />
        <div className="hero-orb hero-orb-2" aria-hidden="true" />
        <div className="hero-orb hero-orb-3" aria-hidden="true" />

        {/* Floating particles */}
        <div className="hero-particles" aria-hidden="true">
          {[...Array(14)].map((_, i) => (
            <span key={i} className={`hp hp-${i + 1}`} />
          ))}
        </div>

        <FloatingDecorations count={10} />

        {/* Floating educational emoji icons */}
        {[
          { cls: 'star-1',    icon: '⭐' },
          { cls: 'star-2',    icon: '🌟' },
          { cls: 'book-1',    icon: '📚' },
          { cls: 'bubble-1',  icon: '💬' },
          { cls: 'brain-1',   icon: '🧠' },
          { cls: 'robot-mini',icon: '🤖' },
          { cls: 'pencil-1',  icon: '✏️' },
          { cls: 'bulb-1',    icon: '💡' },
        ].map(({ cls, icon }) => (
          <motion.div
            key={cls}
            className={`floating-element ${cls}`}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: Math.random() * 0.8 + 0.3, ease: 'backOut' }}
          >
            {icon}
          </motion.div>
        ))}

        <div className="container hero-grid">

          {/* ── LEFT — text content ── */}
          <div className="hero-content">

            <span
              className="hero-badge animate-fade-up"
              style={{ '--delay': '0.05s' } as React.CSSProperties}
            >
              🚀 Next-Generation Life Skills
            </span>

            <h1
              className="hero-title animate-fade-up"
              style={{ '--delay': '0.18s' } as React.CSSProperties}
            >
              Build the skills school does not teach{' '}
              <span className="text-gradient">deeply enough.</span>
            </h1>

            <p
              className="hero-subtitle animate-fade-up"
              style={{ '--delay': '0.32s' } as React.CSSProperties}
            >
              TrueLern helps children aged 6 to 14 build confidence, communication,
              emotional intelligence, money sense, AI readiness, time management
              and practical real-world thinking through structured live online classes.
            </p>

            <div
              className="hero-actions animate-fade-up"
              style={{ '--delay': '0.46s' } as React.CSSProperties}
            >
              <Link href="/book-demo" className="btn btn-primary glass-cta hero-btn-primary">
                Book Free Demo
              </Link>
              <Link href="#programs" className="btn btn-secondary glass-cta hero-btn-secondary">
                Explore Programs
              </Link>
            </div>

            <p
              className="hero-microcopy animate-fade-up"
              style={{
                '--delay': '0.55s',
                fontSize: '0.9rem',
                opacity: 0.8,
                marginTop: '1.25rem',
                color: '#94a3b8',
                fontWeight: '500',
                lineHeight: '1.5'
              } as React.CSSProperties}
            >
              Weekend-friendly live classes. Small groups. Parent progress updates. Designed for long-term growth.
            </p>

          </div>

          {/* ── RIGHT — hero image with parallax ── */}
          <div className="hero-media">

            {/* Glow backdrop */}
            <div className="hero-image-backdrop" />

            {/* Floating ring decoration */}
            <div className="hero-ring hero-ring-outer" aria-hidden="true" />
            <div className="hero-ring hero-ring-inner" aria-hidden="true" />

            {/* Interactive Live Classroom Frame */}
            <motion.div 
              className="classroom-mockup-frame animate-slide-right"
              style={{
                x: imgX,
                y: imgY,
                rotateX: rotX,
                rotateY: rotY,
                transformPerspective: 1000,
              }}
              whileHover={{ scale: 1.02 }}
            >
              {/* Window Controls */}
              <div className="mockup-top-bar">
                <div className="mockup-dots">
                  <span className="dot dot-red"></span>
                  <span className="dot dot-yellow"></span>
                  <span className="dot dot-green"></span>
                </div>
                <div className="mockup-status">
                  <span className="status-ping"></span> Live Interactive Room
                </div>
                <div className="mockup-participants">
                  👥 12 Online
                </div>
              </div>

              <div className="mockup-content">
                <img
                  src="/img/public/hero_kids.webp"
                  alt="TrueLern — Future Ready Kids Learning"
                  className="hero-image"
                  loading="eager"
                  fetchPriority="high"
                  decoding="async"
                  width={560}
                  height={420}
                />
                
                {/* Active speaker border overlay */}
                <div className="active-speaker-indicator">Active Speaker: Coach Mike</div>
              </div>
            </motion.div>

            {/* ── Floating stat badges — repositioned outside image ── */}
            {/* Badge 1: above-left, clear of image */}
            <motion.div
              className="hero-float-badge fbadge-1"
              {...(badgeVariants[0] as any)}
              whileHover={{ scale: 1.08, y: -4 }}
            >
              🏆 10,000+ Graduated
            </motion.div>

            {/* Badge 2: below-left, clear of image */}
            <motion.div
              className="hero-float-badge fbadge-2"
              {...(badgeVariants[1] as any)}
              whileHover={{ scale: 1.08, y: -4 }}
            >
              🗣️ Speaking Confidently
            </motion.div>

            {/* Badge 3: below-right, clear of image */}
            <motion.div
              className="hero-float-badge fbadge-3"
              {...(badgeVariants[2] as any)}
              whileHover={{ scale: 1.08, y: -4 }}
            >
              🧠 Emotional Strength
            </motion.div>

          </div>
        </div>
      </section>

      <WaveSeparator color="var(--light-surface-elevated)" direction="bottom" />

      {/* 2. Trust Strip (Backup / Secondary Brand Strip) */}
      <section className="trust-strip">
        <div className="container">
          <p className="trust-text">Trusted by 10,000+ parents and referenced worldwide</p>
          <div className="trust-logos">
            <span className="trust-logo">TechCrunch</span>
            <span className="trust-logo">Forbes</span>
            <span className="trust-logo">New York Times</span>
            <span className="trust-logo">BBC Education</span>
            <span className="trust-logo">WIRED</span>
          </div>
        </div>
      </section>

      <WaveSeparator color="var(--light-bg)" direction="bottom" flip={true} />

      {/* 3. Problem Section */}
      <section className="problem-section animate-on-scroll">
        <div className="container problem-layout-container">
          <div className="section-header text-center problem-header">
            <span className="section-tag">The Education Gap</span>
            <h2>Schools Teach Yesterday. We Teach Tomorrow.</h2>
            <p className="section-description" style={{ maxWidth: '850px', margin: '0 auto 2rem auto', lineHeight: '1.7' }}>
              Your child may be learning math, science and language in school. But who is teaching them how to speak confidently, manage emotions, understand money, use AI wisely, make decisions and handle real-world situations?
              <br /><br />
              Most children are taught what to study. Very few are taught how to think, speak, decide, manage time, understand value and build confidence. TrueLern exists to close that gap.
            </p>
          </div>
          
          <motion.div 
            className="problem-comparison grid-responsive grid-responsive-2"
            variants={cardStaggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.15 }}
          >
            <motion.div 
              className="comparison-card schools-card interactive-hover-card h-full"
              variants={cardStaggerItem as any}
            >
              <div className="comparison-card-image-wrapper">
                <img 
                  src="/img/public/problem_pressure.webp" 
                  alt="Traditional school pressure illustration" 
                  className="comparison-card-image" 
                  loading="lazy"
                  decoding="async"
                  width={480}
                  height={320}
                />
              </div>
              <div className="comparison-card-content">
                <div className="comparison-title-row">
                  <div className="problem-card-icon">⚠️</div>
                  <h3>Traditional School Focus</h3>
                </div>
                <ul>
                  <li>❌ Memorization over critical understanding</li>
                  <li>❌ Static curriculums ignoring AI & Automation</li>
                  <li>❌ High focus on individual tests rather than collaborations</li>
                  <li>❌ Neglecting crucial soft skills and financial literacy</li>
                </ul>
              </div>
            </motion.div>

            <motion.div 
              className="comparison-card truelern-card glass-panel interactive-hover-card highlight-glow h-full"
              variants={cardStaggerItem as any}
            >
              <div className="comparison-card-image-wrapper">
                <img 
                  src="/img/public/demo_learning.webp" 
                  alt="TrueLern active interactive learning model" 
                  className="comparison-card-image" 
                  loading="lazy"
                  decoding="async"
                  width={480}
                  height={320}
                />
              </div>
              <div className="comparison-card-content">
                <div className="comparison-title-row">
                  <div className="problem-card-icon green">✨</div>
                  <h3>The TrueLern Model</h3>
                </div>
                <ul>
                  <li>✨ Practical problem-solving and logic building</li>
                  <li>✨ Native AI literacy and tech adaptability</li>
                  <li>✨ Project-based collaborations & communications</li>
                  <li>✨ Vital real-world skills: finance, emotion & leadership</li>
                </ul>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <WaveSeparator color="#f6f5ff" direction="bottom" />

      {/* 4. Three Core Benefits */}
      <section className="benefits-section animate-on-scroll">
        <div className="benefits-section-watermark"></div>
        <FloatingDecorations count={8} />
        <div className="container">
          <div className="section-header text-center">
            <span className="section-tag">Why It Works</span>
            <h2>Learning Designed for Real Impact</h2>
            <p className="section-description">
              Our pedagogical system is structured to make modern skills highly accessible and engaging.
            </p>
          </div>
          <div className="benefits-grid grid-responsive grid-responsive-3">
            <BenefitCard 
              img="/img/public/benefit_confidence.webp"
              title="Confidence and Communication"
              description="Empowering kids through structured public speaking exercises, voice projection techniques, and active presentation practice."
              badgeColor="sky"
            />
            <BenefitCard 
              img="/img/public/benefit_money.webp"
              title="Money, Time and Practical Thinking"
              description="Teaching real-world habits: Distinguishing needs from wants, understanding budgeting, savings, time logs, and strategic organization."
              badgeColor="gold"
            />
            <BenefitCard 
              img="/img/public/robot_ai.webp"
              title="AI Readiness and Future Skills"
              description="Mastering generative tech, prompt mechanics, and critical logic to ensure children stay ahead in a digital-native future."
              badgeColor="violet"
            />
          </div>
        </div>
      </section>

      <WaveSeparator color="#ece9ff" direction="bottom" flip={true} />

      {/* 5. Programs Snapshot Showcase */}
      <section id="programs" className="programs-section animate-on-scroll">
        <div className="container">
          <div className="section-header">
            <div>
              <span className="section-tag">Learning Pathways</span>
              <h2>Curriculums For Every Age Group</h2>
            </div>
            <Link href="/programs" className="btn btn-text">
              View All 8 Programs →
            </Link>
          </div>
          <div className="programs-grid grid-responsive grid-responsive-3">
            <ProgramCard 
              category="Ages 6-9"
              title="Junior Foundation"
              ageRange="Grades 1 - 3"
              description="Building essential foundations in logical thinking, structured public speaking, and building basic habits for self-organization through storytelling and active quests."
              link="/junior-foundation"
              themeColor="sky"
            />
            <ProgramCard 
              category="Ages 10-13"
              title="Future Ready Builders"
              ageRange="Grades 4 - 8"
              description="Introducing UI/UX design, visual programming, systemic logic, and structured project prototyping frameworks for future student leaders."
              link="/future-ready-builders"
              themeColor="purple"
            />
            <ProgramCard 
              category="Ages 14-18"
              title="AI Readiness"
              ageRange="Grades 9 - 12"
              description="Mastering generative AI tools, prompt engineering mechanics, neural networks, ethics, and future technology adaptation."
              link="/ai-readiness"
              themeColor="violet"
            />
          </div>
        </div>
      </section>

      <WaveSeparator color="#0a0b1d" direction="bottom" />

      {/* 6. How The Academy Works (Modernized Horizontal Timeline) */}
      <section className="how-it-works-section animate-on-scroll">
        <div className="how-it-works-watermark" aria-hidden="true" />
        <div className="container">
          <div className="section-header text-center">
            <span className="section-tag">Your Journey</span>
            <h2>Simple Steps to Get Started</h2>
            <p className="section-description">We guide your child through a progressive six-step learning roadmap.</p>
          </div>
          
          <div className="roadmap-timeline-wrapper">
            <div className="timeline-connector-line"></div>
            
            <div className="roadmap-steps-grid">
              <div className="roadmap-step-node">
                <div className="step-circle bg-sky">1</div>
                <h4>Book Demo</h4>
                <p>Schedule a 45-minute interactive video call to experience a live cohort.</p>
              </div>
              <div className="roadmap-step-node">
                <div className="step-circle bg-orange">2</div>
                <h4>Understand Goals</h4>
                <p>Complete a profile check to identify specific developmental targets.</p>
              </div>
              <div className="roadmap-step-node">
                <div className="step-circle bg-yellow">3</div>
                <h4>Join Age Batch</h4>
                <p>Get matched with a maximum of 6 peer students of similar ages.</p>
              </div>
              <div className="roadmap-step-node">
                <div className="step-circle bg-green">4</div>
                <h4>Live Learning</h4>
                <p>Participate in live weekly Skill Sprints, tasks, and gaming quests.</p>
              </div>
              <div className="roadmap-step-node">
                <div className="step-circle bg-violet">5</div>
                <h4>Parent Updates</h4>
                <p>Track notes, confidence levels, and tips from the dashboard.</p>
              </div>
              <div className="roadmap-step-node">
                <div className="step-circle bg-pink">6</div>
                <h4>Progression</h4>
                <p>Graduate, showcase independent projects, and level up.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <WaveSeparator color="#100b2c" direction="bottom" flip={true} />

      {/* 7. Long-Term Learning Ladder */}
      <section className="learning-ladder-section animate-on-scroll">
        <FloatingDecorations count={6} />
        <div className="container ladder-grid">
          <div className="ladder-content-text">
            <span className="section-tag">Ladder Progression</span>
            <h2>Long-Term Learning Ladder</h2>
            <p className="section-description">
              Our levels are designed to systematically scale confidence, leadership, and technical capability. Watch your child move from initial trials to certified future readiness.
            </p>
            <motion.div 
              className="ladder-check-list"
              variants={{
                hidden: { opacity: 0 },
                show: {
                  opacity: 1,
                  transition: {
                    staggerChildren: 0.18,
                    delayChildren: 0.1
                  }
                }
              }}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.3 }}
            >
              <motion.div 
                className="ladder-check-item"
                variants={{
                  hidden: { opacity: 0, y: 25 },
                  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 80, damping: 12 } }
                }}
              >
                <span className="check-bullet green">✓</span>
                <p><strong>Foundation:</strong> Logical introductions, basic schedules, and voice projection.</p>
              </motion.div>
              <motion.div 
                className="ladder-check-item"
                variants={{
                  hidden: { opacity: 0, y: 25 },
                  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 80, damping: 12 } }
                }}
              >
                <span className="check-bullet orange">✓</span>
                <p><strong>Growth:</strong> Peer presentation rounds, worksheet calculations, and UI prototyping.</p>
              </motion.div>
              <motion.div 
                className="ladder-check-item"
                variants={{
                  hidden: { opacity: 0, y: 25 },
                  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 80, damping: 12 } }
                }}
              >
                <span className="check-bullet purple">✓</span>
                <p><strong>Future Ready:</strong> Master prompt engineering, design thinking, and graduations.</p>
              </motion.div>
            </motion.div>
          </div>

          <div className="ladder-visual-journey glass-panel">
            <h3 className="ladder-title"> Progression Pathway</h3>
            <div className="ladder-track">
              <div className="ladder-level active">
                <span className="level-badge">Step 3</span>
                <div className="level-info">
                  <h4>Future Ready (Ages 14-18)</h4>
                  <p>Neural networks, prompt mechanics, and advanced tech ethics.</p>
                </div>
              </div>
              <div className="ladder-level active">
                <span className="level-badge">Step 2</span>
                <div className="level-info">
                  <h4>Growth (Ages 10-13)</h4>
                  <p>UI/UX designs, logic mapping, and team showcases.</p>
                </div>
              </div>
              <div className="ladder-level active">
                <span className="level-badge">Step 1</span>
                <div className="level-info">
                  <h4>Foundation (Ages 6-9)</h4>
                  <p>Public introductions, needs vs wants, and routine charts.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <WaveSeparator color="#0e0f22" direction="bottom" />

      {/* 8. Why Parents Choose TrueLern */}
      <section className="parents-section animate-on-scroll">
        <div className="container parents-grid">
          <div className="parents-content">
            <span className="section-tag">Real Outcomes</span>
            <h2>Backed by Verified Parent Results</h2>
            <p>
              We measure our success by the growth, confidence, and critical capability of our students. TrueLern is designed to bring practical confidence you can see immediately.
            </p>
            <div className="metrics-box">
              <MetricItem value="94%" label="Parent Satisfaction Rate" />
              <MetricItem value="3x" label="Avg. Confidence Growth" />
              <MetricItem value="10k+" label="Global Graduates" />
            </div>
          </div>
          <div className="parents-visual glass-panel">
            <h3>Parent Dashboard Insights</h3>
            <div className="parent-insight-row">
              <span className="insight-badge">Communication</span>
              <div className="progress-bar-wrapper">
                <div className="progress-bar" style={{ width: '85%' }}></div>
              </div>
              <span className="insight-value">85% (Advanced)</span>
            </div>
            <div className="parent-insight-row">
              <span className="insight-badge">Financial Literacy</span>
              <div className="progress-bar-wrapper">
                <div className="progress-bar" style={{ width: '70%' }}></div>
              </div>
              <span className="insight-value">70% (Proficient)</span>
            </div>
            <div className="parent-insight-row">
              <span className="insight-badge">Logic & Coding</span>
              <div className="progress-bar-wrapper">
                <div className="progress-bar" style={{ width: '92%' }}></div>
              </div>
              <span className="insight-value">92% (Excellent)</span>
            </div>
          </div>
        </div>

        {/* Why Parents Choose List (Section 6.7) */}
        <div className="container" style={{ marginTop: '4rem', borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '3rem' }}>
          <h3 style={{ color: '#ffffff', fontSize: '2rem', fontWeight: '900', marginBottom: '2rem', textAlign: 'center' }}>
            Why Parents Choose TrueLern
          </h3>
          <div className="parents-choose-grid">
            {[
              { heading: "Structured learning", description: "instead of random classes." },
              { heading: "Live practice", description: "instead of passive videos." },
              { heading: "Small groups", description: "so each child participates." },
              { heading: "Weekend-friendly schedule", description: "for busy families." },
              { heading: "Progress updates", description: "so parents know what is improving." },
              { heading: "Future-ready skills", description: "beyond academics." },
              { heading: "Premium yet affordable", description: "learning model." },
              { heading: "A clear path", description: "from first demo to long-term development." }
            ].map((bullet, idx) => (
              <div key={idx} className="parents-choose-card">
                <span className="parents-choose-icon">✨</span>
                <div className="parents-choose-text">
                  <strong className="parents-choose-heading">{bullet.heading}</strong>{' '}
                  <span className="parents-choose-desc">{bullet.description}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <WaveSeparator color="var(--light-bg)" direction="bottom" flip={true} />

      {/* 9. Testimonials */}
      <section className="testimonials-section" aria-labelledby="testimonials-title">
        <div className="testimonial-bg-stars" aria-hidden="true">
          <span className="testimonial-star star-one">+</span>
          <span className="testimonial-star star-two">+</span>
          <span className="testimonial-star star-three">+</span>
          <span className="testimonial-dot dot-one" />
          <span className="testimonial-dot dot-two" />
          <span className="testimonial-dot dot-three" />
        </div>
        <FloatingDecorations count={5} />
        <div className="container testimonial-layout-wrapper">
          <div className="testimonial-header-area">
            <motion.div
              className="section-header testimonial-section-header"
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.35 }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            >
              <span className="testimonial-section-tag">
                <Star aria-hidden="true" />
                TESTIMONIALS
                <Star aria-hidden="true" />
              </span>
              <h2 id="testimonials-title">
                What Parents Around the <span>Globe</span> Say
              </h2>
              <p>
                Real stories from real parents who trust TrueLern to prepare their
                children for a brighter, more confident future.
              </p>
            </motion.div>

            <div className="testimonials-grid">
              <PremiumTestimonialCard
                quote="My daughter used to dread speaking in class. After 3 months of the communication cohort at TrueLern, she volunteered to lead her group's presentation! The difference is night and day."
                author="Marcus Sterling"
                childInfo="Sarah - Age 11"
                rating={5}
                index={0}
              />
              <PremiumTestimonialCard
                quote="The AI Readiness track is outstanding. Instead of just playing mobile games, my son is now using AI prompts to build interactive stories and games. The coaches are phenomenal."
                author="Elena Rostova"
                childInfo="Alexei - Age 14"
                rating={5}
                index={1}
              />
              <PremiumTestimonialCard
                quote="We were searching for a curriculum that covered money habits. The Money Skills cohort taught my son budgeting, savings, and investment principles in a fun, relatable way. Highly recommend!"
                author="Tariq Johnson"
                childInfo="Jordan - Age 9"
                rating={5}
                index={2}
              />
            </div>
          </div>

          <motion.div
            className="testimonial-illustration"
            initial={{ opacity: 0, x: 56, scale: 0.94 }}
            whileInView={{ opacity: 1, x: 0, scale: 1 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
          >
            <div className="testimonial-orbit-scene" aria-hidden="true">
              <div className="testimonial-glow" />
              <div className="testimonial-orbit-ring orbit-ring-main" />
              <div className="testimonial-orbit-ring orbit-ring-dotted" />

              {orbitIcons.map(({ Icon, className }, index) => (
                <motion.span
                  className={`testimonial-orbit-icon ${className}`}
                  key={className}
                  animate={{ y: [0, -10, 0], rotate: [0, index % 2 ? -5 : 5, 0] }}
                  transition={{
                    duration: 5 + index,
                    repeat: Infinity,
                    ease: 'easeInOut',
                    delay: index * 0.35,
                  }}
                >
                  <Icon />
                </motion.span>
              ))}

              <img
                src="/img/public/coach_teacher.webp"
                alt="TrueLern teacher mentor illustration"
                className="testimonial-teacher-image"
                loading="lazy"
                decoding="async"
                width={360}
                height={360}
              />

              {achievementCards.map(({ label, Icon, className }, index) => (
                <motion.div
                  className={`achievement-card ${className}`}
                  key={label}
                  animate={{ y: [0, -12, 0] }}
                  transition={{
                    duration: 4.8 + index * 0.55,
                    repeat: Infinity,
                    ease: 'easeInOut',
                    delay: index * 0.45,
                  }}
                >
                  <span>
                    <Icon aria-hidden="true" />
                  </span>
                  <strong>{label}</strong>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      <motion.div
        className="home-wave-image-banner"
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.35 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        aria-hidden="true"
      >
        <div className="home-wave-banner-shine" />
        <svg
          className="home-wave-banner-svg"
          viewBox="0 0 1440 180"
          preserveAspectRatio="none"
        >
          <defs>
            <clipPath id="home-wave-banner-clip">
              <path d="M0,70L80,61.7C160,53,320,37,480,42.3C640,48,800,75,960,84.7C1120,95,1280,85,1360,76.7L1440,68L1440,180L1360,180C1280,180,1120,180,960,180C800,180,640,180,480,180C320,180,160,180,80,180L0,180Z" />
            </clipPath>
            <linearGradient id="home-wave-banner-overlay" x1="0" x2="1" y1="0" y2="1">
              <stop offset="0%" stopColor="#11142F" stopOpacity="0.9" />
              <stop offset="48%" stopColor="#17234A" stopOpacity="0.74" />
              <stop offset="100%" stopColor="#11142F" stopOpacity="0.88" />
            </linearGradient>
          </defs>
          <path
            className="home-wave-banner-base"
            d="M0,70L80,61.7C160,53,320,37,480,42.3C640,48,800,75,960,84.7C1120,95,1280,85,1360,76.7L1440,68L1440,180L1360,180C1280,180,1120,180,960,180C800,180,640,180,480,180C320,180,160,180,80,180L0,180Z"
          />
          <image
            href="/img/public/banner_flat_3.webp"
            x="0"
            y="0"
            width="1440"
            height="180"
            preserveAspectRatio="xMidYMid slice"
            clipPath="url(#home-wave-banner-clip)"
            className="home-wave-banner-full-image"
          />
          <path
            className="home-wave-banner-overlay"
            d="M0,70L80,61.7C160,53,320,37,480,42.3C640,48,800,75,960,84.7C1120,95,1280,85,1360,76.7L1440,68L1440,180L1360,180C1280,180,1120,180,960,180C800,180,640,180,480,180C320,180,160,180,80,180L0,180Z"
          />
        </svg>
      </motion.div>

      {/* 10. Final CTA */}
      <motion.section
        className="final-cta-section"
        initial={{ opacity: 0, y: 36 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.28 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="container">
          <motion.div
            className="cta-box glass-panel text-center"
            initial={{ opacity: 0, scale: 0.96 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, amount: 0.35 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
          >
            <FloatingDecorations count={8} />
            
            {/* Confetti decoration */}
            <div className="confetti-bubble c1">🎉</div>
            <div className="confetti-bubble c2">✨</div>
            <div className="confetti-bubble c3">🌟</div>
            <div className="confetti-bubble c4">🎈</div>

            <div className="cta-grid-layout">
              <motion.div
                className="cta-visual-left"
                initial={{ opacity: 0, x: -36, rotate: -2 }}
                whileInView={{ opacity: 1, x: 0, rotate: 0 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1], delay: 0.22 }}
              >
                <img 
                  src="/img/public/final_cta_child.webp" 
                  alt="Happy successful child holding graduation scroll" 
                  className="cta-happy-child bob-animation" 
                  loading="lazy"
                  decoding="async"
                  width={280}
                  height={380}
                />
              </motion.div>
              <motion.div
                className="cta-content-right"
                initial={{ opacity: 0, x: 36 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
              >
                <h2>Invest in Your Child's Future Today</h2>
                <p>
                  Join thousands of forward-thinking families preparing their children for the opportunities of tomorrow. Your first demo cohort class is completely free.
                </p>
                <div className="cta-buttons">
                  <Link href="/book-demo" className="btn btn-primary btn-large animated-pulse-btn">
                    Claim Your Free Demo Session
                  </Link>
                </div>
                <span className="cta-subtext">No credit card required. Duration: 45 minutes.</span>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </motion.section>
    </div>
  );
}
