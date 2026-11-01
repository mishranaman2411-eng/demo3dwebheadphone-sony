const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

async function main() {
  console.log('=== INSPECTING ALL 10 VIDEO FRAME SETS ===\n');

  for (let i = 1; i <= 10; i++) {
    const dir = path.join('public', 'frames', `video-${i}`);
    if (!fs.existsSync(dir)) {
      console.log(`video-${i} missing!`);
      continue;
    }
    const frames = fs.readdirSync(dir).filter(f => f.endsWith('.webp')).sort();
    const count = frames.length;
    const fFirst = path.join(dir, frames[0]);
    const fQuarter = path.join(dir, frames[Math.floor(count * 0.25)]);
    const fMid = path.join(dir, frames[Math.floor(count * 0.50)]);
    const fThreeQuarter = path.join(dir, frames[Math.floor(count * 0.75)]);
    const fLast = path.join(dir, frames[count - 1]);

    // Check frame byte sizes
    const szFirst = fs.statSync(fFirst).size;
    const szMid = fs.statSync(fMid).size;
    const szLast = fs.statSync(fLast).size;

    console.log(`Video ${i} (${count} frames):`);
    console.log(`  Frame 1: ${frames[0]} (${szFirst} B)`);
    console.log(`  Frame Mid: ${frames[Math.floor(count * 0.50)]} (${szMid} B)`);
    console.log(`  Frame Last: ${frames[count - 1]} (${szLast} B)`);
  }
}

main().catch(console.error);
