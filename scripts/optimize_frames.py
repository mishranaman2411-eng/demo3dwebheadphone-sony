import os
import shutil
import json
import time
from concurrent.futures import ProcessPoolExecutor
from PIL import Image

CLIPS_CONFIG = [
    {"video": 1, "count": 105},
    {"video": 2, "count": 239},
    {"video": 3, "count": 239},
    {"video": 5, "count": 239},
    {"video": 6, "count": 239},
    {"video": 7, "count": 239},
    {"video": 8, "count": 239},
    {"video": 10, "count": 239},
]

QUALITY = 80
METHOD = 6

def backup_originals(source_dir="public/frames", raw_backup_dir="public/frames_raw"):
    if not os.path.exists(raw_backup_dir):
        print(f"Creating pristine backup of original frames in '{raw_backup_dir}'...")
        os.makedirs(raw_backup_dir, exist_ok=True)
        for clip in CLIPS_CONFIG:
            v_dir = f"video-{clip['video']}"
            src = os.path.join(source_dir, v_dir)
            dst = os.path.join(raw_backup_dir, v_dir)
            if os.path.exists(src) and not os.path.exists(dst):
                print(f"  Backing up {v_dir}...")
                shutil.copytree(src, dst)
        print("Backup complete. Original frames safely preserved.")
    else:
        print(f"Original frames already backed up in '{raw_backup_dir}'.")

def process_single_frame(task):
    clip_video, frame_num, raw_path, out_path = task
    orig_size = os.path.getsize(raw_path)
    
    # Read and recompress
    with Image.open(raw_path) as img:
        # Preserve dimensions and aspect ratio
        width, height = img.size
        # Save optimized WebP
        os.makedirs(os.path.dirname(out_path), exist_ok=True)
        img.save(out_path, "WEBP", quality=QUALITY, method=METHOD)
        
    opt_size = os.path.getsize(out_path)
    return {
        "video": clip_video,
        "frameInVideo": frame_num,
        "width": width,
        "height": height,
        "origSize": orig_size,
        "optSize": opt_size,
        "url": f"/frames/video-{clip_video}/frame_{frame_num:06d}.webp"
    }

def main():
    start_time = time.time()
    backup_originals()
    
    tasks = []
    global_index = 0
    for clip in CLIPS_CONFIG:
        v = clip["video"]
        count = clip["count"]
        for f in range(1, count + 1):
            pad = f"{f:06d}"
            raw_path = f"public/frames_raw/video-{v}/frame_{pad}.webp"
            out_path = f"public/frames/video-{v}/frame_{pad}.webp"
            if not os.path.exists(raw_path):
                # Fallback if raw doesn't exist
                raw_path = out_path
            tasks.append((v, f, raw_path, out_path))

    print(f"Processing and optimizing {len(tasks)} frames using multi-core pool (Quality={QUALITY}, Method={METHOD})...")
    
    max_workers = os.cpu_count() or 4
    with ProcessPoolExecutor(max_workers=max_workers) as executor:
        results = list(executor.map(process_single_frame, tasks))
        
    total_orig = sum(r["origSize"] for r in results)
    total_opt = sum(r["optSize"] for r in results)
    savings_bytes = total_orig - total_opt
    savings_pct = (savings_bytes / total_orig) * 100 if total_orig else 0
    
    manifest_frames = []
    for idx, r in enumerate(results):
        manifest_frames.append({
            "index": idx,
            "video": r["video"],
            "frameInVideo": r["frameInVideo"],
            "url": r["url"],
            "width": r["width"],
            "height": r["height"],
            "sizeBytes": r["optSize"]
        })
        
    manifest = {
        "metadata": {
            "totalFrames": len(manifest_frames),
            "quality": QUALITY,
            "compressionMethod": METHOD,
            "totalOriginalSizeBytes": total_orig,
            "totalOptimizedSizeBytes": total_opt,
            "savingsBytes": savings_bytes,
            "savingsPercent": round(savings_pct, 2),
            "averageFrameSizeBytes": round(total_opt / len(manifest_frames)),
            "generatedAt": time.strftime("%Y-%m-%d %H:%M:%S")
        },
        "frames": manifest_frames
    }
    
    os.makedirs("src/data", exist_ok=True)
    manifest_path = "src/data/frames-manifest.json"
    with open(manifest_path, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2)
        
    elapsed = time.time() - start_time
    print(f"\n--- Frame Optimization Summary ---")
    print(f"Total Frames Processed: {len(results)}")
    print(f"Original Total Size:    {total_orig / (1024*1024):.2f} MB")
    print(f"Optimized Total Size:   {total_opt / (1024*1024):.2f} MB")
    print(f"Total Savings:          {savings_bytes / (1024*1024):.2f} MB ({savings_pct:.1f}%)")
    print(f"Average Frame Size:     {manifest['metadata']['averageFrameSizeBytes'] / 1024:.2f} KB")
    print(f"Manifest Written:       {manifest_path}")
    print(f"Time Elapsed:           {elapsed:.2f}s")

if __name__ == "__main__":
    main()
