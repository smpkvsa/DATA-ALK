import React from 'react';

interface CoopLogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
}

export default function CoopLogo({ className = '', size = 120, showText = true }: CoopLogoProps) {
  // If the size is too small, we disable the text to avoid rendering messy, overlapping micro-pixels.
  // This ensures the logo always looks pristine and razor-sharp.
  const displayCurvedText = showText && size >= 75;

  // Real Logo Color Palette - Solid colors to prevent SPA url(#gradient) breakages
  const colors = {
    redBorder: '#ED1C24',       // Vibrant Red outer ring
    purpleBg: '#6F3294',        // Beautiful deep violet-purple background
    yellowGold: '#FFF200',      // Pure golden yellow for silhouettes
    ribbonBlue: '#2E3192',      // Deep royal navy blue for the ribbon
    ribbonDarkBlue: '#1B1464',  // Darker shade for ribbon folds
    white: '#FFFFFF',
  };

  return (
    <div 
      className={`flex items-center justify-center shrink-0 ${className}`} 
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 500 500"
        className="w-full h-full select-none overflow-visible"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* 
            MATHEMATICALLY PERFECT CONCENTRIC TEXT PATH
            Calculated with Bezier formula to align precisely in the middle of the ribbon arc (y-peak = 430)
          */}
          <path
            id="coopRibbonTextPath"
            d="M 82,327 C 125,464 375,464 418,327"
            fill="none"
          />
        </defs>

        {/* 1. Red Outer Circle Boundary */}
        <circle cx="250" cy="225" r="195" fill={colors.redBorder} />

        {/* 2. Inner Purple Background Circle */}
        <circle cx="250" cy="225" r="185" fill={colors.purpleBg} />

        {/* 3. Golden Silhouette Figures (5 People / Pen-nib hybrid) */}
        <g fill={colors.yellowGold}>
          {/* Silhouette Heads */}
          {/* Far Left Head */}
          <circle cx="145" cy="182" r="17" />
          {/* Mid Left Head */}
          <circle cx="188" cy="133" r="19" />
          {/* Center Main Head */}
          <circle cx="250" cy="118" r="23" />
          {/* Mid Right Head */}
          <circle cx="312" cy="133" r="19" />
          {/* Far Right Head */}
          <circle cx="355" cy="182" r="17" />

          {/* Center Main Figure & Pen-Nib Body */}
          <path d="
            M 250,365 
            C 230,320 205,250 205,195 
            C 205,185 215,165 250,165 
            C 285,165 295,185 295,195 
            C 295,250 270,320 250,365 Z
          " />

          {/* Mid-Left Figure Body */}
          <path d="
            M 205,195
            C 180,205 170,220 120,210
            C 115,225 125,245 155,285
            C 175,315 210,345 230,355
            C 215,310 200,240 205,195 Z
          " />

          {/* Mid-Right Figure Body */}
          <path d="
            M 295,195
            C 320,205 330,220 380,210
            C 385,225 375,245 345,285
            C 325,315 290,345 270,355
            C 285,310 300,240 295,195 Z
          " />

          {/* Far-Left Figure Body */}
          <path d="
            M 175,200
            C 155,202 140,210 115,220
            C 110,230 115,250 140,290
            C 155,315 178,335 190,343
            C 182,305 175,245 175,200 Z
          " />

          {/* Far-Right Figure Body */}
          <path d="
            M 325,200
            C 345,202 360,210 385,220
            C 390,230 385,250 360,290
            C 345,315 322,335 310,343
            C 318,305 325,245 325,200 Z
          " />
        </g>

        {/* 4. Pen Nib Features (Hole & Slit in center) */}
        {/* Filled with the matching background solid purple to achieve perfect mask effect */}
        <circle cx="250" cy="248" r="10" fill={colors.purpleBg} />
        <line 
          x1="250" 
          y1="258" 
          x2="250" 
          y2="355" 
          stroke={colors.purpleBg} 
          strokeWidth="5.5" 
          strokeLinecap="round" 
        />

        {/* 5. Left Ribbon Tail Wing (Background Layer) */}
        <path
          d="M 87,319 L 40,310 C 20,290 10,250 15,230 L 30,260 L 10,285 C 15,310 30,325 57,337 Z"
          fill={colors.ribbonDarkBlue}
          stroke={colors.ribbonDarkBlue}
          strokeWidth="1.5"
        />

        {/* Right Ribbon Tail Wing (Background Layer) */}
        <path
          d="M 413,319 L 460,310 C 480,290 490,250 485,230 L 470,260 L 490,285 C 485,310 470,325 443,337 Z"
          fill={colors.ribbonDarkBlue}
          stroke={colors.ribbonDarkBlue}
          strokeWidth="1.5"
        />

        {/* Left Ribbon Fold Effect (3D Shadow Layer) */}
        <path
          d="M 87,319 L 40,310 L 57,337 Z"
          fill="#0F172A"
          opacity="0.85"
        />

        {/* Right Ribbon Fold Effect (3D Shadow Layer) */}
        <path
          d="M 413,319 L 460,310 L 443,337 Z"
          fill="#0F172A"
          opacity="0.85"
        />

        {/* 6. Main Curved Blue Ribbon (Foreground Layer) */}
        <path
          d="M 87,319 C 140,444 360,444 413,319 L 443,337 C 390,485 110,485 57,337 Z"
          fill={colors.ribbonBlue}
          stroke={colors.ribbonBlue}
          strokeWidth="1.5"
        />

        {/* 7. Curved White Text Along Path (Shown only if large enough) */}
        {displayCurvedText && (
          <text 
            fill={colors.white} 
            fontWeight="900" 
            style={{
              fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
              textTransform: 'uppercase',
              letterSpacing: '0.42px'
            }}
          >
            <textPath
              href="#coopRibbonTextPath"
              startOffset="50%"
              textAnchor="middle"
              style={{
                fontSize: '8px'
              }}
            >
              KOPERASI SEKOLAH MENENGAH PENDIDIKAN KHAS VOKASIONAL BERHAD
            </textPath>
          </text>
        )}
      </svg>
    </div>
  );
}
