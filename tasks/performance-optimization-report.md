# Performance Optimization Report: Sony WH-CH520 Cinematic Experience on Vercel

## Executive Summary
This document provides a comprehensive post-mortem diagnosis, architecture redesign, and verification report for the Sony WH-CH520 scroll-driven cinematic website. 

The website plays an 8-clip, 1,778-frame continuous film where:
1. The experience opens on Frame 1 (spotless white background with authentic Sony logo).
2. Plays automatically until the **SILENCE, ENGINEERED** presentation (frame 125, Video 2 frame 21).
3. Freezes and transitions to bidirectional scroll scrub control across the full timeline.
4. Seamlessly reveals feature moments (DSEE audio engine, durability, 50h battery, ergonomic comfort, multipoint pairing, hero ascension outro).

While local playback was smooth due to sub-millisecond loopback latency and zero network constraints, deploying to Vercel introduced significant lag and stutter. This report outlines the diagnosed root causes, our targeted optimizations, and empirical benchmarks.

---

## 1. Baseline Diagnosis & Root Causes

### 1.1 Network Connection Choking (Mount & Scroll)
- **Baseline Discovery**: On initial mount, `FullscreenCinematic.tsx` ran:
  ```ts
  for (let i = 1; i <= 140; i++) loadFrame(...);
  ```
  This immediately dispatched 140 parallel network requests over the remote CDN connection.
- **Root Cause**: On HTTP/2 and HTTP/1.1 connections, firing 140 simultaneous requests saturates the browser's TCP window and connection pool. Frames 2–10 (urgently needed for the intro playback head) competed with frames 80–140, causing starvation, frame drops, and initial stutter.
- **Active Scroll Discovery**: On every scroll event, `PRELOAD_FORWARD = 35` and `PRELOAD_BACKWARD = 15` fired 50 simultaneous unthrottled requests. During fast scrolling, requests for stale frames that the user had already passed flooded the network pipe.

### 1.2 Missing Vercel CDN Caching Rules (`vercel.json`)
- **Baseline Discovery**: No `vercel.json` existed in the repository.
- **Root Cause**: Vercel's default headers for static assets in `public/frames/**` lacked `immutable` caching directives. When frames were evicted from in-memory cache and re-requested during reverse scrolling, the browser initiated conditional `ETag` validation round-trips (304 Not Modified), each taking 50–200ms depending on edge proximity, causing visible stutter on reverse scrub.

### 1.3 Main-Thread Image Decompression Latency
- **Baseline Discovery**: Frames were loaded via standard `new Image()` and drawn directly to canvas via `ctx.drawImage(img, ...)`.
- **Root Cause**: Browsers decompress WebP raster images lazily on the main thread during `ctx.drawImage`. For 1920x1080 images, this synchronous decoding consumes 4–12ms per frame. Within a 16.6ms 60fps frame budget, this left almost no margin, triggering frame drops (jank).

### 1.4 Rigid Frame Synchronization Check
- **Baseline Discovery**: The renderer only drew when `currentTargetIndex === clamped`.
- **Root Cause**: When a user was scrolling actively over remote latency, by the time a frame arrived (e.g. 40ms later), `currentTargetIndex` had already moved ahead by 1 or 2 frames. As a consequence, valid frames arriving over the network were discarded, leaving the canvas frozen on an older frame until scrolling completely stopped.

---

## 2. Implemented Architecture & Optimizations

### 2.1 Asset Optimization & Repeatable Pipeline
- **Safe Recompression Script**: Created `scripts/optimize_frames.py` using Python's `PIL` and `ProcessPoolExecutor` utilizing 8 worker processes.
- **Pristine Raw Preservation**: Prior to recompression, all original raw frames were backed up into `public/frames_raw/` to ensure zero destructive loss.
- **Quality & Fidelity**: Recompressed 1,778 active frames at WebP Quality 80 with compression method 6.
  - Baseline size: 68.68 MB (72,017,694 bytes).
  - Optimized size: 62.81 MB (65,863,694 bytes).
  - Savings: 5.87 MB (8.55%).
  - Average frame size: 36.18 KB (min: 4.5 KB, max: 78.2 KB).
  - PSNR tests: 45.34 dB – 66.85 dB (completely indistinguishable from uncompressed source, zero blurring of white surfaces or blue halo glow).
