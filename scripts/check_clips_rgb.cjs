const fs = require('fs');
const { execSync } = require('child_process');

// In each video, let's check representative frames (25%, 50%, 75%)
for (let v = 1; v <= 10; v++) {
  const dir = `public/frames/video-${v}`;
  const count = fs.readdirSync(dir).filter(f => f.endsWith('.webp')).length;
  console.log(`\n--- VIDEO ${v} (${count} frames) ---`);
  
  // Let's check average color of frame 1 and frame last
  const buf0 = execSync(`ffmpeg -i "${dir}/frame_000001.webp" -vf scale=1:1 -f rawvideo -pix_fmt rgb24 - 2>nul`);
  const bufEnd = execSync(`ffmpeg -i "${dir}/frame_${String(count).padStart(6,'0')}.webp" -vf scale=1:1 -f rawvideo -pix_fmt rgb24 - 2>nul`);
  console.log(`  Frame 1 avg RGB: (${buf0[0]}, ${buf0[1]}, ${buf0[2]})`);
  console.log(`  Frame ${count} avg RGB: (${bufEnd[0]}, ${bufEnd[1]}, ${bufEnd[2]})`);
}
