import React, { useRef, useEffect, useState, useCallback } from 'react';
import { CHAPTERS } from '../constants/sequence';
import { Chapter } from '../types';
import { Sparkles, ChevronDown, CheckCircle2 } from 'lucide-react';

interface CinematicScrollerProps {
  onActiveChapterChange: (index: number) => void;
  activeChapterIndex: number;
  onProgressChange?: (progress: number) => void;
}

// Build a flat frame list: [{ chapIdx, frameNum, url }]
// This maps global index 0..totalFrames-1 to chapter+frame
const FRAME_MAP: { chapIdx: number; frameNum: number; url: string }[] = [];
let TOTAL_FRAMES = 0;
for (let ci = 0; ci < CHAPTERS.length; ci++) {
  const ch = CHAPTERS[ci];
  for (let f = 1; f <= ch.frameCount; f++) {
    const pad = String(f).padStart(6, '0');
    FRAME_MAP.push({
      chapIdx: ci,
      frameNum: f,
      url: `/frames/video-${ci + 1}/frame_${pad}.webp`,
    });
  }
}
TOTAL_FRAMES = FRAME_MAP.length;

// Chapter start indices in the flat array
const CHAPTER_START: number[] = [];
{
  let offset = 0;
  for (let ci = 0; ci < CHAPTERS.length; ci++) {
    CHAPTER_START.push(offset);
    offset += CHAPTERS[ci].frameCount;
  }
}

const CACHE_LIMIT = 200;
const PRELOAD_AHEAD = 20;
const PRELOAD_BEHIND = 10;

