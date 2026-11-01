const { execSync } = require('child_process');
const fs = require('fs');

// For each video 1 to 10, describe what happens at start, 25%, 50%, 75%, end
const clips = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
for (const c of clips) {
  const dir = `public/frames/video-${c}`;
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.webp')).sort();
  const count = files.length;
  console.log(`Video ${c}: ${count} frames`);
}
