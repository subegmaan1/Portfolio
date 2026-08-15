import React, { useState, useEffect } from 'react';
import { SoftwareTool } from '../types';
import { initialSoftwareTools } from '../data/initial-store';
import { subscribeSoftwareTools } from '../lib/api';
import { BUILTIN_SOFTWARE_ICONS } from '../admin/AdminSoftwareEditor';
import { Sparkles } from 'lucide-react';

export const SoftwareTickerSection: React.FC = () => {
  const [tools, setTools] = useState<SoftwareTool[]>(initialSoftwareTools);

  useEffect(() => {
    const unsubscribe = subscribeSoftwareTools((updatedTools) => {
      if (updatedTools && updatedTools.length > 0) {
        setTools(updatedTools);
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Filter to active tools and sort by sortOrder
  const activeTools = tools
    .filter((t) => t.enabled !== false)
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

  // If no tools are active, don't render empty bar
  if (activeTools.length === 0) return null;

  // Quadruple the array for seamless infinite looping
  const displayItems = [
    ...activeTools,
    ...activeTools,
    ...activeTools,
    ...activeTools
  ];

  // Helper to render icon for each tool
  const renderToolIcon = (tool: SoftwareTool) => {
    if (tool.customSvgCode) {
      return (
        <div
          className="w-full h-full flex items-center justify-center [&>svg]:w-full [&>svg]:h-full"
          dangerouslySetInnerHTML={{ __html: tool.customSvgCode }}
        />
      );
    }
    if (tool.customIconUrl) {
      return (
        <img
          src={tool.customIconUrl}
          alt={`${tool.name} logo`}
          className="w-full h-full object-contain"
          loading="lazy"
        />
      );
    }
    if (tool.id && BUILTIN_SOFTWARE_ICONS[tool.id]) {
      return BUILTIN_SOFTWARE_ICONS[tool.id];
    }
    return (
      <div className="w-full h-full rounded-sm bg-neutral-800 flex items-center justify-center text-neutral-400 font-bold text-xs">
        <Sparkles className="w-4 h-4" />
      </div>
    );
  };

  return (
    <section
      aria-label="Software & Production Stack"
      className="relative z-20 w-full overflow-hidden border-t border-b border-white/[0.08] bg-[#070707]/95 backdrop-blur-xl py-6 sm:py-8 select-none"
    >
      {/* Header bar / technical label */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-16 mb-4 sm:mb-6 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
          <h3 className="font-mono text-[11px] sm:text-xs text-neutral-300 font-semibold tracking-[0.25em] uppercase">
            SOFTWARE TOOLKIT & PRODUCTION PIPELINE
          </h3>
        </div>
        <div className="hidden sm:flex items-center space-x-2 font-mono text-[10px] text-neutral-500 uppercase tracking-widest">
          <span>REAL-TIME 3D</span>
          <span>&bull;</span>
          <span>SPATIAL PREVIZ</span>
          <span>&bull;</span>
          <span>LIVE PLAYOUT</span>
        </div>
      </div>

      {/* Edge gradient masks for smooth fade in/out */}
      <div className="absolute left-0 top-0 bottom-0 w-16 sm:w-28 bg-gradient-to-r from-[#070707] via-[#070707]/80 to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-16 sm:w-28 bg-gradient-to-l from-[#070707] via-[#070707]/80 to-transparent z-10 pointer-events-none" />

      {/* Marquee Track: Right-to-Left Continuous Loop (30% slower, 110s smooth cinematic pace) */}
      <div className="relative flex overflow-hidden group">
        <div
          className="flex shrink-0 items-center gap-4 sm:gap-6 animate-marquee-rtl group-hover:[animation-play-state:paused]"
          style={{ willChange: 'transform' }}
        >
          {displayItems.map((item, idx) => {
            const borderColor = item.borderColor || 'rgba(255, 255, 255, 0.3)';
            const accentBg = item.accentBg || 'rgba(255, 255, 255, 0.08)';

            return (
              <div
                key={`${item.id}-${idx}`}
                className="flex items-center space-x-3.5 px-4 py-2.5 sm:px-5 sm:py-3 rounded-sm border bg-white/[0.02] hover:bg-white/[0.06] transition-all duration-300 shrink-0 cursor-default"
                style={{
                  borderColor: 'rgba(255, 255, 255, 0.08)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = borderColor;
                  e.currentTarget.style.backgroundColor = accentBg;
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.02)';
                  e.currentTarget.style.transform = 'translateY(0px)';
                }}
              >
                {/* Software SVG / Logo Icon */}
                <div className="w-8 h-8 sm:w-9 sm:h-9 shrink-0 drop-shadow-md">
                  {renderToolIcon(item)}
                </div>

                {/* Software Details */}
                <div className="flex flex-col text-left">
                  <span className="font-syne font-bold text-xs sm:text-sm text-neutral-100 whitespace-nowrap tracking-wide">
                    {item.name}
                  </span>
                  <span className="font-mono text-[9px] sm:text-[10px] text-neutral-400 whitespace-nowrap tracking-wider uppercase">
                    {item.category}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
