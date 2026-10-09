"use client";

import { useState, useEffect } from "react";

export function usePersonalization() {
  const [savedCourses, setSavedCourses] = useState<string[]>([]);
  const [recentlyViewed, setRecentlyViewed] = useState<string[]>([]);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("lmsca_saved_courses") || "[]");
      const viewed = JSON.parse(localStorage.getItem("lmsca_recently_viewed") || "[]");
      setSavedCourses(saved);
      setRecentlyViewed(viewed);
    } catch {
      // Ignore JSON parse errors in SSR/localStorage
    }
  }, []);

  const toggleSaveCourse = (courseId: string) => {
    const next = savedCourses.includes(courseId)
      ? savedCourses.filter((id) => id !== courseId)
      : [...savedCourses, courseId];
    setSavedCourses(next);
    localStorage.setItem("lmsca_saved_courses", JSON.stringify(next));
  };

  const trackViewedCourse = (courseId: string) => {
    const next = [courseId, ...recentlyViewed.filter((id) => id !== courseId)].slice(0, 10);
    setRecentlyViewed(next);
    localStorage.setItem("lmsca_recently_viewed", JSON.stringify(next));
  };

  return { savedCourses, recentlyViewed, toggleSaveCourse, trackViewedCourse };
}
