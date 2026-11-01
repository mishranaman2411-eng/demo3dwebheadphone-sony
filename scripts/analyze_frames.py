import os
import glob

total_files = 0
total_size = 0
video_stats = {}

for v in [1, 2, 3, 5, 6, 7, 8, 10]:
    v_dir = f'public/frames/video-{v}'
    files = glob.glob(f'{v_dir}/*.webp')
    v_size = sum(os.path.getsize(f) for f in files)
    v_count = len(files)
    total_files += v_count
    total_size += v_size
    video_stats[v] = {
        'count': v_count,
        'size_mb': v_size / (1024 * 1024),
        'avg_kb': (v_size / v_count) / 1024 if v_count else 0
    }

print(f"Total active clip frames: {total_files}, Total size: {total_size / (1024 * 1024):.2f} MB")
for v, st in video_stats.items():
    print(f"Video {v}: {st['count']} frames, {st['size_mb']:.2f} MB, Avg: {st['avg_kb']:.1f} KB")
