import os
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

check_image_for_text("tasks/previews/1_grid.jpg", "Video 1 Grid (Intro)")
check_image_for_text("tasks/previews/2_grid.jpg", "Video 2 Grid (Explosion)")
check_image_for_text("tasks/previews/3_grid.jpg", "Video 3 Grid (Acoustic Driver)")
