import React, { useRef, useEffect, useState, useCallback } from 'react';
import { CHAPTERS } from '../constants/sequence';
import { Chapter } from '../types';
import { Sparkles, ChevronDown, CheckCircle2 } from 'lucide-react';

interface CinematicScrollerProps {
  onActiveChapterChange: (index: number) => void;
  activeChapterIndex: number;
  onProgressChange?: (progress: number) => void;
}

export const CinematicScroller: React.FC<CinematicScrollerProps> = ({
  onActiveChapterChange,
  activeChapterIndex,
  onProgressChange,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Video elements for dual-buffer player
  const videoRefA = useRef<HTMLVideoElement>(null);
  const videoRefB = useRef<HTMLVideoElement>(null);

  // Track active player buffer
  const [activePlayer, setActivePlayer] = useState<'A' | 'B'>('A');
  const [playerASrc, setPlayerASrc] = useState<string>(CHAPTERS[0].videoSrc);
  const [playerBSrc, setPlayerBSrc] = useState<string>(CHAPTERS[1]?.videoSrc || '');
  const [posterASrc, setPosterASrc] = useState<string>(CHAPTERS[0].posterSrc);
  const [posterBSrc, setPosterBSrc] = useState<string>(CHAPTERS[1]?.posterSrc || '');

  // Local chapter progress (0.0 to 1.0)
  const [chapterProgress, setChapterProgress] = useState(0);

  // References to track video playhead state without triggering unnecessary re-renders
  const targetTimeRef = useRef<number>(0);
  const isSeekingRef = useRef<boolean>(false);

  // Current active chapter
  const currentChapter: Chapter = CHAPTERS[activeChapterIndex] || CHAPTERS[0];

  // Dynamic theme calculations
  const isWhiteTheme = currentChapter.bgTheme === 'white';
  const isTransitionTheme = currentChapter.bgTheme === 'transition';

  // Background styling
  const getContainerBg = () => {
    if (isWhiteTheme) return 'bg-[#FFFFFF] text-[#111111]';
    if (isTransitionTheme) {
      return chapterProgress > 0.6
        ? 'bg-[#000000] text-[#EDEDED] transition-colors duration-1000'
        : 'bg-[#FFFFFF] text-[#111111] transition-colors duration-1000';
    }
    return 'bg-[#000000] text-[#EDEDED]';
  };

  // Scroll position calculation
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

      // Detect if viewport is in this section
      if (
        scrollY >= sectionTop - windowHeight * 0.4 &&
        scrollY < sectionTop + sectionHeight - windowHeight * 0.4
      ) {
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
    if (onProgressChange) {
      onProgressChange(localProgress);
    }

    // Calculate target timestamp
    const activeVideo = activePlayer === 'A' ? videoRefA.current : videoRefB.current;
    if (activeVideo && activeVideo.duration) {
      if (foundIndex === 7) {
        // Chapter 8: Scale up to 4.5s where headphones hold then partially exit top
        // Progress 0.0 - 0.45: Hold in center (0.0s - 3.0s)
        // Progress 0.45 - 0.85: Ascend upward (3.0s - 4.5s)
        // Progress 0.85 - 1.0: Hold at top apex (4.5s)
        if (localProgress < 0.45) {
          targetTimeRef.current = (localProgress / 0.45) * 3.0;
        } else if (localProgress < 0.85) {
          targetTimeRef.current = 3.0 + ((localProgress - 0.45) / 0.4) * 1.5;
        } else {
          targetTimeRef.current = 4.5;
        }
      } else {
        targetTimeRef.current = localProgress * activeVideo.duration;
      }
    }
  }, [activeChapterIndex, activePlayer, onActiveChapterChange, onProgressChange]);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  // RequestAnimationFrame ticker for non-blocking, butter-smooth video playhead seeking
  useEffect(() => {
    let animId: number;

    const tick = () => {
      const activeVideo = activePlayer === 'A' ? videoRefA.current : videoRefB.current;
      if (
        activeVideo &&
        activeVideo.readyState >= 2 &&
        !activeVideo.seeking &&
        !isSeekingRef.current
      ) {
        const diff = targetTimeRef.current - activeVideo.currentTime;
        if (Math.abs(diff) > 0.03) {
          isSeekingRef.current = true;
          activeVideo.currentTime = targetTimeRef.current;
        }
      }
      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [activePlayer]);

  // Dual-buffer video management with alternating buffer assignment
  useEffect(() => {
    const targetSrc = currentChapter.videoSrc;
    const targetPoster = currentChapter.posterSrc;
    const isEven = activeChapterIndex % 2 === 0;

    if (isEven) {
      setPlayerASrc(targetSrc);
      setPosterASrc(targetPoster);
      setActivePlayer('A');
      const nextChapter = CHAPTERS[activeChapterIndex + 1];
      if (nextChapter) {
        setPlayerBSrc(nextChapter.videoSrc);
        setPosterBSrc(nextChapter.posterSrc);
      }
    } else {
      setPlayerBSrc(targetSrc);
      setPosterBSrc(targetPoster);
      setActivePlayer('B');
      const nextChapter = CHAPTERS[activeChapterIndex + 1];
      if (nextChapter) {
        setPlayerASrc(nextChapter.videoSrc);
        setPosterASrc(nextChapter.posterSrc);
      }
    }
  }, [activeChapterIndex, currentChapter.videoSrc, currentChapter.posterSrc]);

  // Seek listeners to release seeking lock
  useEffect(() => {
    const handleSeeked = () => {
      isSeekingRef.current = false;
    };

    const vA = videoRefA.current;
    const vB = videoRefB.current;

    vA?.addEventListener('seeked', handleSeeked);
    vB?.addEventListener('seeked', handleSeeked);

    return () => {
      vA?.removeEventListener('seeked', handleSeeked);
      vB?.removeEventListener('seeked', handleSeeked);
    };
  }, []);

  // Jump to specific chapter via side indicator
  const scrollToChapter = (index: number) => {
    const section = sectionRefs.current[index];
    if (section) {
      const windowHeight = window.innerHeight;
      const targetY = section.offsetTop - windowHeight * 0.3;
      window.scrollTo({ top: targetY, behavior: 'smooth' });
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full transition-colors duration-700 ${getContainerBg()}`}
    >
      {/* Pinned Video Viewport */}
      <div className="sticky top-0 left-0 w-full h-[100dvh] overflow-hidden flex items-center justify-center pointer-events-none">
        {/* Ambient Contour Spotlight (Enhances off-white headphone visibility against black) */}
        <div
          className={`absolute inset-0 pointer-events-none transition-opacity duration-1000 ${
            isWhiteTheme ? 'opacity-0' : 'opacity-100'
          }`}
          style={{
            background:
              'radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.05) 0%, rgba(169, 200, 255, 0.03) 35%, transparent 70%)',
          }}
        />

        {/* Dual Hardware Video Decoders */}
        <div className="relative w-full h-full max-w-7xl max-h-[100dvh] flex items-center justify-center p-2 sm:p-6 md:p-10">
          <video
            ref={videoRefA}
            src={playerASrc}
            poster={posterASrc}
            muted
            playsInline
            preload="auto"
            className={`absolute w-full h-full object-contain transition-opacity duration-300 will-change-transform ${
              activePlayer === 'A' ? 'opacity-100 z-10' : 'opacity-0 z-0'
            }`}
          />
          <video
            ref={videoRefB}
            src={playerBSrc}
            poster={posterBSrc}
            muted
            playsInline
            preload="auto"
            className={`absolute w-full h-full object-contain transition-opacity duration-300 will-change-transform ${
              activePlayer === 'B' ? 'opacity-100 z-10' : 'opacity-0 z-0'
            }`}
          />
        </div>

        {/* Overlay Typography Display */}
        <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-5 sm:p-8 md:p-16 z-20">
          {/* Top Subtle Tagline */}
          <div className="pt-16 sm:pt-20">
            <div
              key={`tagline-${currentChapter.id}`}
              className="inline-flex items-center space-x-2 px-3 py-1 rounded-full backdrop-blur-md transition-all duration-700 animate-fadeIn"
              style={{
                backgroundColor: isWhiteTheme ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.06)',
                borderColor: isWhiteTheme ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)',
                borderWidth: '1px',
              }}
            >
              <Sparkles
                className={`w-3 h-3 ${isWhiteTheme ? 'text-black/70' : 'text-[#A9C8FF]'}`}
              />
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
          <div className="pb-6 sm:pb-12 max-w-lg md:max-w-2xl">
            <div
              key={`content-${currentChapter.id}`}
              className="space-y-2 sm:space-y-3.5 transition-all duration-700 transform translate-y-0"
            >
              <h2
                className={`text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight uppercase leading-[1.08] ${
                  isWhiteTheme ? 'text-[#111111]' : 'text-white'
                }`}
              >
                {currentChapter.heading}
              </h2>

              <p
                className={`text-xs sm:text-sm md:text-base lg:text-lg leading-relaxed max-w-lg font-normal ${
                  isWhiteTheme ? 'text-[#444444]' : 'text-white/70'
                }`}
              >
                {currentChapter.description}
              </p>

              {currentChapter.specsHighlight && (
                <div className="pt-1 flex items-center space-x-2">
                  <CheckCircle2
                    className={`w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0 ${
                      isWhiteTheme ? 'text-black/60' : 'text-[#A9C8FF]'
                    }`}
                  />
                  <span
                    className={`text-[10px] sm:text-xs md:text-sm font-mono tracking-wide ${
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

        {/* Scroll Prompt for Intro Chapter (Desktop only to prevent mobile overlap) */}
        {activeChapterIndex === 0 && (
          <div className="hidden md:flex absolute bottom-6 left-1/2 -translate-x-1/2 flex-col items-center space-y-1 text-black/60 z-20 animate-bounce">
            <span className="text-[10px] font-mono tracking-widest uppercase">
              Scroll to Experience
            </span>
            <ChevronDown className="w-4 h-4 text-black/60" />
          </div>
        )}

        {/* Right-Side Desktop Chapter Scrub Indicator */}
        <div className="hidden lg:flex fixed right-8 top-1/2 -translate-y-1/2 z-40 flex-col items-end space-y-3 pointer-events-auto">
          {CHAPTERS.map((ch, idx) => {
            const isActive = idx === activeChapterIndex;
            return (
              <button
                key={ch.id}
                onClick={() => scrollToChapter(idx)}
                type="button"
                className="group flex items-center space-x-2.5 py-1 focus:outline-none"
                aria-label={`Jump to ${ch.heading}`}
              >
                <span
                  className={`text-[10px] font-mono tracking-wider opacity-0 group-hover:opacity-100 transition-opacity uppercase px-2 py-0.5 rounded bg-black/60 backdrop-blur-md text-white/80 whitespace-nowrap ${
                    isWhiteTheme ? 'text-black/90 bg-white/80' : ''
                  }`}
                >
                  {ch.heading}
                </span>
                <span
                  className={`block rounded-full transition-all duration-300 ${
                    isActive
                      ? 'w-2 h-6 bg-[#A9C8FF] shadow-[0_0_12px_rgba(169,200,255,0.6)]'
                      : 'w-2 h-2 bg-white/20 group-hover:bg-white/60 group-hover:scale-125'
                  }`}
                />
              </button>
            );
          })}
        </div>
      </div>

      {/* Invisible Virtual Scroll Anchors (125vh each) */}
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
