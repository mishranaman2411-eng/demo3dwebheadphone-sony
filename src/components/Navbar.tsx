import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, ArrowDown } from 'lucide-react';
import { CHAPTERS } from '../constants/sequence';

interface NavbarProps {
  activeChapterIndex: number;
  chapterProgress: number;
  onNavigateToBuy: () => void;
  isAudioPlaying: boolean;
  onToggleAudio: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeChapterIndex,
  chapterProgress,
  onNavigateToBuy,
  isAudioPlaying,
  onToggleAudio,
}) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const currentChapter = CHAPTERS[activeChapterIndex] || CHAPTERS[0];

  // Dynamic contrast detection based on active chapter theme
  const isWhite =
    currentChapter.bgTheme === 'white' ||
    (currentChapter.bgTheme === 'transition' && chapterProgress < 0.6);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 w-full max-w-full z-50 transition-all duration-500 ${
        isScrolled
          ? isWhite
            ? 'bg-white/85 backdrop-blur-md border-b border-black/[0.08] py-3'
            : 'bg-[#0B0B0C]/85 backdrop-blur-md border-b border-white/[0.06] py-3'
          : isWhite
          ? 'bg-gradient-to-b from-white/90 via-white/40 to-transparent py-4 md:py-5'
          : 'bg-gradient-to-b from-[#0B0B0C]/90 via-[#0B0B0C]/40 to-transparent py-4 md:py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-8 md:px-12 flex items-center justify-between flex-nowrap w-full">
        {/* Brand & Model */}
        <div className="flex items-center space-x-3 sm:space-x-4 md:space-x-6 flex-shrink-0">
          <a
            href="#"
            className={`text-lg md:text-xl font-bold tracking-widest transition-colors ${
              isWhite ? 'text-[#111111]' : 'text-white/95 hover:text-white'
            }`}
          >
            SONY
          </a>
          <div
            className={`h-3.5 w-px hidden sm:block ${
              isWhite ? 'bg-black/20' : 'bg-white/20'
            }`}
          />
          <span
            className={`text-[11px] tracking-wider uppercase font-mono hidden sm:inline-block ${
              isWhite ? 'text-black/60' : 'text-white/60'
            }`}
          >
            WH-CH520
          </span>
        </div>

        {/* Dynamic Chapter Indicator */}
        <div
          className={`hidden md:flex items-center space-x-2.5 px-3 py-1 rounded-full text-[11px] font-mono tracking-wider transition-colors ${
            isWhite
              ? 'bg-black/[0.04] border border-black/[0.08] text-black/70'
              : 'bg-white/[0.04] border border-white/[0.08] text-white/70'
          }`}
        >
          <span className={isWhite ? 'text-black font-semibold' : 'text-[#A9C8FF] font-semibold'}>
            {String(activeChapterIndex + 1).padStart(2, '0')}
          </span>
          <span className={isWhite ? 'text-black/30' : 'text-white/30'}>/</span>
          <span>{String(CHAPTERS.length).padStart(2, '0')}</span>
          <span className={isWhite ? 'text-black/30' : 'text-white/30'}>•</span>
          <span className={`truncate max-w-[130px] uppercase ${isWhite ? 'text-black font-medium' : 'text-white/90'}`}>
            {currentChapter.slug}
          </span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2 sm:space-x-3 flex-nowrap flex-shrink-0">
          {/* Sound Atmospheric Toggle */}
          <button
            onClick={onToggleAudio}
            type="button"
            aria-label={isAudioPlaying ? 'Mute soundscape' : 'Enable soundscape'}
            className={`p-2 rounded-full border transition-all text-xs flex items-center space-x-1.5 flex-shrink-0 ${
              isWhite
                ? 'bg-black/[0.04] hover:bg-black/[0.08] border-black/[0.08] text-black/70'
                : 'bg-white/[0.05] hover:bg-white/[0.1] border-white/[0.08] text-white/70'
            }`}
            title="Atmospheric Sound"
          >
            {isAudioPlaying ? (
              <>
                <Volume2 className="w-3.5 h-3.5 text-[#A9C8FF] animate-pulse" />
                <span className="text-[10px] font-mono uppercase tracking-wider hidden lg:inline text-[#A9C8FF]">Sound On</span>
              </>
            ) : (
              <>
                <VolumeX className={`w-3.5 h-3.5 ${isWhite ? 'text-black/50' : 'text-white/50'}`} />
                <span className={`text-[10px] font-mono uppercase tracking-wider hidden lg:inline ${isWhite ? 'text-black/50' : 'text-white/50'}`}>Sound Off</span>
              </>
            )}
          </button>

          {/* Direct CTA */}
          <button
            onClick={onNavigateToBuy}
            className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-full transition-all text-xs font-semibold tracking-wider uppercase flex items-center space-x-1 shadow-sm active:scale-95 flex-shrink-0 ${
              isWhite
                ? 'bg-[#111111] text-white hover:bg-black'
                : 'bg-white text-[#0B0B0C] hover:bg-[#A9C8FF] hover:text-[#0B0B0C]'
            }`}
          >
            <span>Order</span>
            <ArrowDown className="w-3 h-3" />
          </button>
        </div>
      </div>
    </header>
  );
};
