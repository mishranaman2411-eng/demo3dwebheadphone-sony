const { execSync } = require('child_process');
for (const f of [1, 30, 60, 90, 110, 120, 140, 180, 239]) {
  const pad = String(f).padStart(6, '0');
  const buf = execSync(`ffmpeg -i "public/frames/video-10/frame_${pad}.webp" -vf scale=1:1 -f rawvideo -pix_fmt rgb24 - 2>nul`);
  console.log(`f${f}: RGB(${buf[0]},${buf[1]},${buf[2]})`);
}
