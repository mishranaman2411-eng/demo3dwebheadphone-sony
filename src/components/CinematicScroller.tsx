import React, { useRef, useEffect, useState, useCallback } from 'react';
import { CHAPTERS } from '../constants/sequence';
import { Chapter } from '../types';
import { Sparkles, ChevronDown, CheckCircle2 } from 'lucide-react';

interface CinematicScrollerProps {
  onActiveChapterChange: (index: number) => void;
  activeChapterIndex: number;
}

export const CinematicScroller: React.FC<CinematicScrollerProps> = ({
  onActiveChapterChange,
  activeChapterIndex,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Video references for dual-buffer player
  const videoRefA = useRef<HTMLVideoElement>(null);
  const videoRefB = useRef<HTMLVideoElement>(null);

  // Track which player is currently active ('A' or 'B')
  const [activePlayer, setActivePlayer] = useState<'A' | 'B'>('A');
  const [playerASrc, setPlayerASrc] = useState<string>(CHAPTERS[0].videoSrc);
  const [playerBSrc, setPlayerBSrc] = useState<string>(CHAPTERS[1]?.videoSrc || '');
  const [isVideoLoading, setIsVideoLoading] = useState(true);

  // Chapter progress (0 to 1) within the active chapter
  const [chapterProgress, setChapterProgress] = useState(0);

  // Current active chapter object
  const currentChapter: Chapter = CHAPTERS[activeChapterIndex] || CHAPTERS[0];

  // Dynamic theme based on current chapter
  const isWhiteTheme = currentChapter.bgTheme === 'white';
  const isTransitionTheme = currentChapter.bgTheme === 'transition';

  // Compute container background style
  const getContainerBg = () => {
    if (isWhiteTheme) return 'bg-[#FFFFFF] text-[#111111]';
    if (isTransitionTheme) {
      // Interpolate during chapter 3 (sound)
      return chapterProgress > 0.6
        ? 'bg-[#0B0B0C] text-[#EDEDED] transition-colors duration-1000'
        : 'bg-[#FFFFFF] text-[#111111] transition-colors duration-1000';
    }
    return 'bg-[#0B0B0C] text-[#EDEDED]';
  };

  // Scroll handler to detect active chapter and progress
  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;

    const scrollY = window.scrollY;
    const windowHeight = window.innerHeight;

    let foundIndex = 0;
    let localProgress = 0;

    for (let i = 0; i < sectionRefs.current.length; i++) {
      const section = sectionRefs.current[i];
      if (!section) continue;

      const rect = section.getBoundingClientRect();
      const sectionTop = rect.top + scrollY;
      const sectionHeight = section.offsetHeight;

      // Check if current scroll position lies within this section
      if (scrollY >= sectionTop - windowHeight * 0.4 && scrollY < sectionTop + sectionHeight - windowHeight * 0.4) {
        foundIndex = i;
        localProgress = Math.min(
          1,
          Math.max(0, (scrollY - (sectionTop - windowHeight * 0.4)) / sectionHeight)
        );
        break;
      } else if (i === sectionRefs.current.length - 1 && scrollY >= sectionTop) {
        foundIndex = i;
        localProgress = Math.min(1, Math.max(0, (scrollY - sectionTop) / sectionHeight));
      }
    }

    if (foundIndex !== activeChapterIndex) {
      onActiveChapterChange(foundIndex);
    }
    setChapterProgress(localProgress);
  }, [activeChapterIndex, onActiveChapterChange]);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  // Dual-buffer video management with alternating buffer assignment
  useEffect(() => {
    const targetSrc = currentChapter.videoSrc;
    const isEven = activeChapterIndex % 2 === 0;

    if (isEven) {
      // Player A is primary for even indices
      setPlayerASrc(targetSrc);
      setActivePlayer('A');
      const nextChapter = CHAPTERS[activeChapterIndex + 1];
      if (nextChapter) {
        setPlayerBSrc(nextChapter.videoSrc);
      }
    } else {
      // Player B is primary for odd indices
      setPlayerBSrc(targetSrc);
      setActivePlayer('B');
      const nextChapter = CHAPTERS[activeChapterIndex + 1];
      if (nextChapter) {
        setPlayerASrc(nextChapter.videoSrc);
      }
    }
  }, [activeChapterIndex, currentChapter.videoSrc]);

  // Synchronize playback of active video with scroll progress
  useEffect(() => {
    const activeVideo = activePlayer === 'A' ? videoRefA.current : videoRefB.current;
    if (!activeVideo || !activeVideo.duration) return;

    // Smoothly seek active video to match chapter progress
    const targetTime = chapterProgress * activeVideo.duration;
    if (!isNaN(targetTime) && Math.abs(activeVideo.currentTime - targetTime) > 0.08) {
      activeVideo.currentTime = targetTime;
    }
  }, [chapterProgress, activePlayer]);

  // Video loaded data handler
  const handleLoadedData = () => {
    setIsVideoLoading(false);
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full transition-colors duration-700 ${getContainerBg()}`}
    >
      {/* Pinned Video Viewport */}
      <div className="sticky top-0 left-0 w-full h-screen overflow-hidden flex items-center justify-center pointer-events-none">
        {/* Background Radial Glow */}
        <div
          className={`absolute inset-0 transition-opacity duration-1000 ${
            isWhiteTheme
              ? 'opacity-0'
              : 'opacity-100 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-950/20 via-[#0B0B0C]/80 to-[#0B0B0C]'
          }`}
        />

        {/* Dual Video Elements */}
        <div className="relative w-full h-full max-w-7xl max-h-screen flex items-center justify-center p-4 md:p-8">
          <video
            ref={videoRefA}
            src={playerASrc}
            muted
            playsInline
            preload="auto"
            onLoadedData={handleLoadedData}
            className={`absolute w-full h-full object-contain transition-opacity duration-500 will-change-transform ${
              activePlayer === 'A' ? 'opacity-100 z-10' : 'opacity-0 z-0'
            }`}
          />
          <video
            ref={videoRefB}
            src={playerBSrc}
            muted
            playsInline
            preload="auto"
            onLoadedData={handleLoadedData}
            className={`absolute w-full h-full object-contain transition-opacity duration-500 will-change-transform ${
              activePlayer === 'B' ? 'opacity-100 z-10' : 'opacity-0 z-0'
            }`}
          />
        </div>

        {/* Video Loading Skeleton Overlay */}
        {isVideoLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#0B0B0C]/90 z-20">
            <div className="flex flex-col items-center space-y-3">
              <div className="w-8 h-8 border-2 border-[#A9C8FF]/20 border-t-[#A9C8FF] rounded-full animate-spin" />
              <p className="text-xs font-mono uppercase tracking-widest text-white/50">
                Calibrating Pure Sound...
              </p>
            </div>
          </div>
        )}

        {/* Overlay Typography Display (Synchronized with Active Chapter) */}
        <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-6 md:p-14 z-20">
          {/* Top Subtle Tagline */}
          <div className="pt-16 md:pt-20">
            <div
              key={`tagline-${currentChapter.id}`}
              className="inline-flex items-center space-x-2 px-3 py-1 rounded-full backdrop-blur-md transition-all duration-700 animate-fadeIn"
              style={{
                backgroundColor: isWhiteTheme ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.06)',
                borderColor: isWhiteTheme ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)',
                borderWidth: '1px',
              }}
            >
              <Sparkles className={`w-3 h-3 ${isWhiteTheme ? 'text-black/70' : 'text-[#A9C8FF]'}`} />
              <span
                className={`text-[10px] md:text-xs font-mono uppercase tracking-widest ${
                  isWhiteTheme ? 'text-black/80 font-semibold' : 'text-[#A9C8FF]'
                }`}
              >
                {currentChapter.tagline}
              </span>
            </div>
          </div>

          {/* Bottom Narrative Callout Card */}
          <div className="pb-8 md:pb-12 max-w-2xl">
            <div
              key={`content-${currentChapter.id}`}
              className="space-y-3 md:space-y-4 transition-all duration-700 transform translate-y-0"
            >
              <h2
                className={`text-3xl md:text-5xl lg:text-6xl font-bold tracking-tight uppercase leading-[1.08] ${
                  isWhiteTheme ? 'text-[#111111]' : 'text-white'
                }`}
              >
                {currentChapter.heading}
              </h2>

              <p
                className={`text-sm md:text-base lg:text-lg leading-relaxed max-w-xl font-normal ${
                  isWhiteTheme ? 'text-[#444444]' : 'text-white/70'
                }`}
              >
                {currentChapter.description}
              </p>

              {currentChapter.specsHighlight && (
                <div className="pt-2 flex items-center space-x-2">
                  <CheckCircle2
                    className={`w-4 h-4 flex-shrink-0 ${
                      isWhiteTheme ? 'text-black/60' : 'text-[#A9C8FF]'
                    }`}
                  />
                  <span
                    className={`text-xs md:text-sm font-mono tracking-wide ${
                      isWhiteTheme ? 'text-black/70' : 'text-white/60'
                    }`}
                  >
                    {currentChapter.specsHighlight}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Scroll Prompt for Intro Chapter */}
        {activeChapterIndex === 0 && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center space-y-1 text-black/60 z-20 animate-bounce">
            <span className="text-[10px] font-mono tracking-widest uppercase">Scroll to Explore</span>
            <ChevronDown className="w-4 h-4 text-black/60" />
          </div>
        )}
      </div>

      {/* Invisible Virtual Scroll Anchors (125vh each for measured pacing) */}
      <div className="relative w-full z-0">
        {CHAPTERS.map((chapter, index) => (
          <div
            key={chapter.id}
            ref={(el) => (sectionRefs.current[index] = el)}
            className="w-full h-[125vh] pointer-events-none"
            aria-label={`Chapter ${chapter.id}: ${chapter.heading}`}
          />
        ))}
      </div>
    </div>
  );
};
