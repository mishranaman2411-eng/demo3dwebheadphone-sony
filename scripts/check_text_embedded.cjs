const fs = require('fs');
const { execSync } = require('child_process');

// Check every video for any embedded text
// We can use ffmpeg's ocr filter or dump frames to see if there is text
console.log('Checking videos for baked-in text...');
for (let v = 1; v <= 10; v++) {
  const dir = `public/frames/video-${v}`;
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.webp')).sort();
  console.log(`Video ${v} has ${files.length} frames.`);
}
