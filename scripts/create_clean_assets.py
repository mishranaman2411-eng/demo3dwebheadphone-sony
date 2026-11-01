import os
import shutil
import glob
import subprocess
from PIL import Image

def main():
    print("=== CREATING CLEANED ASSETS (STEP 2, 3, 4) ===")
    
    # 1. Directories
    os.makedirs("videos_clean", exist_ok=True)
    os.makedirs("public/frames_clean", exist_ok=True)
    
    # 2. Process Video 1 (Remove embedded SONY text from frames 1-65)
    print("\n--- Processing Cleaned Video 1 ---")
    v1_clean_dir = "public/frames_clean/video-1"
    os.makedirs(v1_clean_dir, exist_ok=True)
    
    # Base pure white image from Frame 1
    f1_original = "public/frames/video-1/frame_000001.webp"
    pure_white_img = Image.open(f1_original).copy()
    w, h = pure_white_img.size
    
    for f in range(1, 106):
        pad = f"{f:06d}"
        clean_fpath = os.path.join(v1_clean_dir, f"frame_{pad}.webp")
        orig_fpath = f"public/frames/video-1/frame_{pad}.webp"
        
        if f <= 65:
            # In frames 1 to 65, headphones have not entered the frame yet.
            # Save the clean pure white frame with zero embedded text/logo.
            pure_white_img.save(clean_fpath, "WEBP", quality=82)
        else:
            # From frame 66 to 105, headphones ascend into the frame.
            # Copy original frame untouched.
            shutil.copy2(orig_fpath, clean_fpath)
            
    print(f"Cleaned {len(os.listdir(v1_clean_dir))} frames in {v1_clean_dir}")
    
    # Render videos_clean/1.mp4 from cleaned frames
    print("Rendering videos_clean/1.mp4...")
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

    # 3. Process Videos 2 through 10
    for v in range(2, 11):
        print(f"\n--- Populating Clean Assets for Video {v} ---")
        # Video file
        src_video = f"videos/{v}.mp4"
        dst_video = f"videos_clean/{v}.mp4"
        if os.path.exists(src_video):
            shutil.copy2(src_video, dst_video)
            print(f"Copied {src_video} -> {dst_video}")
            
        # Clean frames directory
        clean_dir = f"public/frames_clean/video-{v}"
        os.makedirs(clean_dir, exist_ok=True)
        orig_frames = sorted(glob.glob(f"public/frames/video-{v}/*.webp"))
        for fpath in orig_frames:
            fname = os.path.basename(fpath)
            dst_fpath = os.path.join(clean_dir, fname)
            shutil.copy2(fpath, dst_fpath)
        print(f"Copied {len(orig_frames)} frames -> {clean_dir}")

    print("\n=== ALL CLEANED ASSETS SUCCESSFULLY CREATED! ===")

if __name__ == "__main__":
    main()
