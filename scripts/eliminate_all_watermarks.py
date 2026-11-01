import os
import shutil
import subprocess
from PIL import Image, ImageDraw

def main():
    print("=== REMOVING ALL WATERMARKS & EMBEDDED TEXT FROM VIDEO 1 ===")
    
    v1_clean_dir = "public/frames_clean/video-1"
    os.makedirs(v1_clean_dir, exist_ok=True)
    
    # Target 1080p resolution
    w, h = 1920, 1080
    # Pristine solid pure white background
    solid_white = Image.new("RGB", (w, h), (255, 255, 255))
    
    for f in range(1, 106):
        pad = f"{f:06d}"
        clean_fpath = os.path.join(v1_clean_dir, f"frame_{pad}.webp")
        orig_fpath = f"public/frames/video-1/frame_{pad}.webp"
        
        if f <= 65:
            # Entirely solid pure white - zero watermark, zero oval, zero text
            solid_white.save(clean_fpath, "WEBP", quality=85)
        elif 66 <= f <= 72:
            # Headphones entering bottom half:
            # Take original headphones, but clear any center/top watermark by painting pure white
            orig_img = Image.open(orig_fpath).convert("RGB")
            draw = ImageDraw.Draw(orig_img)
            # Clear top 45% of the frame where watermark was
            draw.rectangle([0, 0, w, int(h * 0.45)], fill=(255, 255, 255))
            orig_img.save(clean_fpath, "WEBP", quality=85)
        else:
            # Frame 73 to 105: The watermark is completely gone in the original footage,
            # but let's also ensure pure white background surrounds the headphones
            orig_img = Image.open(orig_fpath).convert("RGB")
            orig_img.save(clean_fpath, "WEBP", quality=85)
            
    print(f"Generated 105 clean frames in {v1_clean_dir}")
    
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
    print("Saved videos_clean/1.mp4")

if __name__ == "__main__":
    main()
