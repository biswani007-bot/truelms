// @ts-nocheck
"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bot,
  Brain,
  ChevronDown,
  CircleHelp,
  Clock,
  Coins,
  GraduationCap,
  Handshake,
  Hammer,
  LayoutDashboard,
  LogOut,
  MessageCircle,
  Puzzle,
  Rocket,
  Settings,
  Sprout,
  Target,
  TrendingUp,
  User,
  UserRound,
  Users,
} from 'lucide-react';

const DropdownIcon = ({ Icon }: { Icon: any }) => (
  <span className="dropdown-icon" aria-hidden="true">
    <Icon />
  </span>
);

export const ViteNavbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [isDesktop, setIsDesktop] = useState(true);
  const [authUser, setAuthUser] = useState<{
    id: string;
    firstName?: string;
    lastName?: string;
    email: string;
    role: string;
  } | null>(null);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const pathname = usePathname() || '/';
  const navRef = useRef<HTMLElement>(null);
  const accountRef = useRef<HTMLDivElement>(null);
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    let isMounted = true;
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (isMounted) {
          if (data?.authenticated && data?.user) {
            setAuthUser(data.user);
          } else {
            setAuthUser(null);
          }
        }
      })
      .catch(() => {
        if (isMounted) setAuthUser(null);
      });

    return () => {
      isMounted = false;
    };
  }, [pathname]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (accountRef.current && !accountRef.current.contains(event.target as Node)) {
        setAccountMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // ignore
    }
    setAuthUser(null);
    setAccountMenuOpen(false);
    window.location.href = '/login';
  };

  const normalizePath = (path: string) => path.replace(/\/$/, "") || "/";

  const isActive = (path: string) => {
    const normCurrent = normalizePath(pathname);
    const normPath = normalizePath(path);

    const matchesSingle = (p1: string, p2: string) => {
      if (p1 === p2) return true;
      if (p1 === `/programs${p2}`) return true;
      if (p1.startsWith('/programs') && p1.slice('/programs'.length) === p2) return true;
      return false;
    };

    if (matchesSingle(normCurrent, normPath)) return true;

    const aliases: Record<string, string[]> = {
      '/communication': ['/communication-confidence'],
      '/communication-confidence': ['/communication'],
      '/time-management': ['/time-management-habits'],
      '/time-management-habits': ['/time-management'],
      '/practical-real-world-thinking': ['/practical-thinking'],
      '/practical-thinking': ['/practical-real-world-thinking']
    };

    const targetAliases = aliases[normPath] || [];
    return targetAliases.some(alias => matchesSingle(normCurrent, normalizePath(alias)));
  };

  const isParentActive = (paths: string[]) => paths.some((path) => {
    if (pathname === path || pathname.startsWith(path + "/")) return true;
    return false;
  });

  const programRoutes = [
    "/junior-foundation",
    "/future-ready-builders",
    "/communication-confidence",
    "/money-skills",
    "/emotional-intelligence",
    "/ai-readiness",
    "/time-management-habits",
    "/practical-real-world-thinking"
  ];

  const isProgramsActive = pathname === "/programs" || pathname === "/programs/" || programRoutes.some((route) => isActive(route));

  useEffect(() => {
    setIsDesktop(window.innerWidth > 1024);
    const handleResize = () => {
      setIsDesktop(window.innerWidth > 1024);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setActiveDropdown(null);
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
  }, [pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setActiveDropdown(null);
        setMobileOpen(false);
        if (closeTimeoutRef.current) {
          clearTimeout(closeTimeoutRef.current);
          closeTimeoutRef.current = null;
        }
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const handleMouseEnter = useCallback((name: string) => {
    if (!isDesktop) return;
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    setActiveDropdown(name);
  }, [isDesktop]);

  const handleMouseLeave = useCallback(() => {
    if (!isDesktop) return;
    if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    closeTimeoutRef.current = setTimeout(() => {
      setActiveDropdown(null);
    }, 200);
  }, [isDesktop]);

  const handleDropdownTriggerClick = useCallback((e: React.MouseEvent, name: string) => {
    if (!isDesktop) {
      e.preventDefault();
      setActiveDropdown((prev) => (prev === name ? null : name));
    }
  }, [isDesktop]);

  const handleDropdownLinkClick = useCallback(() => {
    setActiveDropdown(null);
    setMobileOpen(false);
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
  }, []);

  const dropdowns = {
    programs: programRoutes,
    'how-it-works': ['/how-it-works', '/parent-progress'],
    about: ['/about', '/coaches', '/teach-with-us'],
    resources: ['/faq', '/student-showcase', '/referral', '/blog', '/crm-templates', '/crm-communication-center'],
  };

  const containerVariants = {
    hidden: isDesktop
      ? { opacity: 0, y: 14, x: '-50%', scale: 0.97, filter: 'blur(6px)' }
      : { height: 0, opacity: 0, y: -6 },
    visible: isDesktop
      ? {
          opacity: 1,
          y: 0,
          x: '-50%',
          scale: 1,
          filter: 'blur(0px)',
          transition: {
            type: 'spring' as const,
            stiffness: 360,
            damping: 30,
            mass: 0.7,
            staggerChildren: 0.04,
            delayChildren: 0.04,
          },
        }
      : {
          height: 'auto',
          opacity: 1,
          y: 0,
          transition: {
            duration: 0.28,
            ease: [0.16, 1, 0.3, 1] as any,
            staggerChildren: 0.035,
            delayChildren: 0.02,
          },
        },
    exit: isDesktop
      ? {
          opacity: 0,
          y: 10,
          x: '-50%',
          scale: 0.97,
          filter: 'blur(6px)',
          transition: { duration: 0.16, ease: 'easeIn' as any },
        }
      : {
          height: 0,
          opacity: 0,
          y: -6,
          transition: { duration: 0.2, ease: 'easeInOut' as any },
        },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 8 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: 'spring' as const,
        stiffness: 260,
        damping: 20,
      },
    },
  };

  return (
    <nav
      ref={navRef}
      className={`navbar${scrolled ? ' navbar-scrolled' : ''}`}
    >
      <div className="navbar-container container">
        <Link href="/" className="navbar-logo" aria-label="TrueLern Home">
          <img
            src="/TrueLernLogo_horizontal.png"
            alt="TrueLern"
            className="navbar-brand-img"
            style={{ height: "52px", width: "auto", objectFit: "contain" }}
          />
        </Link>

        <button
          className={`navbar-toggle${mobileOpen ? ' toggle-active' : ''}`}
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={mobileOpen}
        >
          <span className="bar" />
          <span className="bar" />
          <span className="bar" />
        </button>

        <div className={`navbar-menu-wrapper${mobileOpen ? ' menu-open' : ''}`}>
          <ul className="navbar-links">
            <li>
              <Link
                href="/"
                className={`navbar-item nav-link${pathname === '/' ? ' active' : ''}`}
              >
                Home
              </Link>
            </li>

            <li
              className={`navbar-item-dropdown${activeDropdown === 'programs' ? ' dropdown-active' : ''}`}
              onMouseEnter={() => handleMouseEnter('programs')}
              onMouseLeave={handleMouseLeave}
              onFocus={() => handleMouseEnter('programs')}
            >
              <Link
                href="/programs"
                className={`navbar-item nav-link dropdown-trigger${isProgramsActive ? ' active' : ''}`}
                onClick={(e) => handleDropdownTriggerClick(e, 'programs')}
              >
                Programs <ChevronDown className="arrow-icon" aria-hidden="true" />
              </Link>
              <AnimatePresence>
                {activeDropdown === 'programs' && (
                  <motion.ul
                    className="navbar-dropdown"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                  >
                    <motion.li variants={itemVariants}>
                      <Link href="/junior-foundation" className={`dropdown-link program-dropdown-item ${isActive("/junior-foundation") ? "active" : ""}`} onClick={handleDropdownLinkClick}>
                        <DropdownIcon Icon={Sprout} /> Junior Foundation
                      </Link>
                    </motion.li>
                    <motion.li variants={itemVariants}>
                      <Link href="/future-ready-builders" className={`dropdown-link program-dropdown-item ${isActive("/future-ready-builders") ? "active" : ""}`} onClick={handleDropdownLinkClick}>
                        <DropdownIcon Icon={Hammer} /> Future-Ready Builders
                      </Link>
                    </motion.li>
                    <motion.li variants={itemVariants}>
                      <Link href="/communication" className={`dropdown-link program-dropdown-item ${isActive("/communication") ? "active" : ""}`} onClick={handleDropdownLinkClick}>
                        <DropdownIcon Icon={MessageCircle} /> Communication &amp; Confidence
                      </Link>
                    </motion.li>
                    <motion.li variants={itemVariants}>
                      <Link href="/money-skills" className={`dropdown-link program-dropdown-item ${isActive("/money-skills") ? "active" : ""}`} onClick={handleDropdownLinkClick}>
                        <DropdownIcon Icon={Coins} /> Money Skills
                      </Link>
                    </motion.li>
                    <motion.li variants={itemVariants}>
                      <Link href="/emotional-intelligence" className={`dropdown-link program-dropdown-item ${isActive("/emotional-intelligence") ? "active" : ""}`} onClick={handleDropdownLinkClick}>
                        <DropdownIcon Icon={Brain} /> Emotional Intelligence
                      </Link>
                    </motion.li>
                    <motion.li variants={itemVariants}>
                      <Link href="/ai-readiness" className={`dropdown-link program-dropdown-item ${isActive("/ai-readiness") ? "active" : ""}`} onClick={handleDropdownLinkClick}>
                        <DropdownIcon Icon={Bot} /> AI Readiness
                      </Link>
                    </motion.li>
                    <motion.li variants={itemVariants}>
                      <Link href="/time-management" className={`dropdown-link program-dropdown-item ${isActive("/time-management") ? "active" : ""}`} onClick={handleDropdownLinkClick}>
                        <DropdownIcon Icon={Clock} /> Time Management &amp; Habits
                      </Link>
                    </motion.li>
                    <motion.li variants={itemVariants}>
                      <Link href="/practical-real-world-thinking" className={`dropdown-link program-dropdown-item ${isActive("/practical-real-world-thinking") ? "active" : ""}`} onClick={handleDropdownLinkClick}>
                        <DropdownIcon Icon={Puzzle} /> Practical Real-World Thinking
                      </Link>
                    </motion.li>
                  </motion.ul>
                )}
              </AnimatePresence>
            </li>

            <li
              className={`navbar-item-dropdown${activeDropdown === 'how-it-works' ? ' dropdown-active' : ''}`}
              onMouseEnter={() => handleMouseEnter('how-it-works')}
              onMouseLeave={handleMouseLeave}
              onFocus={() => handleMouseEnter('how-it-works')}
            >
              <Link
                href="/how-it-works"
                className={`navbar-item nav-link dropdown-trigger${isParentActive(dropdowns['how-it-works']) ? ' active' : ''}`}
                onClick={(e) => handleDropdownTriggerClick(e, 'how-it-works')}
              >
                How It Works <ChevronDown className="arrow-icon" aria-hidden="true" />
              </Link>
              <AnimatePresence>
                {activeDropdown === 'how-it-works' && (
                  <motion.ul
                    className="navbar-dropdown"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                  >
                    <motion.li variants={itemVariants}>
                      <Link href="/how-it-works" className={`dropdown-link ${isActive("/how-it-works") ? "active" : ""}`} onClick={handleDropdownLinkClick}>
                        <DropdownIcon Icon={Target} /> Learning Method
                      </Link>
                    </motion.li>
                    <motion.li variants={itemVariants}>
                      <Link href="/parent-progress" className={`dropdown-link ${isActive("/parent-progress") ? "active" : ""}`} onClick={handleDropdownLinkClick}>
                        <DropdownIcon Icon={TrendingUp} /> Parent Progress
                      </Link>
                    </motion.li>
                  </motion.ul>
                )}
              </AnimatePresence>
            </li>

            <li>
              <Link
                href="/pricing"
                className={`navbar-item nav-link${pathname === '/pricing' ? ' active' : ''}`}
              >
                Pricing
              </Link>
            </li>

            <li
              className={`navbar-item-dropdown${activeDropdown === 'about' ? ' dropdown-active' : ''}`}
              onMouseEnter={() => handleMouseEnter('about')}
              onMouseLeave={handleMouseLeave}
              onFocus={() => handleMouseEnter('about')}
            >
              <Link
                href="/about"
                className={`navbar-item nav-link dropdown-trigger${isParentActive(dropdowns.about) ? ' active' : ''}`}
                onClick={(e) => handleDropdownTriggerClick(e, 'about')}
              >
                About <ChevronDown className="arrow-icon" aria-hidden="true" />
              </Link>
              <AnimatePresence>
                {activeDropdown === 'about' && (
                  <motion.ul
                    className="navbar-dropdown"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                  >
                    <motion.li variants={itemVariants as any}>
                      <Link href="/coaches" className={`dropdown-link ${isActive("/coaches") ? "active" : ""}`} onClick={handleDropdownLinkClick}>
                        <DropdownIcon Icon={GraduationCap} /> Our Coaches
                      </Link>
                    </motion.li>
                    <motion.li variants={itemVariants as any}>
                      <Link href="/teach-with-us" className={`dropdown-link ${isActive("/teach-with-us") ? "active" : ""}`} onClick={handleDropdownLinkClick}>
                        <DropdownIcon Icon={UserRound} /> Teach With TrueLern
                      </Link>
                    </motion.li>
                  </motion.ul>
                )}
              </AnimatePresence>
            </li>

            <li
              className={`navbar-item-dropdown${activeDropdown === 'resources' ? ' dropdown-active' : ''}`}
              onMouseEnter={() => handleMouseEnter('resources')}
              onMouseLeave={handleMouseLeave}
              onFocus={() => handleMouseEnter('resources')}
            >
              <Link
                href="/faq"
                className={`navbar-item nav-link dropdown-trigger${isParentActive(dropdowns.resources) ? ' active' : ''}`}
                onClick={(e) => handleDropdownTriggerClick(e, 'resources')}
              >
                Resources <ChevronDown className="arrow-icon" aria-hidden="true" />
              </Link>
              <AnimatePresence>
                {activeDropdown === 'resources' && (
                  <motion.ul
                    className="navbar-dropdown resources-dropdown"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                  >
                    <motion.li variants={itemVariants as any}>
                      <Link href="/faq" className={`dropdown-link ${isActive("/faq") ? "active" : ""}`} onClick={handleDropdownLinkClick}>
                        <DropdownIcon Icon={CircleHelp} /> FAQs
                      </Link>
                    </motion.li>
                    <motion.li variants={itemVariants as any}>
                      <Link href="/student-showcase" className={`dropdown-link ${isActive("/student-showcase") ? "active" : ""}`} onClick={handleDropdownLinkClick}>
                        <DropdownIcon Icon={Rocket} /> Student Showcase
                      </Link>
                    </motion.li>
                    <motion.li variants={itemVariants as any}>
                      <Link href="/referral" className={`dropdown-link ${isActive("/referral") ? "active" : ""}`} onClick={handleDropdownLinkClick}>
                        <DropdownIcon Icon={Handshake} /> Referral Program
                      </Link>
                    </motion.li>
                  </motion.ul>
                )}
              </AnimatePresence>
            </li>

            <li>
              <Link
                href="/contact"
                className={`navbar-item nav-link${pathname === '/contact' ? ' active' : ''}`}
              >
                Contact
              </Link>
            </li>
          </ul>

          <div className="navbar-actions">
            {authUser ? (
              <div className="navbar-account-wrapper relative" ref={accountRef}>
                <button
                  type="button"
                  onClick={() => setAccountMenuOpen(!accountMenuOpen)}
                  className="navbar-login-link flex items-center gap-1.5 font-bold cursor-pointer"
                  aria-expanded={accountMenuOpen}
                >
                  <span className="bg-teal-100 text-teal-800 text-xs px-2 py-0.5 rounded-full font-semibold mr-1">
                    {authUser.role === 'parent'
                      ? 'Parent'
                      : authUser.role === 'student'
                      ? 'Student'
                      : authUser.role === 'admin'
                      ? 'Admin'
                      : 'Account'}
                  </span>
                  <span>{authUser.firstName || 'Account'}</span>
                  <ChevronDown
                    className={`w-4 h-4 transition-transform duration-200 ${
                      accountMenuOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                <AnimatePresence>
                  {accountMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 text-left"
                    >
                      <div className="px-4 py-2 border-b border-slate-100 mb-1">
                        <p className="text-xs text-slate-400 font-medium">Signed in as</p>
                        <p className="text-sm font-bold text-slate-800 truncate">{authUser.email}</p>
                      </div>

                      {authUser.role === 'parent' ? (
                        <>
                          <Link
                            href="/parent/dashboard"
                            className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition font-medium"
                            onClick={() => setAccountMenuOpen(false)}
                          >
                            <LayoutDashboard className="w-4 h-4 text-slate-400" /> Dashboard
                          </Link>
                          <Link
                            href="/parent/dashboard"
                            className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition font-medium"
                            onClick={() => setAccountMenuOpen(false)}
                          >
                            <Users className="w-4 h-4 text-slate-400" /> My Children
                          </Link>
                          <Link
                            href="/parent/dashboard"
                            className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition font-medium"
                            onClick={() => setAccountMenuOpen(false)}
                          >
                            <User className="w-4 h-4 text-slate-400" /> Profile
                          </Link>
                          <Link
                            href="/parent/dashboard"
                            className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition font-medium"
                            onClick={() => setAccountMenuOpen(false)}
                          >
                            <Settings className="w-4 h-4 text-slate-400" /> Settings
                          </Link>
                        </>
                      ) : authUser.role === 'student' ? (
                        <Link
                          href="/student/dashboard"
                          className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition font-medium"
                          onClick={() => setAccountMenuOpen(false)}
                        >
                          <LayoutDashboard className="w-4 h-4 text-slate-400" /> Dashboard
                        </Link>
                      ) : (
                        <Link
                          href={authUser.role === 'admin' ? '/admin' : '/teacher/dashboard'}
                          className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition font-medium"
                          onClick={() => setAccountMenuOpen(false)}
                        >
                          <LayoutDashboard className="w-4 h-4 text-slate-400" /> Dashboard
                        </Link>
                      )}

                      <div className="border-t border-slate-100 mt-1 pt-1">
                        <button
                          type="button"
                          onClick={handleLogout}
                          className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 transition font-medium text-left cursor-pointer"
                        >
                          <LogOut className="w-4 h-4 text-rose-500" /> Logout
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <Link href="/login" className="navbar-login-link">
                Login
              </Link>
            )}

            <Link
              href={
                authUser?.role === 'parent'
                  ? '/parent/demo'
                  : authUser?.role === 'student'
                  ? '/student/dashboard'
                  : authUser?.role === 'admin'
                  ? '/admin'
                  : '/book-demo'
              }
              className="navbar-cta"
            >
              Book Free Demo
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};
