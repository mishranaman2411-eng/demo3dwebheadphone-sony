// Test video configuration
const CLIPS = [
  { video: 1, count: 105 },
  { video: 2, count: 239 },
  { video: 3, count: 239 },
  { video: 5, count: 239 },
  { video: 6, count: 239 },
  { video: 7, count: 239 },
  { video: 8, count: 239 },
  { video: 10, count: 239 },
];

const totalFrames = CLIPS.reduce((sum, c) => sum + c.count, 0);
console.log('Total frames:', totalFrames);

let cumulative = 0;
for (const c of CLIPS) {
  const start = cumulative;
  const end = cumulative + c.count - 1;
  console.log(`Video ${c.video}: frames [${start}..${end}] (${c.count} frames) -> scroll range [${(start/totalFrames).toFixed(4)} .. ${(end/totalFrames).toFixed(4)}]`);
  cumulative += c.count;
}
