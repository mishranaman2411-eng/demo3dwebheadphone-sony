const { execSync } = require('child_process');

// Generate side-by-side comparison of video-3 fLast, video-4 f0, video-4 fLast, video-5 f0
execSync('ffmpeg -i "public/frames/video-3/frame_000239.webp" -i "public/frames/video-4/frame_000001.webp" -filter_complex hstack=inputs=2 tasks/previews/compare_v3last_v4first.jpg -y 2>nul');
execSync('ffmpeg -i "public/frames/video-4/frame_000239.webp" -i "public/frames/video-5/frame_000001.webp" -filter_complex hstack=inputs=2 tasks/previews/compare_v4last_v5first.jpg -y 2>nul');
execSync('ffmpeg -i "public/frames/video-3/frame_000239.webp" -i "public/frames/video-5/frame_000001.webp" -filter_complex hstack=inputs=2 tasks/previews/compare_v3last_v5first.jpg -y 2>nul');

console.log('Generated compare files!');
