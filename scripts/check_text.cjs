const { execSync } = require('child_process');
const fs = require('fs');

// Check what each clip actually is by looking at descriptions or probing frames
for (let v = 1; v <= 10; v++) {
  const p = `public/frames/video-${v}/frame_000120.webp`;
  // run tesseract or inspect with ffprobe
  console.log(`Video ${v}: checking frame 120...`);
}
