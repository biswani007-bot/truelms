import React, { useMemo } from 'react';

const SHAPES = [
  <svg key="star" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>,
  <svg key="rocket" viewBox="0 0 24 24" fill="currentColor"><path d="M9.19 6.35c-2.04 2.29-3.44 5.58-3.19 9.65.93.34 1.96.5 3 .5s2.07-.16 3-.5c.25-4.07-1.15-7.36-3.19-9.65zM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/></svg>,
  <svg key="bulb" viewBox="0 0 24 24" fill="currentColor"><path d="M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7z"/></svg>,
  <svg key="book" viewBox="0 0 24 24" fill="currentColor"><path d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 4h5v8l-2.5-1.5L6 12V4z"/></svg>,
  <svg key="trophy" viewBox="0 0 24 24" fill="currentColor"><path d="M19 5h-2V3H7v2H5C3.9 5 3 5.9 3 7v1c0 2.55 1.92 4.63 4.39 4.94.63 1.5 1.98 2.63 3.61 2.96V19H7v2h10v-2h-4v-3.1c1.63-.33 2.98-1.46 3.61-2.96C19.08 12.63 21 10.55 21 8V7c0-1.1-.9-2-2-2zM5 8V7h2v3.82C5.84 10.4 5 9.3 5 8zm14 0c0 1.3-.84 2.4-2 2.82V7h2v1z"/></svg>,
  <svg key="speech" viewBox="0 0 24 24" fill="currentColor"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>,
  <svg key="heart" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>,
  <svg key="puzzle" viewBox="0 0 24 24" fill="currentColor"><path d="M20.5 11H19V7c0-1.1-.9-2-2-2h-4V3.5C13 2.12 11.88 1 10.5 1S8 2.12 8 3.5V5H4c-1.1 0-1.99.9-1.99 2v3.8H3.5c1.49 0 2.7 1.21 2.7 2.7s-1.21 2.7-2.7 2.7H2V19c0 1.1.9 2 2 2h3.8v-1.5c0-1.49 1.21-2.7 2.7-2.7s2.7 1.21 2.7 2.7V21H17c1.1 0 2-.9 2-2v-4h1.5c1.38 0 2.5-1.12 2.5-2.5S21.88 11 20.5 11z"/></svg>,
  <svg key="atom" viewBox="0 0 24 24" fill="currentColor"><path d="M12 11c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0-9C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/></svg>,
  <svg key="music" viewBox="0 0 24 24" fill="currentColor"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>,
];

const FLOAT_CLASSES = ['float-animation', 'float-slow', 'float-reverse', 'bob-animation'];
const COLORS = [
  '#6C63FF', '#FF6B35', '#10B981', '#38BDF8', '#EC4899',
  '#F59E0B', '#8B5CF6', '#06B6D4', '#F97316', '#14B8A6',
];

export const FloatingDecorations = ({ count = 8 }: { count?: number }) => {
  const items = useMemo(() => {
    return Array.from({ length: count }).map((_, i) => ({
      shape: SHAPES[i % SHAPES.length],
      floatClass: FLOAT_CLASSES[i % FLOAT_CLASSES.length],
      color: COLORS[i % COLORS.length],
      size: 22 + (i % 3) * 10,
      top:  `${8 + (i * 88 / count)}%`,
      left: `${(i % 2 === 0 ? 2 : 88) + (i % 4) * 3}%`,
      delay: `${i * 0.45}s`,
      opacity: 0.55 + (i % 3) * 0.1,
    }));
  }, [count]);

  return (
    <div className="floating-decorations-container" aria-hidden="true">
      {items.map((item, i) => (
        <div
          key={i}
          className={`floating-decor-item ${item.floatClass}`}
          style={{
            top: item.top,
            left: item.left,
            width: item.size,
            height: item.size,
            color: item.color,
            opacity: item.opacity,
            animationDelay: item.delay,
            filter: `drop-shadow(0 4px 8px ${item.color}44)`,
          }}
        >
          {item.shape}
        </div>
      ))}
    </div>
  );
};
