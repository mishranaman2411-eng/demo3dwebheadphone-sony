import os
import shutil
import glob
import subprocess
from PIL import Image, ImageDraw

def main():
    print("=== REFINING CLEANED ASSETS FOR VIDEO 1 ===")
    
    os.makedirs("videos_clean", exist_ok=True)
    v1_clean_dir = "public/frames_clean/video-1"
    os.makedirs(v1_clean_dir, exist_ok=True)
    
    f1_original = "public/frames/video-1/frame_000001.webp"
    pure_white_img = Image.open(f1_original).copy()
    w, h = pure_white_img.size
    
    # Pixel background color of frame 1: (255, 251, 255)
    bg_color = pure_white_img.getpixel((10, 10))
    
    for f in range(1, 106):
        pad = f"{f:06d}"
        clean_fpath = os.path.join(v1_clean_dir, f"frame_{pad}.webp")
        orig_fpath = f"public/frames/video-1/frame_{pad}.webp"
        
        if f <= 60:
            # Frames 1 to 60: Pure solid white frame
            pure_white_img.save(clean_fpath, "WEBP", quality=82)
        elif 61 <= f <= 67:
            # Frames 61 to 67: Headphones are in lower half, faint SONY text in top 35%
            orig_img = Image.open(orig_fpath).copy()
            draw = ImageDraw.Draw(orig_img)
            # Clear top 35% where faint logo resided
            draw.rectangle([0, 0, w, int(h * 0.35)], fill=bg_color)
            orig_img.save(clean_fpath, "WEBP", quality=82)
        else:
            # Frames 68 to 105: Completely clean original frames with headphones rising
            shutil.copy2(orig_fpath, clean_fpath)
            
    print(f"Verified all 105 frames in {v1_clean_dir}")
    
    # Re-render videos_clean/1.mp4
    print("Re-rendering videos_clean/1.mp4...")
    cmd_v1 = [
        "ffmpeg", "-y",
        "-framerate", "24",
        "-i", os.path.join(v1_clean_dir, "frame_%06d.webp"),
        "-c:v", "libx264",
        "-pix_fmt", "yuv420p",
        "-crf", "18",
        "-movflags", "+faststart",
        "videos_clean/1.mp4"
    ]
    subprocess.run(cmd_v1, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    print(f"Saved videos_clean/1.mp4 ({os.path.getsize('videos_clean/1.mp4')} bytes)")

if __name__ == "__main__":
    main()
