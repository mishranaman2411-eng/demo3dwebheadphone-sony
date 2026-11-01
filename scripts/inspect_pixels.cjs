const { execSync } = require('child_process');

function getFrameStats(path) {
  // Extract 10x10 downsampled raw rgb bytes
  const buf = execSync(`ffmpeg -i "${path}" -vframes 1 -vf scale=10:10 -f rawvideo -pix_fmt rgb24 - 2>nul`);
  let sumR = 0, sumG = 0, sumB = 0;
  for (let i = 0; i < buf.length; i += 3) {
    sumR += buf[i];
    sumG += buf[i+1];
    sumB += buf[i+2];
  }
  const count = buf.length / 3;
  return {
    r: Math.round(sumR / count),
    g: Math.round(sumG / count),
    b: Math.round(sumB / count)
  };
}

console.log('Video 1:');
for (const f of [1, 10, 25, 40, 55, 70, 85, 105]) {
  const pad = String(f).padStart(6, '0');
  const rgb = getFrameStats(`public/frames/video-1/frame_${pad}.webp`);
  console.log(`  f${f}: avg RGB(${rgb.r}, ${rgb.g}, ${rgb.b})`);
}
