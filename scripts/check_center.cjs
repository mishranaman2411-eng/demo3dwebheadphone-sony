const { execSync } = require('child_process');

function sampleCenter(path) {
  // crop 100x100 from center
  const buf = execSync(`ffmpeg -i "${path}" -vframes 1 -vf "crop=100:100:910:490,scale=10:10" -f rawvideo -pix_fmt rgb24 - 2>nul`);
  let minR = 255, maxR = 0;
  for (let i = 0; i < buf.length; i += 3) {
    if (buf[i] < minR) minR = buf[i];
    if (buf[i] > maxR) maxR = buf[i];
  }
  return { minR, maxR };
}

console.log('Video 1 center crop:');
for (const f of [1, 5, 10, 15, 20, 25, 30, 40, 50, 60, 70, 80, 90, 100, 105]) {
  const pad = String(f).padStart(6, '0');
  const res = sampleCenter(`public/frames/video-1/frame_${pad}.webp`);
  console.log(`  f${f}: minR=${res.minR}, maxR=${res.maxR}`);
}
