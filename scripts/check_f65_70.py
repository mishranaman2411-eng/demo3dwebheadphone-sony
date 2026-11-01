from PIL import Image

for f in [65, 66, 67, 68, 69, 70]:
    im = Image.open(f"public/frames/video-1/frame_{f:06d}.webp")
    # Save a thumbnail
    im.resize((480, 270)).save(f"tasks/previews/orig_f{f}.jpg")
    print(f"Saved orig_f{f}.jpg")
