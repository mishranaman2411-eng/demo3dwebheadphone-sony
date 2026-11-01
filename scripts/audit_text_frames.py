import os
import glob
from PIL import Image, ImageStat, ImageFilter

def analyze_video(v):
    frame_dir = f"public/frames/video-{v}"
    if not os.path.exists(frame_dir):
        print(f"Video {v}: Directory not found")
        return
    frames = sorted(glob.glob(f"{frame_dir}/*.webp"))
    print(f"\n=== Video {v}: {len(frames)} frames ===")
    
    # Check every 10th frame
    for idx in range(0, len(frames), max(1, len(frames)//10)):
        fpath = frames[idx]
        img = Image.open(fpath)
        # Check center region, top, bottom
        w, h = img.size
        # Center crop (30% to 70%)
        center = img.crop((int(w*0.3), int(h*0.3), int(w*0.7), int(h*0.7)))
        top = img.crop((int(w*0.1), 0, int(w*0.9), int(h*0.25)))
        bottom = img.crop((int(w*0.1), int(h*0.75), int(w*0.9), h))
        
        # Check edge variance (text produces high frequency edges)
        edges = img.convert('L').filter(ImageFilter.FIND_EDGES)
        stat = ImageStat.Stat(edges)
        
        fname = os.path.basename(fpath)
        print(f"  [{fname}] size={w}x{h}, edge_mean={stat.mean[0]:.2f}, edge_std={stat.stddev[0]:.2f}")

for v in range(1, 11):
    analyze_video(v)
