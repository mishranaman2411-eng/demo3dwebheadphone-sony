const fs = require('fs');
const { execSync } = require('child_process');

console.log('Comparing video-3, video-4, video-5:');
const sz3 = fs.statSync('videos/3.mp4').size;
const sz4 = fs.statSync('videos/4.mp4').size;
const sz5 = fs.statSync('videos/5.mp4').size;
console.log('3.mp4 size:', sz3);
console.log('4.mp4 size:', sz4);
console.log('5.mp4 size:', sz5);

// Check if 4.mp4 is identical to any other file
for (let i = 1; i <= 10; i++) {
  if (i === 4) continue;
  const szi = fs.statSync(`videos/${i}.mp4`).size;
  if (szi === sz4) console.log(`4.mp4 has exact same size as ${i}.mp4!`);
}
