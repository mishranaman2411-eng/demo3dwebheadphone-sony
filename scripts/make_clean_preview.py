from PIL import Image

# Generate 3x3 grid for cleaned video 1
grid = Image.new('RGB', (1920, 1080))
indices = [1, 14, 27, 40, 53, 66, 79, 92, 105]

for i, idx in enumerate(indices):
    fpath = f"public/frames_clean/video-1/frame_{idx:06d}.webp"
    im = Image.open(fpath).resize((640, 360))
    x = (i % 3) * 640
    y = (i // 3) * 360
    grid.paste(im, (x, y))

grid.save("tasks/previews/clean_1_grid.jpg")
print("Saved clean_1_grid.jpg")
