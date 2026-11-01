from google import genai
from PIL import Image

client = genai.Client()

def check_image_for_text(image_path, description):
    img = Image.open(image_path)
    prompt = (
        "Carefully examine this image from a product video. "
        "List ANY and ALL embedded text, typography, headings, captions, subtitles, watermarks, or overlay logos present in the frame. "
        "Distinguish between: "
        "1) Graphic/overlay typography or embedded title text, headings, or captions. "
        "2) Physical hardware branding molded/printed on the headphone plastic itself. "
        "Be extremely specific about what words appear, where they are located, and whether any text or logo is digitally superimposed."
    )
    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=[img, prompt]
    )
    print(f"\n=== Audit: {description} ({image_path}) ===")
    print(response.text)

check_image_for_text("tasks/previews/5-upscaled-2x_grid.jpg", "Video 5 Grid (Controls & Durability)")
check_image_for_text("tasks/previews/6-upscaled-2x_grid.jpg", "Video 6 Grid (Battery & 360 Halo)")
check_image_for_text("tasks/previews/7-upscaled-2x_grid.jpg", "Video 7 Grid (Comfort & Cushions)")
check_image_for_text("tasks/previews/8-upscaled-2x_grid.jpg", "Video 8 Grid (Bluetooth Multipoint)")
check_image_for_text("tasks/previews/10_grid.jpg", "Video 10 Grid (Hero Outro)")
