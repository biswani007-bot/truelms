import React from 'react';

interface WaveSeparatorProps {
  color?: string;
  direction?: 'top' | 'bottom';
  flip?: boolean;
}

export const WaveSeparator = ({ color = '#ffffff', direction = 'bottom', flip = false }: WaveSeparatorProps) => {
  const transform = `${direction === 'top' ? 'rotate(180deg)' : ''} ${flip ? 'scaleX(-1)' : ''}`.trim();

  return (
    <div 
      className="wave-separator" 
      style={{ 
        transform: transform || undefined,
        color: color
      }}
      aria-hidden="true"
    >
      <svg 
        viewBox="0 0 1440 120" 
        preserveAspectRatio="none" 
        fill="currentColor"
      >
        <path d="M0,32L80,48C160,64,320,96,480,96C640,96,800,64,960,53.3C1120,43,1280,53,1360,58.7L1440,64L1440,120L1360,120C1280,120,1120,120,960,120C800,120,640,120,480,120C320,120,160,120,80,120L0,120Z"></path>
      </svg>
    </div>
  );
};
