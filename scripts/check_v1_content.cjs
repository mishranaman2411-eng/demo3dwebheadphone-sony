const { execSync } = require('child_process');
const fs = require('fs');

console.log('--- Video 1 frame scan ---');
for (let f = 1; f <= 105; f += 5) {
  const pad = String(f).padStart(6, '0');
  const p = `public/frames/video-1/frame_${pad}.webp`;
  // Check min pixel (darkest pixel in frame)
  // SONY logo has black letters (min RGB ~ 0-20), pure white is ~255
  const minRGB = execSync(`ffmpeg -i "${p}" -vf "format=gray,signalstats" -f null - 2>&1`).toString();
  const yminMatch = minRGB.match(/YMIN: (\d+)/i) || minRGB.match(/Ymin: (\d+)/i) || minRGB.match(/ymin=(\d+)/i);
  // Also check bottom 20% of image to see when headphones rise from below
  const bottomRGB = execSync(`ffmpeg -i "${p}" -vf "crop=in_w:in_h*0.2:0:in_h*0.8,scale=1:1" -f rawvideo -pix_fmt rgb24 - 2>nul`);
  console.log(`f${f}: bottomRGB=(${bottomRGB[0]},${bottomRGB[1]},${bottomRGB[2]}) size=${fs.statSync(p).size}`);
}
