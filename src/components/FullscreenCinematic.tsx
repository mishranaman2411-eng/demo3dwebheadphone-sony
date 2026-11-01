import React, { useRef, useEffect, useCallback, useState } from 'react';
import { ShoppingBag, Check, ArrowUp } from 'lucide-react';

// The verified seamless 8-clip video sequence (eliminating duplicate video 4 and duplicate video 9)
// Total unique continuous frames: 1,778
const CLIPS_CONFIG = [
  { video: 1, count: 105 },  // Brand intro & headphone ascension (frames 0..104)
  { video: 2, count: 239 },  // Exploded hardware architecture (frames 105..343)
  { video: 3, count: 239 },  // Sound quality: acoustic driver, DSEE wave, white->black stage (frames 344..582)
  { video: 5, count: 239 },  // Durability: tactile buttons, USB-C, matte finish (frames 583..821)
  { video: 6, count: 239 },  // Battery: 50h endurance & luminous 360 halo (frames 822..1060)
  { video: 7, count: 239 },  // Comfort: plush cushion stitching & headband slider (frames 1061..1299)
  { video: 8, count: 239 },  // Connectivity: Bluetooth multipoint dual pairing (frames 1300..1538)
  { video: 10, count: 239 }, // Hero outro: showcase, tilts, ascents upward into void (frames 1539..1777)
];

export interface FrameItem {
  url: string;
  videoIndex: number;
  frameInVideo: number;
  globalIndex: number;
}

// Generate the 1,778 flat sequential frame entries in exact chronological order using cleaned footage
export const ALL_FRAMES: FrameItem[] = [];
let globalCounter = 0;
for (const clip of CLIPS_CONFIG) {
  for (let f = 1; f <= clip.count; f++) {
    const pad = String(f).padStart(6, '0');
    ALL_FRAMES.push({
      url: `/frames/video-${clip.video}/frame_${pad}.webp`,
      videoIndex: clip.video,
      frameInVideo: f,
      globalIndex: globalCounter++,
    });
  }
}
export const TOTAL_FRAMES = ALL_FRAMES.length; // 1,778

const CACHE_LIMIT = 240;
const PRELOAD_FORWARD = 35;
const PRELOAD_BACKWARD = 15;

const INTRO_STOP_INDEX = 125; // Stopped exactly at SILENCE, ENGINEERED presentation (Video 2 frame 21)
const INTRO_DURATION_MS = 3800; // ~3.8s cinematic opening autoplay

// Exact timeline ranges [start, fadeInEnd, fadeOutStart, end] mapped directly to footage frames:
// Total frames: 1778
// Headings appear near the beginning of their respective feature footage, hold, and fade out before the next.
export const HEADINGS_CONFIG = [
  {
    tagline: 'ACOUSTIC ARCHITECTURE',
    title: 'SILENCE, ENGINEERED',
    subtitle: 'An acoustic sanctuary crafted for everyday living. Pure sound, effortless lightness.',
    // Introduces at Video 1 frame 70 (when headphones first emerge from bottom)
    // Holds through Video 2 exploded hardware view, fades out before Video 3
    range: [70 / 1778, 95 / 1778, 275 / 1778, 320 / 1778] as const, // [0.0394, 0.0534, 0.1547, 0.1800]
  },
  {
    tagline: 'DIGITAL SOUND ENHANCEMENT ENGINE',
    title: 'EVERY DETAIL, HEARD.',
    subtitle: 'Restoring high-frequency harmonics lost in digital compression to recreate authentic studio acoustic depth.',
    // Introduces at Video 3 frame 1 (acoustic driver closeup & DSEE pulse)
    // Holds through sound demonstration, fades out before Video 5
    range: [344 / 1778, 380 / 1778, 510 / 1778, 560 / 1778] as const, // [0.1935, 0.2137, 0.2868, 0.3150]
  },
  {
    tagline: 'TACTILE CONTROLS & RESILIENCE',
    title: 'BUILT FOR THE EVERYDAY.',
    subtitle: 'Intuitive physical buttons, USB-C fast charging, and fingerprint-resistant matte materials engineered for durability.',
    // Introduces at Video 5 frame 1 (tactile button cluster & USB-C port)
    // Holds through durability demonstration, fades out before Video 6
    range: [583 / 1778, 620 / 1778, 750 / 1778, 800 / 1778] as const, // [0.3279, 0.3487, 0.4218, 0.4500]
  },
  {
    tagline: 'UNCOMPROMISED ENDURANCE',
    title: 'UP TO 50 HOURS OF BATTERY LIFE.',
    subtitle: 'Over two continuous days of playback on a single charge. A rapid 3-minute boost delivers 1.5 hours of music.',
    // Introduces at Video 6 frame 1 (luminous 360 energy halo & battery showcase)
    // Holds through battery demonstration, fades out before Video 7
    range: [822 / 1778, 860 / 1778, 990 / 1778, 1040 / 1778] as const, // [0.4623, 0.4837, 0.5568, 0.5849]
  },
  {
    tagline: 'ALL-DAY ERGONOMICS',
    title: 'COMFORT THAT STAYS WITH YOU.',
    subtitle: 'Supple synthetic leather ear cushions and lightweight 147g architecture designed for hours of fatigue-free listening.',
    // Introduces at Video 7 frame 1 (cushion foam stitching & headband slider)
    // Holds through comfort demonstration, fades out before Video 8
    range: [1061 / 1778, 1100 / 1778, 1230 / 1778, 1280 / 1778] as const, // [0.5967, 0.6187, 0.6918, 0.7199]
  },
  {
    tagline: 'SEAMLESS MULTIPOINT CONNECTIVITY',
    title: 'YOUR WORLD. CONNECTED.',
    subtitle: 'Bluetooth® 5.2 pairs with your smartphone and laptop simultaneously, automatically switching audio streams as calls arrive.',
    // Introduces at Video 8 frame 1 (dual device pairing phone & laptop)
    // Holds through Bluetooth demonstration, fades out before Video 10 outro
    range: [1300 / 1778, 1340 / 1778, 1470 / 1778, 1520 / 1778] as const, // [0.7312, 0.7537, 0.8268, 0.8549]
  },
];

