const fs = require('fs');
const { execSync } = require('child_process');

// Compare Video 3 and Video 4 frame counts and content
console.log('Video 3 frames vs Video 4 frames:');
for (const f of [1, 30, 60, 90, 120, 150, 180, 210, 239]) {
  const pad = String(f).padStart(6, '0');
  const buf3 = execSync(`ffmpeg -i "public/frames/video-3/frame_${pad}.webp" -vf scale=1:1 -f rawvideo -pix_fmt rgb24 - 2>nul`);
  const buf4 = execSync(`ffmpeg -i "public/frames/video-4/frame_${pad}.webp" -vf scale=1:1 -f rawvideo -pix_fmt rgb24 - 2>nul`);
  console.log(`  f${f}: v3=RGB(${buf3[0]},${buf3[1]},${buf3[2]}) | v4=RGB(${buf4[0]},${buf4[1]},${buf4[2]})`);
}
