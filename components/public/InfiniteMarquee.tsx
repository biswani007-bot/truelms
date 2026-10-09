// @ts-nocheck
"use client";

import React, { useRef, useEffect } from "react";

interface InfiniteMarqueeProps {
  items: string[];
  /** Speed in pixels-per-second. Default 60. */
  speed?: number;
  /** Direction of scroll. Default "left". */
  direction?: "left" | "right";
  className?: string;
  itemClassName?: string;
  /** Gap between items in px. Default 40. */
  gap?: number;
  /** Pause animation on hover. Default true. */
  pauseOnHover?: boolean;
}

/**
 * InfiniteMarquee — a seamless infinite scrolling ticker.
 *
 * Uses CSS animation with duplicated content for a zero-jump infinite loop.
 * Respects prefers-reduced-motion.
 */
export function InfiniteMarquee({
  items,
  speed = 60,
  direction = "left",
  className = "",
  itemClassName = "",
  gap = 40,
  pauseOnHover = true,
}: InfiniteMarqueeProps) {
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    // Measure the width of a single content set so we know when to loop
    const firstChild = track.querySelector(".marquee-content-set") as HTMLElement | null;
    if (!firstChild) return;

    const setWidth = firstChild.scrollWidth + gap;
    // Duration = distance / speed
    const duration = setWidth / speed;

    const translate = direction === "left" ? `-${setWidth}px` : `${setWidth}px`;
    track.style.setProperty("--marquee-translate", translate);
    track.style.setProperty("--marquee-duration", `${duration}s`);
  }, [items, speed, direction, gap]);

  // Duplicate items for seamless loop
  const renderSet = (key: string) => (
    <div
      key={key}
      className="marquee-content-set"
      style={{ display: "flex", alignItems: "center", gap: `${gap}px`, flexShrink: 0 }}
    >
      {items.map((item, i) => (
        <span key={i} className={`marquee-item ${itemClassName}`}>
          {item}
        </span>
      ))}
    </div>
  );

  return (
    <div
      className={`marquee-wrapper ${className}`}
      style={{
        overflow: "hidden",
        width: "100%",
        position: "relative",
      }}
    >
      <div
        ref={trackRef}
        className="marquee-track"
        style={{
          display: "flex",
          alignItems: "center",
          gap: `${gap}px`,
          willChange: "transform",
          // Pause on hover handled via CSS class
        }}
        data-pause-on-hover={pauseOnHover ? "true" : "false"}
      >
        {/* Render 6 sets — guaranteed to be more than enough for any ultra-wide screen */}
        {renderSet("a")}
        {renderSet("b")}
        {renderSet("c")}
        {renderSet("d")}
        {renderSet("e")}
        {renderSet("f")}
      </div>
    </div>
  );
}
