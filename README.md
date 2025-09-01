# Room Styler AI - Setup & Usage Guide

This project uses **Hugging Face Transformers** and **Diffusers** to caption and style room images using AI (BLIP + Stable Diffusion).  
Follow these steps to set up and run the AI pipeline after cloning the repo.

---

## 1. **Install Python Dependencies**

Open a terminal in your project root and run:

```sh
pip install torch torchvision torchaudio --extra-index-url https://download.pytorch.org/whl/cu118
pip install diffusers transformers pillow accelerate
```

> **Note:**  
> If you have an NVIDIA GPU, make sure you install the correct CUDA version of PyTorch.

---

## 2. **Pre-download Models (Optional but Recommended)**

Run the Python script once to download and cache the required models:

```sh
python src/python/room_styler.py tmp/your_test_image.png "Modern" tmp/test_styled.png
```

- This will download BLIP (`nlpconnect/vit-gpt2-image-captioning`) and Stable Diffusion (`stabilityai/stable-diffusion-2-1`) models.
- The first run will be slow; future runs will be much faster.

---

## 3. **How the AI Pipeline Works**

- **Image Captioning:**  
  Uses BLIP to generate a caption for the input room image.
- **Prompt Building:**  
  Combines the caption and selected style to create a prompt.
- **Image Styling:**  
  Uses Stable Diffusion to generate a styled image based on the prompt.

---

## 4. **Python Script Details**

- All warnings and progress bars are redirected to `stderr` to avoid breaking backend parsing.
- The script automatically uses GPU if available (`torch.cuda.is_available()`).
- You can adjust speed/quality by changing `num_inference_steps` and image size in `generate_styled_image`.

---

## 5. **Backend Integration**

- The backend calls the Python script, uploads the generated image to Supabase Storage, and returns a public URL.
- Only the final JSON result is printed to `stdout` for reliable parsing.

---

## 6. **Troubleshooting**

- If you see `503` errors, make sure your Python script prints only JSON to `stdout`.
- If rendering is slow, try reducing `num_inference_steps` or use a GPU.
- If models re-download every time, check your Hugging Face cache directory.

---

## 7. **Quick Start Checklist**

1. Clone the repo.
2. Install dependencies (`pip install ...`).
3. Run the Python script once to download models.
4. Start your backend/frontend.
5. Upload an image and transform with AI!

---

**Enjoy your AI-import torch
print(torch.version.cuda)
print(torch.cuda.is_available())