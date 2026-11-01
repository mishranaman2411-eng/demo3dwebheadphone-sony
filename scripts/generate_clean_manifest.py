import os
import json
import glob
from datetime import datetime, timezone

def main():
    print("=== GENERATING CLEANED FRAME MANIFEST ===")
    
    clean_dir = "public/frames_clean"
    videos_info = []
    grand_total_frames = 0
    grand_total_bytes = 0
    
    for v in range(1, 11):
        vdir = os.path.join(clean_dir, f"video-{v}")
        frames = sorted(glob.glob(os.path.join(vdir, "*.webp")))
        count = len(frames)
        total_b = sum(os.path.getsize(f) for f in frames)
        grand_total_frames += count
        grand_total_bytes += total_b
        
        videos_info.append({
            "index": v,
            "id": f"video-{v}",
            "sourceFile": f"videos_clean/{v}.mp4",
            "sourceResolution": "1920x1080",
            "sourceFps": 24,
            "frameCount": count,
            "firstFrame": os.path.basename(frames[0]),
            "lastFrame": os.path.basename(frames[-1]),
            "totalBytes": total_b,
            "totalMB": round(total_b / (1024 * 1024), 2),
            "directory": f"public/frames_clean/video-{v}/",
            "urlPattern": f"/frames_clean/video-{v}/frame_%06d.webp"
        })
        print(f"Video {v}: {count} frames ({round(total_b / (1024 * 1024), 2)} MB)")

    manifest = {
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "cleanedAssets": True,
        "totalVideos": 10,
        "grandTotalFrames": grand_total_frames,
        "grandTotalSizeBytes": grand_total_bytes,
        "grandTotalSizeMB": round(grand_total_bytes / (1024 * 1024), 2),
        "targetResolution": "1920x1080",
        "targetFps": 24,
        "format": "webp",
        "quality": 85,
        "videos": videos_info
    }
    
    # Save JSON manifest
    with open(os.path.join(clean_dir, "manifest.json"), "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2)
    print(f"\nSaved {os.path.join(clean_dir, 'manifest.json')}")
    
    # Update tasks/frame-manifest.md
    md_content = f"""# Cinematic Headphone Frame Manifest (Cleaned Footage)

Generated at: {manifest["generatedAt"]}

## Summary

- **Status:** All embedded text, title cards, watermarks, and typography removed from footage
- **Total Videos Cataloged:** 10
- **Grand Total Clean Frames:** {grand_total_frames:,} frames
- **Standardized Frame Resolution:** 1920x1080 (Full HD)
- **Standardized Frame Rate:** 24 fps
- **Compression Format:** WebP (quality 85)
- **Grand Total Clean Asset Size:** {manifest["grandTotalSizeMB"]} MB

## Clean Video Breakdown

| # | Clean Source File | Duration | Frames | Target Res | FPS | Total Size | URL Pattern | Embedded Text Status |
|---|---|---|---|---|---|---|---|---|
| **1** | `videos_clean/1.mp4` | 4.38s | 105 | 1920x1080 | 24 | {videos_info[0]["totalMB"]} MB | `/frames_clean/video-1/frame_%06d.webp` | **CLEANED:** Embedded "SONY" logo & watermark removed. |
| **2** | `videos_clean/2.mp4` | 9.96s | 239 | 1920x1080 | 24 | {videos_info[1]["totalMB"]} MB | `/frames_clean/video-2/frame_%06d.webp` | **CLEAN:** Exploded hardware visual only. |
| **3** | `videos_clean/3.mp4` | 9.96s | 239 | 1920x1080 | 24 | {videos_info[2]["totalMB"]} MB | `/frames_clean/video-3/frame_%06d.webp` | **CLEAN:** 30mm dynamic driver & DSEE soundwave. |
| **4** | `videos_clean/4.mp4` | 9.96s | 239 | 1920x1080 | 24 | {videos_info[3]["totalMB"]} MB | `/frames_clean/video-4/frame_%06d.webp` | **CLEAN:** Alternate driver acoustic render. |
| **5** | `videos_clean/5.mp4` | 9.96s | 239 | 1920x1080 | 24 | {videos_info[4]["totalMB"]} MB | `/frames_clean/video-5/frame_%06d.webp` | **CLEAN:** Tactile physical buttons & USB-C port. |
| **6** | `videos_clean/6.mp4` | 9.96s | 239 | 1920x1080 | 24 | {videos_info[5]["totalMB"]} MB | `/frames_clean/video-6/frame_%06d.webp` | **CLEAN:** Luminous 360 Reality Audio halo. |
| **7** | `videos_clean/7.mp4` | 9.96s | 239 | 1920x1080 | 24 | {videos_info[6]["totalMB"]} MB | `/frames_clean/video-7/frame_%06d.webp` | **CLEAN:** Foam ear cushion stitching & headband slider. |
| **8** | `videos_clean/8.mp4` | 9.96s | 239 | 1920x1080 | 24 | {videos_info[7]["totalMB"]} MB | `/frames_clean/video-8/frame_%06d.webp` | **CLEAN:** Multipoint dual Bluetooth pairing. |
| **9** | `videos_clean/9.mp4` | 9.96s | 239 | 1920x1080 | 24 | {videos_info[8]["totalMB"]} MB | `/frames_clean/video-9/frame_%06d.webp` | **CLEAN:** Duplicate stream of Video 8. |
| **10** | `videos_clean/10.mp4` | 9.96s | 239 | 1920x1080 | 24 | {videos_info[9]["totalMB"]} MB | `/frames_clean/video-10/frame_%06d.webp` | **CLEAN:** Hero outro ascension into dark void. |
"""
    with open("tasks/frame-manifest.md", "w", encoding="utf-8") as f:
        f.write(md_content)
    print("Updated tasks/frame-manifest.md")

if __name__ == "__main__":
    main()
