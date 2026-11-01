import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, ArrowDown } from 'lucide-react';
import { CHAPTERS } from '../constants/sequence';

interface NavbarProps {
  activeChapterIndex: number;
  onNavigateToBuy: () => void;
  isAudioPlaying: boolean;
  onToggleAudio: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeChapterIndex,
  onNavigateToBuy,
  isAudioPlaying,
  onToggleAudio,
}) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const currentChapter = CHAPTERS[activeChapterIndex] || CHAPTERS[0];

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        isScrolled
          ? 'bg-[#0B0B0C]/85 backdrop-blur-md border-b border-white/[0.06] py-3.5'
          : 'bg-gradient-to-b from-[#0B0B0C]/80 via-[#0B0B0C]/40 to-transparent py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 md:px-10 flex items-center justify-between">
        {/* Brand & Model */}
        <div className="flex items-center space-x-6">
          <a
            href="#"
            className="text-lg md:text-xl font-bold tracking-widest text-white/95 hover:text-white transition-colors"
          >
            SONY
          </a>
          <div className="h-4 w-px bg-white/20 hidden sm:block" />
          <span className="text-xs tracking-wider uppercase text-white/60 font-mono hidden sm:inline-block">
            WH-CH520
          </span>
        </div>

        {/* Dynamic Chapter Indicator */}
        <div className="hidden md:flex items-center space-x-3 px-3.5 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-[11px] font-mono tracking-wider text-white/70">
          <span className="text-[#A9C8FF] font-semibold">
            {String(activeChapterIndex + 1).padStart(2, '0')}
          </span>
          <span className="text-white/30">/</span>
          <span>{String(CHAPTERS.length).padStart(2, '0')}</span>
          <span className="text-white/30">•</span>
          <span className="truncate max-w-[140px] uppercase text-white/90">
            {currentChapter.slug}
          </span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-4">
          {/* Sound Atmospheric Toggle */}
          <button
            onClick={onToggleAudio}
            type="button"
            aria-label={isAudioPlaying ? 'Mute ambience' : 'Play ambience'}
            className="p-2 rounded-full bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] text-white/70 hover:text-white transition-all text-xs flex items-center space-x-1.5"
            title="Atmospheric Sound"
          >
            {isAudioPlaying ? (
              <>
                <Volume2 className="w-3.5 h-3.5 text-[#A9C8FF] animate-pulse" />
                <span className="text-[10px] font-mono uppercase tracking-wider hidden lg:inline text-[#A9C8FF]">Sound On</span>
              </>
            ) : (
              <>
                <VolumeX className="w-3.5 h-3.5 text-white/50" />
                <span className="text-[10px] font-mono uppercase tracking-wider hidden lg:inline text-white/50">Sound Off</span>
              </>
            )}
          </button>

          {/* Direct CTA */}
          <button
            onClick={onNavigateToBuy}
            className="px-4 py-1.5 md:px-5 md:py-2 rounded-full bg-white text-[#0B0B0C] hover:bg-[#A9C8FF] hover:text-[#0B0B0C] transition-all text-xs font-semibold tracking-wider uppercase flex items-center space-x-1.5 shadow-sm"
          >
            <span>Order Now</span>
            <ArrowDown className="w-3 h-3" />
          </button>
        </div>
      </div>
    </header>
  );
};
