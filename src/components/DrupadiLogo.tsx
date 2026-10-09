import React from "react";

interface DrupadiLogoProps {
  layout?: "stacked" | "horizontal";
  className?: string;
  glowColor?: string;
}

export function DrupadiLogo({ layout = "stacked", className = "", glowColor = "rgba(255, 85, 0, 0.6)" }: DrupadiLogoProps) {
  // SVG Letter Definitions - meticulously drawn for high-tech stenciled futuristic style (like DRUPADI)
  const renderA = (strokeWidth = 9.5) => (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      {/* Outer Triangle A */}
      <path
        d="M 15,90 L 50,10 L 85,90"
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="square"
        strokeLinejoin="miter"
      />
      {/* Stenciled/Floating Crossbar */}
      <path
        d="M 33,55 L 56,55"
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="square"
        strokeLinejoin="miter"
      />
    </svg>
  );

  const renderL = (strokeWidth = 9.5) => (
    <svg viewBox="0 0 90 100" className="w-full h-full">
      {/* L Shape */}
      <path
        d="M 25,10 L 25,90 L 75,90"
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="square"
        strokeLinejoin="miter"
      />
    </svg>
  );

  const renderE = (strokeWidth = 9.5) => (
    <svg viewBox="0 0 90 100" className="w-full h-full">
      {/* Back spine */}
      <path
        d="M 25,10 L 25,90"
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="square"
        strokeLinejoin="miter"
      />
      {/* Top horizontal */}
      <path
        d="M 25,10 L 75,10"
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="square"
        strokeLinejoin="miter"
      />
      {/* Bottom horizontal */}
      <path
        d="M 25,90 L 75,90"
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="square"
        strokeLinejoin="miter"
      />
      {/* Stenciled Floating Middle bar */}
      <path
        d="M 39,50 L 68,50"
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="square"
        strokeLinejoin="miter"
      />
    </svg>
  );

  const renderM = (strokeWidth = 9.5) => (
    <svg viewBox="0 0 110 100" className="w-full h-full">
      {/* Left stem */}
      <path
        d="M 20,90 L 20,10"
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="square"
        strokeLinejoin="miter"
      />
      {/* High-tech Inner V */}
      <path
        d="M 20,10 L 55,55 L 90,10"
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="square"
        strokeLinejoin="miter"
      />
      {/* Right stem */}
      <path
        d="M 90,10 L 90,90"
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="square"
        strokeLinejoin="miter"
      />
    </svg>
  );

  const renderD = (strokeWidth = 9.5) => (
    <svg viewBox="0 0 95 100" className="w-full h-full">
      {/* Back Spine */}
      <path
        d="M 25,10 L 25,90"
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="square"
        strokeLinejoin="miter"
      />
      {/* Stenciled Curved Loop with precise gap from spine */}
      <path
        d="M 37,10 L 52,10 C 75,10 85,25 85,50 C 85,75 75,90 52,90 L 37,90"
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="square"
        strokeLinejoin="miter"
      />
    </svg>
  );

  if (layout === "stacked") {
    return (
      <div 
        className={`flex flex-col items-center select-none ${className}`}
        style={{
          filter: `drop-shadow(0 0 15px ${glowColor})`
        }}
      >
        {/* ROW 1: ALE */}
        <div className="flex justify-center items-center gap-[4%] w-full max-w-[280px] sm:max-w-[420px] md:max-w-[480px]">
          <div className="w-[30%] aspect-square text-glow">{renderA(8)}</div>
          <div className="w-[27%] aspect-square text-glow">{renderL(8)}</div>
          <div className="w-[27%] aspect-square text-glow">{renderE(8)}</div>
        </div>

        {/* Spacer */}
        <div className="h-4 sm:h-8" />

        {/* ROW 2: ALMADA */}
        <div className="flex justify-center items-center gap-[2%] w-full max-w-[420px] sm:max-w-[640px] md:max-w-[720px]">
          <div className="w-[15%] aspect-square text-glow">{renderA(8.5)}</div>
          <div className="w-[13.5%] aspect-square text-glow">{renderL(8.5)}</div>
          <div className="w-[16.5%] aspect-square text-glow">{renderM(8.5)}</div>
          <div className="w-[15%] aspect-square text-glow">{renderA(8.5)}</div>
          <div className="w-[14.25%] aspect-square text-glow">{renderD(8.5)}</div>
          <div className="w-[15%] aspect-square text-glow">{renderA(8.5)}</div>
        </div>
      </div>
    );
  }

  // Horizontal layout for Header / Navbars
  return (
    <div 
      className={`flex items-center justify-start select-none ${className}`}
      style={{
        filter: `drop-shadow(0 0 8px ${glowColor})`
      }}
    >
      {/* ALE */}
      <div className="flex items-center gap-[4px] h-[24px] sm:h-[32px] md:h-[38px]">
        <div className="h-full aspect-square text-glow">{renderA(9)}</div>
        <div className="h-full aspect-[0.9] text-glow">{renderL(9)}</div>
        <div className="h-full aspect-[0.9] text-glow">{renderE(9)}</div>
      </div>

      {/* Spacing gap between words */}
      <div className="w-3 sm:w-5" />

      {/* ALMADA */}
      <div className="flex items-center gap-[4px] h-[24px] sm:h-[32px] md:h-[38px]">
        <div className="h-full aspect-square text-glow">{renderA(9.5)}</div>
        <div className="h-full aspect-[0.9] text-glow">{renderL(9.5)}</div>
        <div className="h-full aspect-[1.1] text-glow">{renderM(9.5)}</div>
        <div className="h-full aspect-square text-glow">{renderA(9.5)}</div>
        <div className="h-full aspect-[0.95] text-glow">{renderD(9.5)}</div>
        <div className="h-full aspect-square text-glow">{renderA(9.5)}</div>
      </div>
    </div>
  );
}