export const CinematicScroller: React.FC<CinematicScrollerProps> = ({
  onActiveChapterChange,
  activeChapterIndex,
  onProgressChange,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<(HTMLDivElement | null)[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [chapterProgress, setChapterProgress] = useState(0);
  const [globalFrameIdx, setGlobalFrameIdx] = useState(0);

  // Mutable refs for the render loop
  const cacheRef = useRef<Map<string, HTMLImageElement>>(new Map());
  const loadingRef = useRef<Set<string>>(new Set());
  const currentGlobalIdxRef = useRef(0);
  const lastDrawnUrlRef = useRef<string>('');
  const rafRef = useRef<number>(0);

  const currentChapter: Chapter = CHAPTERS[activeChapterIndex] || CHAPTERS[0];
  const isWhiteTheme = currentChapter.bgTheme === 'white';
  const isTransitionTheme = currentChapter.bgTheme === 'transition';

  const getContainerBg = () => {
    if (isWhiteTheme) return 'bg-[#FFFFFF] text-[#111111]';
    if (isTransitionTheme) {
      return chapterProgress > 0.55
        ? 'bg-[#0B0B0C] text-[#EDEDED] transition-colors duration-1000'
        : 'bg-[#FFFFFF] text-[#111111] transition-colors duration-1000';
    }
    return 'bg-[#0B0B0C] text-[#EDEDED]';
  };

  // Draw an image onto the canvas
  const drawToCanvas = useCallback((img: HTMLImageElement) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    const cw = canvas.width;
    const ch = canvas.height;
    const imgRatio = img.naturalWidth / img.naturalHeight;
    const canvasRatio = cw / ch;

    let dw: number, dh: number, dx: number, dy: number;
    if (canvasRatio > imgRatio) {
      dh = ch;
      dw = ch * imgRatio;
      dx = (cw - dw) / 2;
      dy = 0;
    } else {
      dw = cw;
      dh = cw / imgRatio;
      dx = 0;
      dy = (ch - dh) / 2;
    }

    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, cw, ch);
    ctx.drawImage(img, dx, dy, dw, dh);
  }, []);

  // Load one frame into cache. Returns a promise.
  const loadFrame = useCallback((url: string): Promise<HTMLImageElement | null> => {
    const cache = cacheRef.current;
    if (cache.has(url)) {
      const img = cache.get(url)!;
      // Move to end (LRU refresh)
      cache.delete(url);
      cache.set(url, img);
      return Promise.resolve(img);
    }

    if (loadingRef.current.has(url)) {
      return Promise.resolve(null); // already loading
    }

    return new Promise((resolve) => {
      loadingRef.current.add(url);
      const img = new Image();
      img.onload = () => {
        loadingRef.current.delete(url);
        cache.set(url, img);
        // Evict oldest if over limit
        while (cache.size > CACHE_LIMIT) {
          const first = cache.keys().next().value;
          if (first) cache.delete(first);
        }
        resolve(img);
      };
      img.onerror = () => {
        loadingRef.current.delete(url);
        resolve(null);
      };
      img.src = url;
    });
  }, []);

  // Draw frame at a given global index
  const drawFrame = useCallback((idx: number) => {
    const clamped = Math.max(0, Math.min(TOTAL_FRAMES - 1, idx));
    const entry = FRAME_MAP[clamped];
    if (!entry) return;

    const cache = cacheRef.current;
    const cached = cache.get(entry.url);

    if (cached && cached.complete && cached.naturalWidth > 0) {
      if (lastDrawnUrlRef.current !== entry.url) {
        drawToCanvas(cached);
        lastDrawnUrlRef.current = entry.url;
      }
    } else {
      // Load it, draw when ready if still current
      loadFrame(entry.url).then((img) => {
        if (img && currentGlobalIdxRef.current === clamped) {
          drawToCanvas(img);
          lastDrawnUrlRef.current = entry.url;
        }
      });
    }

    // Background preload surrounding frames
    for (let d = 1; d <= PRELOAD_AHEAD; d++) {
      const fi = clamped + d;
      if (fi < TOTAL_FRAMES) loadFrame(FRAME_MAP[fi].url);
    }
    for (let d = 1; d <= PRELOAD_BEHIND; d++) {
      const fi = clamped - d;
      if (fi >= 0) loadFrame(FRAME_MAP[fi].url);
    }
  }, [drawToCanvas, loadFrame]);

  // Size canvas to match container with DPR
  const sizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    const w = Math.round(rect.width * dpr);
    const h = Math.round(rect.height * dpr);
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
      // Redraw current
      const entry = FRAME_MAP[currentGlobalIdxRef.current];
      if (entry) {
        const img = cacheRef.current.get(entry.url);
        if (img) drawToCanvas(img);
      }
    }
  }, [drawToCanvas]);

  // Resize handler
  useEffect(() => {
    sizeCanvas();
    window.addEventListener('resize', sizeCanvas, { passive: true });
    return () => window.removeEventListener('resize', sizeCanvas);
  }, [sizeCanvas]);

  // Convert scroll position → global frame index
  const handleScroll = useCallback(() => {
    const scrollY = window.scrollY;
    const windowHeight = window.innerHeight;

    let foundIndex = 0;
    let localProgress = 0;

    for (let i = 0; i < sectionRefs.current.length; i++) {
      const section = sectionRefs.current[i];
      if (!section) continue;

      const sectionTop = section.offsetTop;
      const sectionHeight = section.offsetHeight;
      const enterY = sectionTop - windowHeight * 0.4;
      const exitY = sectionTop + sectionHeight - windowHeight * 0.4;

      if (scrollY >= enterY && scrollY < exitY) {
        foundIndex = i;
        localProgress = Math.min(1, Math.max(0, (scrollY - enterY) / sectionHeight));
        break;
      } else if (scrollY >= exitY) {
        foundIndex = i; // keep advancing
        localProgress = 1;
      }
    }

    if (foundIndex !== activeChapterIndex) {
      onActiveChapterChange(foundIndex);
    }
    setChapterProgress(localProgress);
    onProgressChange?.(localProgress);

    // Convert chapter + progress to a global frame index
    const chapter = CHAPTERS[foundIndex];
    const chapterStart = CHAPTER_START[foundIndex];
    const frameInChapter = Math.min(
      chapter.frameCount - 1,
      Math.max(0, Math.round(localProgress * (chapter.frameCount - 1)))
    );
    const globalIdx = chapterStart + frameInChapter;

    currentGlobalIdxRef.current = globalIdx;
    setGlobalFrameIdx(globalIdx);

    // Schedule draw on next animation frame
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => drawFrame(globalIdx));
  }, [activeChapterIndex, onActiveChapterChange, onProgressChange, drawFrame]);

  // Bind scroll + initial draw
  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });

    // Initial draw: load frame 1 and draw it immediately
    const firstUrl = FRAME_MAP[0].url;
    loadFrame(firstUrl).then((img) => {
      if (img) {
        sizeCanvas();
        drawToCanvas(img);
        lastDrawnUrlRef.current = firstUrl;
      }
    });

    // Preload first batch
    for (let i = 0; i < 30 && i < TOTAL_FRAMES; i++) {
      loadFrame(FRAME_MAP[i].url);
    }

    // Trigger initial scroll calc
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      cancelAnimationFrame(rafRef.current);
    };
  }, [handleScroll, loadFrame, drawToCanvas, sizeCanvas]);

  // Chapter navigation
  const scrollToChapter = (index: number) => {
    const section = sectionRefs.current[index];
    if (section) {
      window.scrollTo({ top: section.offsetTop - window.innerHeight * 0.3, behavior: 'smooth' });
    }
  };

  // Current frame info for display
  const currentEntry = FRAME_MAP[globalFrameIdx] || FRAME_MAP[0];
  const displayChapter = CHAPTERS[currentEntry.chapIdx] || CHAPTERS[0];

  return (
    <div
      ref={containerRef}
      className={`relative w-full transition-colors duration-700 ${getContainerBg()}`}
    >
      {/* Pinned Canvas Viewport */}
      <div className="sticky top-0 left-0 w-full h-[100dvh] overflow-hidden flex items-center justify-center pointer-events-none">
        {/* Ambient lighting */}
        <div
          className={`absolute inset-0 pointer-events-none transition-opacity duration-1000 ${
            isWhiteTheme ? 'opacity-0' : 'opacity-100'
          }`}
          style={{
            background:
              'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.06) 0%, rgba(169,200,255,0.03) 38%, transparent 70%)',
          }}
        />

        {/* Canvas */}
        <div className="relative w-full h-full max-w-7xl max-h-[100dvh] flex items-center justify-center p-2 sm:p-6 md:p-10">
          <canvas
            ref={canvasRef}
            className="w-full h-full max-w-full max-h-full"
          />
        </div>

        {/* Typography overlay */}
        <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-5 sm:p-8 md:p-16 z-20">
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

          <div className="pb-6 sm:pb-12 max-w-lg md:max-w-2xl">
            <div
              key={`content-${currentChapter.id}`}
              className="space-y-2 sm:space-y-3.5 transition-all duration-700"
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

        {/* Scroll prompt */}
        {activeChapterIndex === 0 && (
          <div className="hidden md:flex absolute bottom-6 left-1/2 -translate-x-1/2 flex-col items-center space-y-1 text-black/60 z-20 animate-bounce">
            <span className="text-[10px] font-mono tracking-widest uppercase">Scroll to Experience</span>
            <ChevronDown className="w-4 h-4 text-black/60" />
          </div>
        )}

        {/* Chapter dots */}
        <div className="hidden lg:flex fixed right-8 top-1/2 -translate-y-1/2 z-40 flex-col items-end space-y-2.5 pointer-events-auto">
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
                      ? 'w-2 h-5 bg-[#A9C8FF] shadow-[0_0_12px_rgba(169,200,255,0.6)]'
                      : 'w-2 h-2 bg-white/20 group-hover:bg-white/60 group-hover:scale-125'
                  }`}
                />
              </button>
            );
          })}
        </div>

        {/* Frame counter */}
        <div className="hidden md:block absolute bottom-4 right-8 z-30 pointer-events-none opacity-40">
          <span id="frame-telemetry" className="text-[9px] font-mono tracking-wider text-white/50">
            CH{currentEntry.chapIdx + 1} F{String(currentEntry.frameNum).padStart(3, '0')}/{displayChapter.frameCount} • G{globalFrameIdx + 1}/{TOTAL_FRAMES}
          </span>
        </div>
      </div>

      {/* Scroll track — one section per chapter */}
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
