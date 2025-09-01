import sys
import json
import torch
import warnings
from PIL import Image
from transformers import pipeline
from diffusers import StableDiffusionImg2ImgPipeline

# Redirect all warnings to stderr
def custom_warn(message, category, filename, lineno, file=None, line=None):
    print(f"{category.__name__}: {message}", file=sys.stderr)
warnings.showwarning = custom_warn

# Redirect print statements from libraries to stderr
sys.stdout = sys.__stdout__
sys.stderr = sys.__stderr__

def generate_caption(image_path):
    captioner = pipeline(
        "image-to-text",
        model="nlpconnect/vit-gpt2-image-captioning",
        device=0 if torch.cuda.is_available() else -1
    )
    img = Image.open(image_path).convert("RGB")
    result = captioner(img)
    return result[0]['generated_text']

def build_prompt(caption, style_name):
    return f"{caption}. Transform this room into a {style_name} style."

def generate_styled_image(prompt, image_path, output_path):
    pipe = StableDiffusionImg2ImgPipeline.from_pretrained(
        "stabilityai/stable-diffusion-2-1",
        torch_dtype=torch.float16 if torch.cuda.is_available() else torch.float32
    )
    pipe = pipe.to("cuda" if torch.cuda.is_available() else "cpu")
    init_image = Image.open(image_path).convert("RGB").resize((512, 512))
    images = pipe(
        prompt=prompt,
        image=init_image,
        strength=0.7,
        guidance_scale=7.5,
        num_inference_steps=20  # Reduce steps for speed
    ).images
    styled_img = images[0]
    styled_img.save(output_path)
    return output_path

def main():
    args = sys.argv[1:]
    if len(args) < 3:
        print(json.dumps({"error": "Missing arguments"}))
        print("debug info...", file=sys.stderr)
        sys.exit(1)
    image_path, style_name, output_path = args
    try:
        caption = generate_caption(image_path)
        prompt = build_prompt(caption, style_name)
        result_path = generate_styled_image(prompt, image_path, output_path)
        # Print ONLY the final result to stdout
        print(json.dumps({"caption": caption, "prompt": prompt, "output_path": result_path}))
    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)

if __name__ == "__main__":
    main()