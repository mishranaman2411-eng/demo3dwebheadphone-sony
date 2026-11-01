const fs = require('fs');
const { execSync } = require('child_process');

// Inspect visual content of clips 1 to 10
// We will write an inspection script that checks:
// - what colors, what objects appear
// - whether text is baked into the video
for (let i = 1; i <= 10; i++) {
  const dir = `public/frames/video-${i}`;
  const count = fs.readdirSync(dir).filter(f => f.endsWith('.webp')).length;
  console.log(`Video ${i} (${count} frames)`);
}
