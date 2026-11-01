const fs = require('fs');
const { execSync } = require('child_process');

console.log('--- Analyzing Video 1 frames ---');
for (const f of [1, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 105]) {
  const pad = String(f).padStart(6, '0');
  const p = `public/frames/video-1/frame_${pad}.webp`;
  const res = execSync(`ffprobe -v error -show_entries frame=pkt_size -of csv=p=0 "${p}"`).toString().trim();
  console.log(`v1 frame ${f}: size = ${fs.statSync(p).size} bytes`);
}