const COLOR_OPTIONS = [
  { name: 'White', color: '#ECEAE4', ring: 'ring-stone-300' },
  { name: 'Black', color: '#1B1B1E', ring: 'ring-stone-700' },
  { name: 'Blue', color: '#3A4D62', ring: 'ring-blue-400' },
  { name: 'Beige', color: '#D4C4B3', ring: 'ring-amber-200' },
];

function calculateOpacity(
  p: number,
  start: number,
  fadeInEnd: number,
  fadeOutStart: number,
  end: number
): number {
  if (p < start || p > end) return 0;
  if (p < fadeInEnd) return (p - start) / (fadeInEnd - start);
  if (p > fadeOutStart) return 1 - (p - fadeOutStart) / (end - fadeOutStart);
  return 1;
}

export const FullscreenCinematic: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const headingRefs = useRef<(HTMLDivElement | null)[]>([]);
  const outroRef = useRef<HTMLDivElement>(null);
  const telemetryRef = useRef<HTMLDivElement>(null);

  // Purchasing interactive state
  const [selectedColor, setSelectedColor] = useState(COLOR_OPTIONS[0]);
  const [isOrdered, setIsOrdered] = useState(false);

  // Performance cache and references (zero React re-renders during active scrolling)
  const imageCacheRef = useRef<Map<string, HTMLImageElement>>(new Map());
  const initialFrameImgRef = useRef<HTMLImageElement | null>(null);
  const inFlightPromisesRef = useRef<Map<string, Promise<HTMLImageElement | null>>>(new Map());
  const lastDrawnUrlRef = useRef<string>('');
  const lastDrawnImageRef = useRef<HTMLImageElement | null>(null);
  const currentTargetIndexRef = useRef<number>(0);
  const rafIdRef = useRef<number>(0);

  // Two-state timeline: Intro autoplay -> Freeze & wait for scroll -> Scroll controlled
  const isAutoplayingRef = useRef<boolean>(true);
  const autoplayRafIdRef = useRef<number>(0);

  // Draw image to canvas using full "cover" fitting with high DPI
  const drawImageCover = useCallback((img: HTMLImageElement) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    const cw = canvas.width;
    const ch = canvas.height;
    const iw = img.naturalWidth || 1920;
    const ih = img.naturalHeight || 1080;
    const imgRatio = iw / ih;
    const canvasRatio = cw / ch;

    let dw: number;
    let dh: number;
    let dx: number;
    let dy: number;

    if (canvasRatio > imgRatio) {
      dw = cw;
      dh = cw / imgRatio;
      dx = 0;
      dy = (ch - dh) / 2;
    } else {
      dh = ch;
      dw = ch * imgRatio;
      dx = (cw - dw) / 2;
      dy = 0;
    }

    ctx.drawImage(img, dx, dy, dw, dh);
    lastDrawnImageRef.current = img;
  }, []);

  // Sizing canvas to viewport device pixels
  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const targetW = Math.round(window.innerWidth * dpr);
    const targetH = Math.round(window.innerHeight * dpr);

    if (canvas.width !== targetW || canvas.height !== targetH) {
      canvas.width = targetW;
      canvas.height = targetH;
      if (lastDrawnImageRef.current) {
        drawImageCover(lastDrawnImageRef.current);
      }
    }
  }, [drawImageCover]);

  // Load a single frame into memory
  const loadFrame = useCallback((url: string): Promise<HTMLImageElement | null> => {
    const cache = imageCacheRef.current;
    if (cache.has(url)) {
      const img = cache.get(url)!;
      // Refresh LRU
      cache.delete(url);
      cache.set(url, img);
      return Promise.resolve(img);
    }

    if (inFlightPromisesRef.current.has(url)) {
      return inFlightPromisesRef.current.get(url)!;
    }

    const promise = new Promise<HTMLImageElement | null>((resolve) => {
      const img = new Image();
      img.onload = () => {
        inFlightPromisesRef.current.delete(url);
        cache.set(url, img);
        // Evict oldest entries, but preserve initial frame 1
        while (cache.size > CACHE_LIMIT) {
          const firstKey = cache.keys().next().value;
          if (firstKey) {
            cache.delete(firstKey);
            if (firstKey === ALL_FRAMES[0].url && initialFrameImgRef.current) {
              cache.set(firstKey, initialFrameImgRef.current);
            }
          }
        }
        resolve(img);
      };
      img.onerror = () => {
        inFlightPromisesRef.current.delete(url);
        resolve(null);
      };
      img.src = url;
    });

    inFlightPromisesRef.current.set(url, promise);
    return promise;
  }, []);

  // Render frame at target index
  const renderFrameAtIndex = useCallback(
    (index: number) => {
      const clamped = Math.max(0, Math.min(TOTAL_FRAMES - 1, index));
      const entry = ALL_FRAMES[clamped];
      if (!entry) return;

      // Special instantaneous case: Frame 1 is permanently pinned in memory
      if (clamped === 0 && initialFrameImgRef.current) {
        if (lastDrawnUrlRef.current !== entry.url) {
          drawImageCover(initialFrameImgRef.current);
          lastDrawnUrlRef.current = entry.url;
          (window as any).__lastDrawnUrl = entry.url;
        }
        return;
      }

      const cache = imageCacheRef.current;
      const cached = cache.get(entry.url);

      if (cached && cached.complete && cached.naturalWidth > 0) {
        if (lastDrawnUrlRef.current !== entry.url) {
          drawImageCover(cached);
          lastDrawnUrlRef.current = entry.url;
          (window as any).__lastDrawnUrl = entry.url;
        }
      } else {
        // High priority: load target frame immediately and draw as soon as available
        loadFrame(entry.url).then((img) => {
          if (img && currentTargetIndexRef.current === clamped) {
            drawImageCover(img);
            lastDrawnUrlRef.current = entry.url;
            (window as any).__lastDrawnUrl = entry.url;
          }
        });
      }

      // Defer peripheral preloads so they never compete with the primary visible frame
      const idleCallback =
        typeof window !== 'undefined' && 'requestIdleCallback' in window
          ? (window as any).requestIdleCallback
          : (cb: () => void) => setTimeout(cb, 32);

      idleCallback(() => {
        for (let i = 1; i <= PRELOAD_FORWARD; i++) {
          const nextIdx = clamped + i;
          if (nextIdx < TOTAL_FRAMES) {
            loadFrame(ALL_FRAMES[nextIdx].url);
          }
        }
        for (let i = 1; i <= PRELOAD_BACKWARD; i++) {
          const prevIdx = clamped - i;
          if (prevIdx >= 0) {
            loadFrame(ALL_FRAMES[prevIdx].url);
          }
        }
      });
    },
    [drawImageCover, loadFrame]
  );

  // Update headings, overlays, and telemetry based on normalized progress
  const updateTimelineUI = useCallback((progress: number, targetIdx: number) => {
    // 1. Headings opacity and subtle vertical parallax in center
    for (let i = 0; i < HEADINGS_CONFIG.length; i++) {
      const headingEl = headingRefs.current[i];
      if (!headingEl) continue;
      const [start, fadeInEnd, fadeOutStart, end] = HEADINGS_CONFIG[i].range;
      const opacity = calculateOpacity(progress, start, fadeInEnd, fadeOutStart, end);

      headingEl.style.opacity = String(opacity);
      if (opacity > 0) {
        headingEl.style.display = 'flex';
        // Subtle upward parallax (15px)
        const mid = (start + end) / 2;
        const offset = (progress - mid) * 30;
        headingEl.style.transform = `translateY(${offset.toFixed(1)}px)`;
      } else {
        headingEl.style.display = 'none';
      }
    }

    // 2. Outro purchase overlay appearance (fades in when Video 10 headphones ascend into void: > 0.94)
    if (outroRef.current) {
      if (progress >= 0.94) {
        const outroOpacity = Math.min(1, (progress - 0.94) / 0.04);
        outroRef.current.style.opacity = String(outroOpacity);
        outroRef.current.style.pointerEvents = outroOpacity > 0.6 ? 'auto' : 'none';
        outroRef.current.style.display = 'flex';
        const outroOffset = (1 - outroOpacity) * 20;
        outroRef.current.style.transform = `translateY(${outroOffset.toFixed(1)}px)`;
      } else {
        outroRef.current.style.opacity = '0';
        outroRef.current.style.pointerEvents = 'none';
        outroRef.current.style.display = 'none';
      }
    }

    // 3. Update discrete telemetry badge
    if (telemetryRef.current) {
      const current = ALL_FRAMES[targetIdx] || ALL_FRAMES[0];
      telemetryRef.current.innerText = `CH${current.videoIndex} F${String(
        current.frameInVideo
      ).padStart(3, '0')} • G${targetIdx + 1}/${TOTAL_FRAMES}`;
    }
  }, []);

  // Cancel intro autoplay and transfer full control to scroll
  const cancelAutoplay = useCallback(() => {
    if (!isAutoplayingRef.current) return;
    isAutoplayingRef.current = false;
    cancelAnimationFrame(autoplayRafIdRef.current);
    (window as any).__introAutoplaying = false;
  }, []);

  // Starts or restarts the intro opening autoplay sequence
  const startIntroAutoplay = useCallback(() => {
    cancelAnimationFrame(autoplayRafIdRef.current);
    isAutoplayingRef.current = true;
    (window as any).__introAutoplaying = true;
    (window as any).__introFrozen = false;

    // Draw Frame 1 (spotless pure white) immediately
    renderFrameAtIndex(0);
    updateTimelineUI(0, 0);

    const startTime = performance.now();

    const runAutoplay = (now: number) => {
      if (!isAutoplayingRef.current) return;

      const elapsed = now - startTime;
      const progressRatio = Math.min(1, elapsed / INTRO_DURATION_MS);
      const targetFrame = Math.min(INTRO_STOP_INDEX, Math.round(progressRatio * INTRO_STOP_INDEX));

      currentTargetIndexRef.current = targetFrame;
      const timelineProgress = targetFrame / TOTAL_FRAMES;

      updateTimelineUI(timelineProgress, targetFrame);
      renderFrameAtIndex(targetFrame);

      if (progressRatio < 1) {
        autoplayRafIdRef.current = requestAnimationFrame(runAutoplay);
      } else {
        // Intro complete! Freeze exactly on INTRO_STOP_INDEX and wait for user scroll
        isAutoplayingRef.current = false;
        (window as any).__introAutoplaying = false;
        (window as any).__introFrozen = true;
        renderFrameAtIndex(INTRO_STOP_INDEX);
        updateTimelineUI(INTRO_STOP_INDEX / TOTAL_FRAMES, INTRO_STOP_INDEX);
      }
    };

    autoplayRafIdRef.current = requestAnimationFrame(runAutoplay);
  }, [renderFrameAtIndex, updateTimelineUI]);

  // Scroll listener: handles State 2 (Scroll-controlled mode)
  const handleScroll = useCallback(() => {
    // Prevent the scroll handler from overriding the intro autoplay before it reaches its stopping point
    if (isAutoplayingRef.current) {
      if (window.scrollY !== 0) {
        window.scrollTo(0, 0);
      }
      return;
    }

    const scrollY = window.scrollY;
    const maxScroll = (containerRef.current?.scrollHeight || 1) - window.innerHeight;
    const scrollRatio = Math.min(1, Math.max(0, scrollY / (maxScroll || 1)));

    // State 2: Maps scroll progress (0..1) smoothly across remaining timeline (INTRO_STOP_INDEX .. TOTAL_FRAMES - 1)
    const targetIdx = Math.min(
      TOTAL_FRAMES - 1,
      INTRO_STOP_INDEX + Math.floor(scrollRatio * (TOTAL_FRAMES - 1 - INTRO_STOP_INDEX))
    );
    currentTargetIndexRef.current = targetIdx;

    const timelineProgress = targetIdx / TOTAL_FRAMES;
    updateTimelineUI(timelineProgress, targetIdx);

    // Schedule rAF draw
    cancelAnimationFrame(rafIdRef.current);
    rafIdRef.current = requestAnimationFrame(() => {
      renderFrameAtIndex(targetIdx);
    });
  }, [renderFrameAtIndex, updateTimelineUI]);

  // Window resize observer
  useEffect(() => {
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas, { passive: true });
    return () => window.removeEventListener('resize', resizeCanvas);
  }, [resizeCanvas]);

  // Initial load, autoplay sequence, and scroll binding
  useEffect(() => {
    // 1. Force manual scroll restoration so reloads always start cleanly at top
    if (typeof window !== 'undefined' && 'scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
    window.scrollTo(0, 0);

    // 2. High-priority preloading of intro frames (0 through 140)
    const firstUrl = ALL_FRAMES[0].url;
    loadFrame(firstUrl).then((img) => {
      if (img) {
        initialFrameImgRef.current = img;
        resizeCanvas();
        drawImageCover(img);
        lastDrawnUrlRef.current = firstUrl;
      }
    });

    for (let i = 1; i <= Math.min(140, TOTAL_FRAMES - 1); i++) {
      loadFrame(ALL_FRAMES[i].url);
    }

    // 3. Register scroll listener
    window.addEventListener('scroll', handleScroll, { passive: true });

    // 4. Start intro autoplay after a brief mount delay (80ms)
    const timer = setTimeout(() => {
      startIntroAutoplay();
    }, 80);

    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(autoplayRafIdRef.current);
      cancelAnimationFrame(rafIdRef.current);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [cancelAutoplay, drawImageCover, handleScroll, loadFrame, resizeCanvas, startIntroAutoplay]);

  const handleOrder = () => {
    setIsOrdered(true);
    setTimeout(() => setIsOrdered(false), 3500);
  };

  const handleReplay = () => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    startIntroAutoplay();
  };

  return (
    <div ref={containerRef} className="relative w-full bg-[#0B0B0C]">
      {/* 1. Fixed Fullscreen Canvas Layer */}
      {/* Renders the continuous 1,778 frame sequence without artificial heavy overlays or tints */}
      <div className="fixed inset-0 w-full h-[100svh] min-h-screen overflow-hidden pointer-events-none z-0">
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full object-cover block will-change-transform bg-[#FAFAF9]"
        />
      </div>

      {/* 2. Centered Cinematic Feature Typography Overlay */}
      <div className="fixed inset-0 w-full h-[100svh] min-h-screen pointer-events-none z-20 flex items-center justify-center p-4 sm:p-8">
        {HEADINGS_CONFIG.map((item, index) => (
          <div
            key={item.title}
            ref={(el) => (headingRefs.current[index] = el)}
            className="absolute inset-0 flex flex-col items-center justify-center text-center px-4 sm:px-8 pointer-events-none will-change-transform"
            style={{ display: 'none', opacity: 0 }}
          >
            {/* Centered Typography Container with Balanced Responsive Maximum Width */}
            <div className="relative w-full max-w-2xl sm:max-w-3xl md:max-w-4xl mx-auto flex flex-col items-center text-center space-y-4 sm:space-y-6">
              {/* Soft Ambient Radial Scrim for Clean High-Contrast Legibility */}
              <div
                className="absolute inset-0 -m-8 sm:-m-12 rounded-full filter blur-2xl opacity-90 -z-10 pointer-events-none"
                style={{
                  background:
                    'radial-gradient(circle, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.25) 55%, transparent 100%)',
                }}
                aria-hidden="true"
              />

              {/* Pale Blue Accent Kicker */}
              <span className="text-[11px] sm:text-xs md:text-sm font-mono uppercase tracking-[0.3em] text-[#A9C8FF] font-medium drop-shadow-[0_2px_10px_rgba(0,0,0,0.95)]">
                {item.tagline}
              </span>

              {/* Large, Bold, Premium Centered Heading */}
              <h2 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-bold uppercase tracking-tight text-white leading-[1.08] text-balance [text-shadow:_0_2px_10px_rgba(0,0,0,0.95),_0_8px_32px_rgba(0,0,0,0.9),_0_16px_48px_rgba(0,0,0,0.85)]">
                {item.title}
              </h2>

              {/* Centered Supporting Description Directly Beneath */}
              <p className="text-sm sm:text-base md:text-lg text-white/90 font-normal leading-relaxed max-w-xl sm:max-w-2xl text-balance [text-shadow:_0_2px_8px_rgba(0,0,0,0.95),_0_4px_20px_rgba(0,0,0,0.9)]">
                {item.subtitle}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* 3. Hero Outro & Interactive Purchase Interface */}
      {/* Appears when Video 10 headphones ascend upward into the clean dark void (> 0.94 scroll) */}
      <div
        ref={outroRef}
        className="fixed inset-0 w-full h-[100svh] min-h-screen z-30 flex items-center justify-center p-6 sm:p-10 select-none transition-all duration-300"
        style={{ display: 'none', opacity: 0 }}
      >
        <div className="relative w-full max-w-2xl bg-[#121214]/90 border border-white/10 rounded-3xl p-8 sm:p-10 backdrop-blur-xl shadow-2xl text-[#EDEDED] space-y-8">
          {/* Header */}
          <div className="space-y-2 border-b border-white/[0.08] pb-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase tracking-[0.25em] text-[#A9C8FF]">
                SONY ELECTRONICS • WH-CH520
              </span>
              <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                In Stock
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold uppercase tracking-tight text-white">
              Wireless Freedom. Studio Clarity.
            </h2>
            <p className="text-xs sm:text-sm text-white/60">
              50-Hour Battery Life • DSEE™ Acoustic Upscaling • Multipoint Bluetooth® 5.2 • 147g Featherweight
            </p>
          </div>

          {/* Color Selector */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-mono text-white/70">
              <span className="uppercase tracking-wider">Finish</span>
              <span className="text-white font-medium">{selectedColor.name}</span>
            </div>
            <div className="flex items-center space-x-3">
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c.name}
                  type="button"
                  onClick={() => setSelectedColor(c)}
                  className={`relative w-8 h-8 rounded-full border border-white/20 transition-all ${
                    selectedColor.name === c.name
                      ? `ring-2 ring-offset-2 ring-offset-[#121214] ${c.ring} scale-110`
                      : 'hover:scale-105 opacity-80 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: c.color }}
                  aria-label={`Select ${c.name} finish`}
                />
              ))}
            </div>
          </div>

          {/* Pricing & Call to Action */}
          <div className="pt-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-t border-white/[0.08]">
            <div className="flex items-baseline space-x-2">
              <span className="text-3xl font-bold font-mono tracking-tight text-white">
                $59.99
              </span>
              <span className="text-xs font-mono uppercase tracking-wider text-white/40">
                USD MSRP
              </span>
            </div>

            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={handleOrder}
                className="flex-1 sm:flex-none flex items-center justify-center space-x-2 px-6 py-3 rounded-full bg-white text-black font-semibold hover:bg-neutral-200 transition-all active:scale-95 shadow-lg"
              >
                {isOrdered ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>Added to Cart</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag className="w-4 h-4" />
                    <span>Order Now</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleReplay}
                className="flex items-center justify-center space-x-1.5 px-4 py-3 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-white/80 hover:text-white transition-all text-xs font-mono"
                title="Replay cinematic experience from start"
              >
                <ArrowUp className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Replay Film</span>
              </button>
            </div>
          </div>

          {/* Guarantees */}
          <div className="pt-2 flex items-center justify-between text-[11px] font-mono text-white/40 border-t border-white/[0.04]">
            <span>Free 2-Day Shipping</span>
            <span>•</span>
            <span>30-Day Money-Back Guarantee</span>
            <span>•</span>
            <span>1-Year Sony Warranty</span>
          </div>
        </div>
      </div>

      {/* 4. Automated Verification Telemetry (Screen-reader only, 0 visual UI clutter) */}
      <span
        id="frame-telemetry"
        ref={telemetryRef}
        className="sr-only"
        aria-hidden="true"
      >
        CH1 F001 • G1/1778
      </span>

      {/* 5. Virtual Scroll Track (750vh) Driving the Single Timeline */}
      <div className="relative w-full h-[750vh] pointer-events-none" />
    </div>
  );
};
