const { execSync } = require('child_process');
for (const f of [1, 5, 15, 25, 40, 55, 60, 65, 70, 75, 85, 95, 105]) {
  const pad = String(f).padStart(6, '0');
  const buf = execSync(`ffmpeg -i "public/frames/video-1/frame_${pad}.webp" -vf scale=1:1 -f rawvideo -pix_fmt rgb24 - 2>nul`);
  console.log(`v1 f${f}: RGB(${buf[0]},${buf[1]},${buf[2]})`);
}