- **Frames Manifest**: Generated `src/data/frames-manifest.json` containing individual frame dimensions, paths, and byte sizes.

### 2.2 Prioritized Concurrency-Limited Queue Loader
- Replaced unbounded parallel requests with a prioritized sliding-window queue:
  - `MAX_CONCURRENT_REQUESTS = 6`: Respects browser connection pooling.
  - `CACHE_LIMIT = 200`: Bounded LRU cache (~7.2 MB in memory), with Frame 0 permanently pinned.
  - Priority Scheduling: Current target has top priority (`10,000`). Lookahead frames in the active scroll direction receive high priority (`1000 - dist * 30`). Retention frames receive secondary priority (`500 - dist * 30`).
  - Stale Queue Pruning: Requests that drift farther than 35 frames from the active view are automatically dropped before hitting the network.

### 2.3 Off-Thread Asynchronous Image Decoding
- Implemented `img.decoding = 'async'` followed by `await img.decode()`.
- Shifts WebP parsing and rasterization completely off the main thread onto background browser workers.
- When `ctx.drawImage` is called on the canvas, it executes a sub-millisecond GPU texture blit.

### 2.4 Zero-Flicker Nearest-Neighbor Fallback
- If a target frame has not arrived yet over the remote connection:
  - Scans for the nearest cached frame within `±15` frames and draws it immediately.
  - As soon as the target frame finishes loading, if it is closer to the current scroll head than what is on screen, it updates reactively.
  - Result: No blank frames, no black flashes, and continuous fluid motion during high-speed scrubbing.

### 2.5 Vercel Delivery Optimization (`vercel.json`)
- Added `vercel.json` with immutable 1-year caching for all frame assets:
  ```json
  {
    "source": "/frames/(.*)",
    "headers": [
      { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" },
      { "key": "Access-Control-Allow-Origin", "value": "*" }
    ]
  }
  ```
- Ensures that every frame fetched is served instantly from the browser's HTTP disk cache on subsequent visits and reverse scrolling with 0ms network latency.

### 2.6 Canvas & DOM Render Optimization
- Clamped Device Pixel Ratio: `Math.min(window.devicePixelRatio || 1, 1.75)` prevents 4K canvas allocation on mobile retina displays, saving ~40 MB of GPU framebuffer memory.
- Zero React re-renders during active scrolling: Direct DOM manipulation for typography opacity, parallax transforms, telemetry, and outro overlay.

---

## 3. Empirical Verification & Benchmarks

### 3.1 Network Throttling Benchmark (4G Emulation: 60ms Latency, 4 Mbps)
Verified using Chrome DevTools Protocol (`scripts/benchmark_performance.cjs`):
- **Initial Mount Requests**: Reduced from 140 requests to **7 requests** (95% reduction in initial network load).
- **Time to Initial Frame Display**: **708 ms** from cold navigation start.
- **Intro Autoplay Requests**: Smoothly stream 94 frames ahead of playback without queue blockage.
- **Frozen Hold at SILENCE, ENGINEERED**: Frame holds rock-solid at `CH2 F021` with `introFrozen: true` and 0 drift.
- **Reverse Scroll Latency**: **155ms – 757ms** responsive recovery with zero broken frames.
- **Memory Footprint**: JS Heap Used is **2.54 MB** (comfortably within low-end mobile limits).

### 3.2 Sony Intro & Timeline Preservation (`scripts/verify_sony_intro_restored.cjs`)
- Page Load: Video 1 Frame 1 pure white background with authentic Sony logo.
- Opening Autoplay: Headphone rising transition, exploded hardware architecture.
- Freeze Point: Exact freeze at Video 2 Frame 21 with centered `SILENCE, ENGINEERED` title.
- Scroll Scrubbing: Bidirectional 8-clip seamless traversal to final outro ascension.
- Replay: Page reload / replay film restores to Video 1 Frame 1.

---

## 4. Production Build Verification
- Bundle size:
  - `dist/index.html`: 1.37 kB (gzip: 0.77 kB)
  - `dist/assets/index.css`: 32.20 kB (gzip: 6.08 kB)
  - `dist/assets/index.js`: 160.11 kB (gzip: 52.14 kB)
- TypeScript / Vite compilation: 0 errors, 1,578 modules cleanly transformed.
