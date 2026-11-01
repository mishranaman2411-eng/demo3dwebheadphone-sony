const fs = require('fs');
const { execSync } = require('child_process');

// Sample each video at 10%, 50%, 90% and save small jpgs to tasks/previews/summary_v[N]_[pct].jpg
for (let v = 1; v <= 10; v++) {
  const dir = `public/frames/video-${v}`;
  const frames = fs.readdirSync(dir).filter(f => f.endsWith('.webp')).sort();
  const count = frames.length;
  [1, Math.floor(count * 0.3), Math.floor(count * 0.7), count].forEach((f, idx) => {
    const pad = String(f).padStart(6, '0');
    const src = `${dir}/frame_${pad}.webp`;
    const out = `tasks/previews/thumb_v${v}_p${idx}.jpg`;
    execSync(`ffmpeg -i "${src}" -vf scale=320:180 "${out}" -y 2>nul`);
  });
  console.log(`Video ${v} has ${count} frames`);
}
