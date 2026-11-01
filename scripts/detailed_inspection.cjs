const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Inspect videos 1, 2, 3, 5, 6, 7, 8, 10
const clips = [1, 2, 3, 5, 6, 7, 8, 10];

console.log('=== DETAILED TIMELINE FOOTAGE INSPECTION ===\n');

for (const v of clips) {
  const dir = path.join('public', 'frames', `video-${v}`);
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.webp')).sort();
  console.log(`--- Video ${v} (${files.length} frames) ---`);
  
  // Sample key points in this video
  const step = Math.max(1, Math.floor(files.length / 8));
  for (let i = 0; i < files.length; i += step) {
    const fName = files[i];
    const fPath = path.join(dir, fName);
    // Measure image properties using ffmpeg
    // Check center pixel RGB vs average RGB
    const centerRGB = execSync(`ffmpeg -i "${fPath}" -vf "crop=10:10:in_w/2:in_h/2,scale=1:1" -f rawvideo -pix_fmt rgb24 - 2>nul`);
    const avgRGB = execSync(`ffmpeg -i "${fPath}" -vf "scale=1:1" -f rawvideo -pix_fmt rgb24 - 2>nul`);
    console.log(`  Frame ${i + 1}/${files.length} (${fName}): Center RGB(${centerRGB[0]},${centerRGB[1]},${centerRGB[2]}), Avg RGB(${avgRGB[0]},${avgRGB[1]},${avgRGB[2]})`);
  }
}
