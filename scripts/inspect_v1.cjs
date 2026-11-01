const { execSync } = require('child_process');
const frames = [1, 15, 30, 45, 60, 75, 90, 105];
for (const f of frames) {
  const pad = String(f).padStart(6, '0');
  const p = `public/frames/video-1/frame_${pad}.webp`;
  const out = `tasks/previews/v1_inspect_${f}.jpg`;
  execSync(`ffmpeg -i "${p}" -vf scale=640:360 "${out}" -y`);
  console.log(`Saved v1 frame ${f}`);
}
