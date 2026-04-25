import React from "react";

/** SVG Spinning Compass — calibrateSpin animation lives in index.css */
export const SpinningCompass = ({ size = 36, className = "" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 64 64"
    className={className}
    role="img"
    aria-label="Student Compass"
    data-testid="spinning-compass"
  >
    <defs>
      <linearGradient id="compassRim" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#003366" />
        <stop offset="100%" stopColor="#001a33" />
      </linearGradient>
      <linearGradient id="needleN" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#F1B521" />
        <stop offset="100%" stopColor="#D9A01B" />
      </linearGradient>
    </defs>

    {/* Outer ring */}
    <circle cx="32" cy="32" r="29" fill="white" stroke="url(#compassRim)" strokeWidth="3" />

    {/* Tick marks */}
    {Array.from({ length: 16 }).map((_, i) => {
      const angle = (i * 360) / 16;
      const long = i % 4 === 0;
      return (
        <line
          key={i}
          x1="32"
          y1={long ? 5 : 7}
          x2="32"
          y2={long ? 10 : 9}
          stroke={long ? "#003366" : "#94a3b8"}
          strokeWidth={long ? 1.4 : 0.8}
          transform={`rotate(${angle} 32 32)`}
        />
      );
    })}

    {/* Cardinal letters */}
    <text x="32" y="16" textAnchor="middle" fontSize="6" fontFamily="Manrope" fontWeight="700" fill="#003366">N</text>
    <text x="32" y="53" textAnchor="middle" fontSize="5" fontFamily="Manrope" fontWeight="600" fill="#94a3b8">S</text>
    <text x="51" y="34" textAnchor="middle" fontSize="5" fontFamily="Manrope" fontWeight="600" fill="#94a3b8">E</text>
    <text x="13" y="34" textAnchor="middle" fontSize="5" fontFamily="Manrope" fontWeight="600" fill="#94a3b8">W</text>

    {/* Needle (animated via .compass-needle) */}
    <g className="compass-needle">
      <polygon points="32,10 28,32 36,32" fill="url(#needleN)" />
      <polygon points="32,54 28,32 36,32" fill="#cbd5e1" />
      <circle cx="32" cy="32" r="2.6" fill="#003366" />
      <circle cx="32" cy="32" r="1" fill="#F1B521" />
    </g>
  </svg>
);

export default SpinningCompass;
