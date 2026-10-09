"use client";

import React, { useState, useEffect, useRef } from "react";
import { Search, ChevronDown, Check, BookOpen, Clock, Tag, Sparkles, X } from "lucide-react";

export interface ICatalogCourse {
  _id: string;
  courseCode: string;
  courseName: string;
  slug: string;
  shortDescription: string;
  category: {
    _id: string;
    name: string;
    slug: string;
  } | null;
  level: "beginner" | "intermediate" | "advanced";
  duration: number;
  durationUnit: "weeks" | "months" | "hours";
  deliveryMode: string;
  pricing: {
    price: number;
    discountPrice?: number;
    currency: string;
    displayPrice: number;
  };
  cohortsCount: number;
  openCohortsCount: number;
  featured?: boolean;
}

export interface ICatalogCategory {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  courseCount: number;
}

interface CourseSelectorProps {
  selectedCourseSlug: string;
  onSelectCourse: (course: ICatalogCourse) => void;
  onClearCourse: () => void;
}

export function CourseSelector({
  selectedCourseSlug,
  onSelectCourse,
  onClearCourse,
}: CourseSelectorProps) {
  const [courses, setCourses] = useState<ICatalogCourse[]>([]);
  const [categories, setCategories] = useState<ICatalogCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState<ICatalogCourse | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // 1. Fetch initial catalog and categories
  useEffect(() => {
    let isMounted = true;
    async function loadCatalog() {
      try {
        setLoading(true);
        const [coursesRes, categoriesRes] = await Promise.all([
          fetch("/api/public/courses"),
          fetch("/api/public/categories"),
        ]);

        const coursesData = await coursesRes.json();
        const categoriesData = await categoriesRes.json();

        if (isMounted) {
          if (coursesData.success && Array.isArray(coursesData.data)) {
            setCourses(coursesData.data);
          }
          if (categoriesData.success && Array.isArray(categoriesData.data)) {
            setCategories(categoriesData.data);
          }
        }
      } catch (err) {
        console.error("Failed to load course catalog", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadCatalog();
    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Sync selected course from slug prop
  useEffect(() => {
    if (courses.length > 0 && selectedCourseSlug) {
      const match = courses.find((c) => c.slug === selectedCourseSlug);
      if (match) {
        setSelectedCourse(match);
      }
    } else if (!selectedCourseSlug) {
      setSelectedCourse(null);
    }
  }, [courses, selectedCourseSlug]);

  // 3. Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 4. Focus search input when opening
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Filter courses based on category and search query
  const filteredCourses = courses.filter((course) => {
    const matchesCategory =
      selectedCategory === "all" ||
      course.category?.slug === selectedCategory;

    const query = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !query ||
      course.courseName.toLowerCase().includes(query) ||
      course.courseCode.toLowerCase().includes(query) ||
      course.shortDescription.toLowerCase().includes(query) ||
      (course.category?.name && course.category.name.toLowerCase().includes(query));

    return matchesCategory && matchesSearch;
  });

  const handleCourseClick = (course: ICatalogCourse) => {
    setSelectedCourse(course);
    onSelectCourse(course);
    setIsOpen(false);
    setSearchQuery("");
  };

  const handleClearSelection = () => {
    setSelectedCourse(null);
    onClearCourse();
    setIsOpen(true);
  };

  const formatCurrency = (amount?: number, currency: string = "USD") => {
    if (amount === undefined || amount === null) return "$0";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div ref={containerRef} className="relative w-full space-y-3">
      <div className="flex items-center justify-between">
        <label
          id="course-selector-label"
          className="block text-xs font-semibold text-gray-700 uppercase tracking-wider"
        >
          Select Program / Course <span className="text-rose-500">*</span>
        </label>
        {selectedCourse && (
          <button
            type="button"
            onClick={handleClearSelection}
            className="text-xs font-medium text-indigo-600 hover:text-indigo-800 transition"
          >
            Change Course
          </button>
        )}
      </div>

      {/* Selected Course Card Mode */}
      {selectedCourse && !isOpen ? (
        <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-50/70 via-white to-violet-50/50 border-2 border-indigo-200 shadow-sm relative transition-all duration-200 hover:shadow-md">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800">
                  <Tag className="w-3 h-3" />
                  {selectedCourse.category?.name || "Professional"}
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                  <Clock className="w-3 h-3" />
                  {selectedCourse.duration} {selectedCourse.durationUnit}
                </span>
                <span className="px-2 py-0.5 rounded-md text-[11px] font-mono text-gray-500 bg-gray-100 uppercase">
                  {selectedCourse.courseCode}
                </span>
              </div>

              <h3 className="text-lg font-bold text-gray-900 truncate">
                {selectedCourse.courseName}
              </h3>
              <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                {selectedCourse.shortDescription}
              </p>
            </div>

            <div className="flex items-center md:flex-col md:items-end justify-between border-t md:border-t-0 pt-3 md:pt-0 border-gray-100 shrink-0">
              <div className="text-left md:text-right">
                <span className="block text-[11px] text-gray-400 font-medium uppercase tracking-wider">
                  Tuition Fee
                </span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xl font-black text-gray-900">
                    {formatCurrency(
                      selectedCourse.pricing.discountPrice || selectedCourse.pricing.price,
                      selectedCourse.pricing.currency
                    )}
                  </span>
                  {selectedCourse.pricing.discountPrice &&
                    selectedCourse.pricing.discountPrice < selectedCourse.pricing.price && (
                      <span className="text-xs text-gray-400 line-through">
                        {formatCurrency(selectedCourse.pricing.price, selectedCourse.pricing.currency)}
                      </span>
                    )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(true)}
                className="mt-2 text-xs font-semibold px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 transition shadow-2xs"
              >
                Change
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Selector Trigger Button */
        <div className="relative">
          <button
            type="button"
            aria-haspopup="listbox"
            aria-expanded={isOpen}
            aria-labelledby="course-selector-label"
            onClick={() => setIsOpen((prev) => !prev)}
            className={`w-full text-left px-4 py-3.5 rounded-xl border bg-white text-sm transition flex items-center justify-between shadow-2xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${
              isOpen
                ? "border-indigo-500 ring-2 ring-indigo-500/20"
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <span className={selectedCourse ? "font-semibold text-gray-900" : "text-gray-400"}>
              {selectedCourse
                ? `${selectedCourse.courseName} (${selectedCourse.courseCode})`
                : loading
                ? "Loading available programs..."
                : "Select your program / course..."}
            </span>
            <ChevronDown
              className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
                isOpen ? "rotate-180 text-indigo-600" : ""
              }`}
            />
          </button>

          {/* Searchable Dropdown Modal/Popover */}
          {isOpen && (
            <div className="absolute z-50 left-0 right-0 top-full mt-2 bg-white rounded-2xl border border-gray-200 shadow-2xl overflow-hidden transition-all duration-200 animate-in fade-in zoom-in-95">
              {/* Filter Tabs & Search Header */}
              <div className="p-3 border-b border-gray-100 bg-gray-50/70 space-y-2.5">
                {/* Search Bar */}
                <div className="relative">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by course title, code, or keyword..."
                    className="w-full pl-10 pr-9 py-2 rounded-xl bg-white border border-gray-200 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Category Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
                  <button
                    type="button"
                    onClick={() => setSelectedCategory("all")}
                    className={`px-3 py-1 rounded-lg font-medium whitespace-nowrap transition ${
                      selectedCategory === "all"
                        ? "bg-indigo-600 text-white shadow-2xs"
                        : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    All Domains ({courses.length})
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat._id}
                      type="button"
                      onClick={() => setSelectedCategory(cat.slug)}
                      className={`px-3 py-1 rounded-lg font-medium whitespace-nowrap transition ${
                        selectedCategory === cat.slug
                          ? "bg-indigo-600 text-white shadow-2xs"
                          : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      {cat.name} {cat.courseCount ? `(${cat.courseCount})` : ""}
                    </button>
                  ))}
                </div>
              </div>

              {/* Course Options List */}
              <div className="max-h-72 overflow-y-auto p-2 divide-y divide-gray-50">
                {loading ? (
                  <div className="py-8 text-center text-xs text-gray-400">
                    Loading authoritative course catalog...
                  </div>
                ) : filteredCourses.length === 0 ? (
                  <div className="py-8 text-center space-y-1">
                    <p className="text-xs font-semibold text-gray-600">No matching programs found</p>
                    <p className="text-[11px] text-gray-400">
                      Try adjusting your search query or domain filter
                    </p>
                  </div>
                ) : (
                  filteredCourses.map((course) => {
                    const isSelected = selectedCourse?._id === course._id;
                    return (
                      <div
                        key={course._id}
                        role="button"
                        tabIndex={0}
                        onClick={() => handleCourseClick(course)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            handleCourseClick(course);
                          }
                        }}
                        className={`p-3 rounded-xl cursor-pointer transition flex items-center justify-between gap-3 text-left focus:outline-none focus:bg-indigo-50 ${
                          isSelected
                            ? "bg-indigo-50/80 border border-indigo-200"
                            : "hover:bg-gray-50 border border-transparent"
                        }`}
                      >
                        <div className="space-y-1 min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 font-mono">
                              {course.courseCode}
                            </span>
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700">
                              {course.category?.name || "Professional"}
                            </span>
                            <span className="text-[10px] font-medium text-gray-400">
                              • {course.duration} {course.durationUnit}
                            </span>
                          </div>
                          <h4 className="text-xs md:text-sm font-bold text-gray-900 leading-snug">
                            {course.courseName}
                          </h4>
                          <p className="text-[11px] text-gray-500 line-clamp-1">
                            {course.shortDescription}
                          </p>
                        </div>

                        <div className="text-right shrink-0 flex items-center gap-3">
                          <div>
                            <span className="text-xs md:text-sm font-black text-gray-900">
                              {formatCurrency(
                                course.pricing.discountPrice || course.pricing.price,
                                course.pricing.currency
                              )}
                            </span>
                            {course.pricing.discountPrice &&
                              course.pricing.discountPrice < course.pricing.price && (
                                <span className="block text-[10px] text-gray-400 line-through">
                                  {formatCurrency(course.pricing.price, course.pricing.currency)}
                                </span>
                              )}
                          </div>
                          <div
                            className={`w-5 h-5 rounded-full flex items-center justify-center transition ${
                              isSelected
                                ? "bg-indigo-600 text-white"
                                : "border border-gray-200 text-transparent group-hover:border-gray-300"
                            }`}
                          >
                            <Check className="w-3 h-3" />
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Footer */}
              <div className="px-4 py-2.5 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500">
                <span>
                  Showing <strong>{filteredCourses.length}</strong> of{" "}
                  <strong>{courses.length}</strong> active programs
                </span>
                <span className="text-indigo-600 font-medium">TrueLern Accredited Cohorts</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
