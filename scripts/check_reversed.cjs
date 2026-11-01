const { execSync } = require('child_process');

const res0 = execSync('ffmpeg -i "tasks/previews/phase5_0_scroll0_initial.png" -vf scale=1:1 -f rawvideo -pix_fmt rgb24 - 2>nul');
const res10 = execSync('ffmpeg -i "tasks/previews/phase5_10_reversed_to_frame1.png" -vf scale=1:1 -f rawvideo -pix_fmt rgb24 - 2>nul');

console.log(`phase5_0: RGB(${res0[0]},${res0[1]},${res0[2]})`);
console.log(`phase5_10: RGB(${res10[0]},${res10[1]},${res10[2]})`);
