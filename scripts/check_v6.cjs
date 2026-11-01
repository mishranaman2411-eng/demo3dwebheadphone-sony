const fs = require('fs');
const { execSync } = require('child_process');

// In Video 6, let's see what is drawn!
// In Video 6, is there a "50 HOURS" text or 360 audio text?
console.log('Inspecting Video 6:');
for (const f of [30, 60, 90, 120, 150, 180, 210]) {
  const pad = String(f).padStart(6, '0');
  const p = `public/frames/video-6/frame_${pad}.webp`;
  // Let's create preview
  execSync(`ffmpeg -i "${p}" -vf scale=640:360 tasks/previews/v6_inspect_${f}.jpg -y 2>nul`);
}
console.log('Saved v6 previews');
