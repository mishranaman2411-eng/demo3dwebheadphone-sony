const { execSync } = require('child_process');

console.log('--- Lower-left corner brightness check ---');
const tests = [
  { name: 'Video 1 (f80)', path: 'public/frames/video-1/frame_000080.webp' },
  { name: 'Video 2 (f150)', path: 'public/frames/video-2/frame_000150.webp' },
  { name: 'Video 3 (f100)', path: 'public/frames/video-3/frame_000100.webp' },
  { name: 'Video 5 (f100)', path: 'public/frames/video-5/frame_000100.webp' },
  { name: 'Video 6 (f100)', path: 'public/frames/video-6/frame_000100.webp' },
  { name: 'Video 7 (f100)', path: 'public/frames/video-7/frame_000100.webp' },
  { name: 'Video 8 (f100)', path: 'public/frames/video-8/frame_000100.webp' },
  { name: 'Video 10 (f100)', path: 'public/frames/video-10/frame_000100.webp' },
];

for (const t of tests) {
  // Lower left: x=5% to 45%, y=60% to 90%
  const buf = execSync(`ffmpeg -i "${t.path}" -vf "crop=in_w*0.35:in_h*0.3:in_w*0.05:in_h*0.65,scale=1:1" -f rawvideo -pix_fmt rgb24 - 2>nul`);
  console.log(`${t.name}: Lower-left RGB(${buf[0]},${buf[1]},${buf[2]})`);
}
