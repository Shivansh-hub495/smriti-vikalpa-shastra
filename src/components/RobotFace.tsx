import React from 'react';

interface RobotFaceProps {
  expression?: 'happy' | 'thinking' | 'neutral' | 'winking' | 'surprised';
  className?: string;
}

const RobotFace: React.FC<RobotFaceProps> = ({ expression = 'neutral', className = '' }) => {
  const getExpressionPath = () => {
    switch (expression) {
      case 'happy':
        return (
          <>
            {/* Eyes - happy */}
            <circle cx="35" cy="35" r="3" fill="currentColor" />
            <circle cx="65" cy="35" r="3" fill="currentColor" />
            {/* Mouth - smile */}
            <path d="M 30 55 Q 50 65 70 55" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" />
          </>
        );
      case 'thinking':
        return (
          <>
            {/* Eyes - looking up */}
            <circle cx="35" cy="30" r="3" fill="currentColor" />
            <circle cx="65" cy="30" r="3" fill="currentColor" />
            {/* Mouth - thinking */}
            <path d="M 35 55 L 65 55" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
            {/* Thinking dots */}
            <circle cx="75" cy="20" r="2" fill="currentColor" opacity="0.6" />
            <circle cx="80" cy="15" r="2" fill="currentColor" opacity="0.8" />
            <circle cx="85" cy="10" r="2" fill="currentColor" />
          </>
        );
      case 'winking':
        return (
          <>
            {/* Eyes - one winking */}
            <path d="M 30 35 L 40 35" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
            <circle cx="65" cy="35" r="3" fill="currentColor" />
            {/* Mouth - smile */}
            <path d="M 30 55 Q 50 65 70 55" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" />
          </>
        );
      case 'surprised':
        return (
          <>
            {/* Eyes - wide */}
            <circle cx="35" cy="35" r="5" fill="currentColor" />
            <circle cx="65" cy="35" r="5" fill="currentColor" />
            {/* Mouth - O shape */}
            <circle cx="50" cy="60" r="8" fill="none" stroke="currentColor" strokeWidth="3" />
          </>
        );
      case 'neutral':
      default:
        return (
          <>
            {/* Eyes - normal */}
            <circle cx="35" cy="35" r="3" fill="currentColor" />
            <circle cx="65" cy="35" r="3" fill="currentColor" />
            {/* Mouth - neutral */}
            <path d="M 35 55 L 65 55" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          </>
        );
    }
  };

  return (
    <svg
      viewBox="0 0 100 100"
      className={`${className}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Robot head outline */}
      <rect
        x="15"
        y="15"
        width="70"
        height="70"
        rx="15"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
      />
      
      {/* Antenna */}
      <line x1="50" y1="15" x2="50" y2="5" stroke="currentColor" strokeWidth="3" />
      <circle cx="50" cy="5" r="3" fill="currentColor" />
      
      {/* Expression */}
      {getExpressionPath()}
      
      {/* Ears */}
      <rect x="10" y="40" width="5" height="20" rx="2" fill="currentColor" />
      <rect x="85" y="40" width="5" height="20" rx="2" fill="currentColor" />
    </svg>
  );
};

export default RobotFace;