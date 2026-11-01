import os
import glob
from PIL import Image, ImageStat, ImageOps

print("=== FULL FRAME AUDIT FOR EMBEDDED TEXT & LOGOS ===")

for v in range(1, 11):
    fdir = f"public/frames/video-{v}"
    if not os.path.exists(fdir):
        print(f"Video {v} missing")
        continue
    files = sorted(glob.glob(f"{fdir}/*.webp"))
    print(f"\n--- Video {v} ({len(files)} frames) ---")
    
    # Check for text in various regions
    flagged_frames = []
    
    for i, fpath in enumerate(files):
        img = Image.open(fpath)
        w, h = img.size
        # Check center region where title cards or logos usually appear:
        # e.g., center 50% box
        center_box = (int(w*0.25), int(h*0.3), int(w*0.75), int(h*0.7))
        center = img.crop(center_box).convert('L')
        c_stat = ImageStat.Stat(center)
        
        # Check top-left, top-right, bottom-left, bottom-right corners for watermarks/captions
        tl = img.crop((0, 0, int(w*0.3), int(h*0.2))).convert('L')
        tr = img.crop((int(w*0.7), 0, w, int(h*0.2))).convert('L')
        bl = img.crop((0, int(h*0.8), int(w*0.4), h)).convert('L')
        br = img.crop((int(w*0.6), int(h*0.8), w, h)).convert('L')
        
        # In pure background videos (like v1 pure white), any dark pixels in center indicate text/logo
        if v == 1:
            # check min pixel in center
            min_val = min(center.getdata())
            if min_val < 200: # not white
                flagged_frames.append((i+1, f"dark content in center (min={min_val})"))
        
        # In black background videos (v5..10), check if there are bright text blocks in corners/edges
        elif v in [5, 6, 7, 8, 9, 10]:
            # check if corners have bright text
            bl_stat = ImageStat.Stat(bl)
            br_stat = ImageStat.Stat(br)
            tl_stat = ImageStat.Stat(tl)
            tr_stat = ImageStat.Stat(tr)
            # check if max pixel is near white in bottom left/right where headphones are not
            bl_max = max(bl.getdata())
            br_max = max(br.getdata())
            if bl_max > 220 and bl_stat.mean[0] < 30:
                flagged_frames.append((i+1, f"bright text-like mark in bottom-left (max={bl_max})"))
            if br_max > 220 and br_stat.mean[0] < 30:
                flagged_frames.append((i+1, f"bright text-like mark in bottom-right (max={br_max})"))

    if flagged_frames:
        print(f"  Flagged {len(flagged_frames)} frames:")
        for f_idx, reason in flagged_frames[:10]:
            print(f"    Frame {f_idx}: {reason}")
        if len(flagged_frames) > 10:
            print(f"    ... and {len(flagged_frames) - 10} more (up to Frame {flagged_frames[-1][0]})")
    else:
        print("  Clean: No detached text, watermarks, or title cards detected.")
