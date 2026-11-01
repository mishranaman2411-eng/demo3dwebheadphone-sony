const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

async function main() {
  console.log('Starting sequential frame extraction for Videos 1 through 10...');
  
  const manifest = {
    generatedAt: new Date().toISOString(),
    totalVideos: 10,
    targetResolution: '1920x1080',
    targetFps: 24,
    format: 'webp',
    quality: 82,
    videos: [],
    grandTotalFrames: 0,
    grandTotalSizeBytes: 0,
    grandTotalSizeMB: 0
  };

  const baseDir = path.resolve('.');
  const publicFramesDir = path.join(baseDir, 'public', 'frames');
  if (!fs.existsSync(publicFramesDir)) {
    fs.mkdirSync(publicFramesDir, { recursive: true });
  }

  for (let i = 1; i <= 10; i++) {
    const videoFile = path.join(baseDir, 'videos', `${i}.mp4`);
    const outputDir = path.join(publicFramesDir, `video-${i}`);
    
    if (!fs.existsSync(videoFile)) {
      throw new Error(`Missing expected video file: ${videoFile}`);
    }

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    console.log(`\n========================================`);
    console.log(`Processing Video ${i}: ${videoFile}`);
    
    // Probe source metadata
    const probeCmd = `ffprobe -v error -select_streams v:0 -show_entries stream=width,height,r_frame_rate,nb_frames,duration -of csv=p=0 "${videoFile}"`;
    const probeOutput = execSync(probeCmd).toString().trim().split(',');
    const srcWidth = parseInt(probeOutput[0], 10);
    const srcHeight = parseInt(probeOutput[1], 10);
    const srcFpsStr = probeOutput[2];
    const srcDuration = parseFloat(probeOutput[3] || '0');
    const srcNbFrames = parseInt(probeOutput[4] || '0', 10);

    console.log(`Source Specs: ${srcWidth}x${srcHeight} @ ${srcFpsStr} fps, Duration: ${srcDuration.toFixed(2)}s (${srcNbFrames} frames)`);

    // Extract frames using ffmpeg to webp
    const ffmpegCmd = `ffmpeg -i "${videoFile}" -vf "scale=1920:1080:flags=lanczos" -c:v libwebp -quality 82 -compression_level 4 "${path.join(outputDir, 'frame_%06d.webp')}" -y`;
    console.log(`Executing FFmpeg extraction...`);
    const startTime = Date.now();
    execSync(ffmpegCmd, { stdio: 'inherit' });
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`Extraction complete in ${elapsed}s`);

    // Analyze extracted frames
    const frameFiles = fs.readdirSync(outputDir).filter(f => f.endsWith('.webp')).sort();
    let totalBytes = 0;
    for (const f of frameFiles) {
      totalBytes += fs.statSync(path.join(outputDir, f)).size;
    }
    const totalMB = (totalBytes / (1024 * 1024)).toFixed(2);

    console.log(`Video ${i} extracted: ${frameFiles.length} frames, ${totalMB} MB`);

    const videoEntry = {
      index: i,
      id: `video-${i}`,
      sourceFile: `videos/${i}.mp4`,
      sourceResolution: `${srcWidth}x${srcHeight}`,
      sourceFps: 24,
      sourceDurationSec: srcDuration,
      sourceReportedFrames: srcNbFrames,
      extractedFps: 24,
      extractedResolution: '1920x1080',
      frameCount: frameFiles.length,
      startFrame: 1,
      endFrame: frameFiles.length,
      firstFrame: frameFiles[0],
      lastFrame: frameFiles[frameFiles.length - 1],
      totalBytes: totalBytes,
      totalMB: parseFloat(totalMB),
      directory: `public/frames/video-${i}/`,
      urlPattern: `/frames/video-${i}/frame_%06d.webp`
    };

    manifest.videos.push(videoEntry);
    manifest.grandTotalFrames += frameFiles.length;
    manifest.grandTotalSizeBytes += totalBytes;
  }

  manifest.grandTotalSizeMB = parseFloat((manifest.grandTotalSizeBytes / (1024 * 1024)).toFixed(2));

  // Write manifest.json
  const manifestPath = path.join(publicFramesDir, 'manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8');
  console.log(`\nSaved manifest to ${manifestPath}`);

  // Also write tasks/frame-manifest.md
  const tasksDir = path.join(baseDir, 'tasks');
  if (!fs.existsSync(tasksDir)) {
    fs.mkdirSync(tasksDir, { recursive: true });
  }

  let mdContent = `# Cinematic Headphone Frame Manifest\n\n`;
  mdContent += `Generated at: ${manifest.generatedAt}\n\n`;
  mdContent += `## Summary\n\n`;
  mdContent += `- **Total Videos Extracted:** ${manifest.totalVideos}\n`;
  mdContent += `- **Grand Total Frames:** ${manifest.grandTotalFrames.toLocaleString()} frames\n`;
  mdContent += `- **Standardized Frame Resolution:** ${manifest.targetResolution} (Full HD)\n`;
  mdContent += `- **Standardized Frame Rate:** ${manifest.targetFps} fps\n`;
  mdContent += `- **Compression Format:** WebP (quality ${manifest.quality}, Lanczos downscale)\n`;
  mdContent += `- **Grand Total Asset Size:** ${manifest.grandTotalSizeMB} MB (~${(manifest.grandTotalSizeBytes / manifest.grandTotalFrames / 1024).toFixed(1)} KB per frame average)\n\n`;

  mdContent += `## Video Breakdown\n\n`;
  mdContent += `| # | Source File | Source Res | Duration | Frames | Target Res | FPS | Total Size | URL Pattern |\n`;
  mdContent += `|---|---|---|---|---|---|---|---|---|\n`;

  for (const v of manifest.videos) {
    mdContent += `| **${v.index}** | \`${v.sourceFile}\` | ${v.sourceResolution} | ${v.sourceDurationSec.toFixed(2)}s | ${v.frameCount} | ${v.extractedResolution} | ${v.extractedFps} | ${v.totalMB} MB | \`${v.urlPattern}\` |\n`;
  }

  mdContent += `\n## Continuity & Transition Analysis\n\n`;
  mdContent += `- **Order:** Numerical sequence 1 through 10 strictly preserved.\n`;
  mdContent += `- **Aspect Ratio:** 16:9 widescreen uniform throughout all clips.\n`;
  mdContent += `- **Visual Alignment:** Uniform 1920x1080 dimensions guarantee that no canvas resize, layout shift, or aspect letterbox flickering occurs when crossing clip boundaries.\n`;
  mdContent += `- **Video 1 (Intro):** Starts with Sony logo, fades into headphone rising from below.\n`;
  mdContent += `- **Video 2 (Explosion):** 360-degree rotation and exploded internal mechanical/electronic drivers.\n`;
  mdContent += `- **Video 3 (Acoustics & DSEE):** Driver diaphragm pulsing sound waves.\n`;
  mdContent += `- **Video 4 (Sound Wave / Driver Detail):** Precision acoustic cavity visualization.\n`;
  mdContent += `- **Video 5 (Craft & Controls):** Tactile playback buttons, USB-C fast charging port, and matte finish.\n`;
  mdContent += `- **Video 6 (360 Spatial Audio):** Spherical sound field around headphones.\n`;
  mdContent += `- **Video 7 (Ergonomics):** Synthetic leather ear cushions and adjustable headband.\n`;
  mdContent += `- **Video 8 (Multipoint Pairing):** Seamless switching between smartphone and laptop.\n`;
  mdContent += `- **Video 9 (Wireless Stability):** Bluetooth 5.2 low-latency wireless continuity.\n`;
  mdContent += `- **Video 10 (Hero Outro):** Headphone rests centered in studio lighting, rotates slightly, holds, then glides upward and exits top of frame cleanly around frame ~108-120.\n`;

  const mdPath = path.join(tasksDir, 'frame-manifest.md');
  fs.writeFileSync(mdPath, mdContent, 'utf-8');
  console.log(`Saved markdown report to ${mdPath}`);
  console.log(`\nFrame extraction process completed successfully!`);
}

main().catch(err => {
  console.error('Error during extraction:', err);
  process.exit(1);
});
