const { execSync } = require('child_process');

// Inspect video-4: what happens across frames 1..239
const f1Stats = execSync('ffmpeg -i "public/frames/video-4/frame_000001.webp" -vf "crop=100:100:910:490,scale=10:10" -f rawvideo -pix_fmt rgb24 - 2>nul');
const fMidStats = execSync('ffmpeg -i "public/frames/video-4/frame_000120.webp" -vf "crop=100:100:910:490,scale=10:10" -f rawvideo -pix_fmt rgb24 - 2>nul');
const fLastStats = execSync('ffmpeg -i "public/frames/video-4/frame_000239.webp" -vf "crop=100:100:910:490,scale=10:10" -f rawvideo -pix_fmt rgb24 - 2>nul');

console.log('Video 4 Frame 1 raw bytes length:', f1Stats.length);
console.log('Video 4 Frame 120 raw bytes length:', fMidStats.length);
console.log('Video 4 Frame 239 raw bytes length:', fLastStats.length);
