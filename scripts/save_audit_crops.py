from PIL import Image

for v in [1, 5, 6, 7, 8, 10]:
    fpath = f"public/frames/video-{v}/frame_000050.webp"
    img = Image.open(fpath)
    w, h = img.size
    # Save crops of bottom-left, bottom-right, and center
    bl = img.crop((0, int(h*0.8), int(w*0.3), h))
    br = img.crop((int(w*0.7), int(h*0.8), w, h))
    bl.save(f"tasks/previews/audit_v{v}_bl.jpg")
    br.save(f"tasks/previews/audit_v{v}_br.jpg")
    print(f"Saved crops for video {v}")
