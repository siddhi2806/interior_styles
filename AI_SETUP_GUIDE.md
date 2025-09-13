# Room Styler AI - Setup & Usage Guide

This project uses Hugging Face Transformers and Diffusers to caption and style room images using AI (BLIP + Stable Diffusion).
Follow these steps to set up and run the AI pipeline after cloning the repo.

## 🚀 Quick Start Checklist

- [x] Clone the repo
- [x] Install Python dependencies
- [x] Pre-download AI models
- [x] Test the AI pipeline
- [x] Verify PyTorch/CUDA setup

## 1. Install Python Dependencies

Open a terminal in your project root and run:

```bash
# For CUDA-enabled systems (NVIDIA GPU):
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118

# For CPU-only systems:
pip install torch torchvision torchaudio

# Install AI dependencies:
pip install diffusers transformers pillow accelerate
```

**Note:**

- If you have an NVIDIA GPU, make sure you install the correct CUDA version of PyTorch
- The system will automatically fall back to CPU if CUDA is not available

## 2. Verify PyTorch Installation

Test your PyTorch setup:

```bash
python -c "import torch; print('PyTorch version:', torch.__version__); print('CUDA version:', torch.version.cuda); print('CUDA available:', torch.cuda.is_available())"
```

**Expected Output:**

```
PyTorch version: 2.7.1+cu118  (or similar)
CUDA version: 11.8  (or None for CPU-only)
CUDA available: True/False
```

## 3. Pre-download Models (Recommended)

Run the Python script once to download and cache the required models:

```bash
python src/python/room_styler.py tmp/your_test_image.png "Modern" tmp/test_styled.png
```

This will download:

- **BLIP** (`nlpconnect/vit-gpt2-image-captioning`) - for image captioning
- **Stable Diffusion 2.1** (`stabilityai/stable-diffusion-2-1`) - for image generation

⏱️ **First run will be slow** (15-30 minutes for model downloads), but future runs will be much faster.

## 4. How the AI Pipeline Works

### Image Captioning:

- Uses **BLIP** to generate a descriptive caption for the input room image
- Example: "a bedroom with a bed, a lamp, and a window"

### Prompt Building:

- Combines the generated caption with the selected style
- Example: "a bedroom with a bed, a lamp, and a window. Transform this room into a Modern style."

### Image Styling:

- Uses **Stable Diffusion** to generate a styled image based on the prompt
- Supports styles: Industrial, Minimalist, Rustic, Scandinavian, Bohemian, Modern

## 5. Python Script Details

- ✅ All warnings and progress bars are redirected to stderr
- ✅ Automatically uses GPU if available (`torch.cuda.is_available()`)
- ✅ Configurable speed/quality via `num_inference_steps` and image size
- ✅ Only final JSON result printed to stdout for backend parsing

### Performance Tuning:

- **GPU**: ~2-5 minutes per image
- **CPU**: ~10-20 minutes per image
- Reduce `num_inference_steps` (default: 20) for faster processing
- Adjust image size (default: 512x512) for quality vs speed

## 6. Backend Integration

The backend:

1. Calls the Python script with image path and style
2. Parses the JSON output
3. Uploads generated image to Supabase Storage
4. Returns public URL to frontend

## 7. Testing the Complete Pipeline

Use this command to test everything:

```bash
python src/python/room_styler.py tmp/1756369989231_room.png "Modern" tmp/test_output.png
```

**Expected JSON Output:**

```json
{
  "caption": "a bedroom with a bed, a lamp, and a window",
  "prompt": "a bedroom with a bed, a lamp, and a window. Transform this room into a Modern style.",
  "output_path": "tmp/test_output.png"
}
```

## 8. Troubleshooting

### Common Issues:

**503 Errors:**

- Ensure Python script prints only JSON to stdout
- Check that all warnings go to stderr

**Slow Performance:**

- Use GPU if available
- Reduce `num_inference_steps` in the script
- Consider smaller image sizes

**Models Re-downloading:**

- Check Hugging Face cache directory: `~/.cache/huggingface/`
- Ensure stable internet connection during first run

**Import Errors:**

- Verify all dependencies are installed in the correct environment
- Check Python version compatibility (3.8+)

### Performance Optimization:

```python
# In room_styler.py, adjust these parameters:
num_inference_steps=15  # Faster (was 20)
guidance_scale=7.5      # Standard
width=512, height=512   # Standard resolution
```

## 9. Environment Variables

Set these for optimal performance:

```bash
# Disable symlink warnings (Windows)
set HF_HUB_DISABLE_SYMLINKS_WARNING=1

# Use local cache
set TRANSFORMERS_CACHE=./models_cache
```

## 10. Quick Start Commands

```bash
# 1. Install dependencies
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118
pip install diffusers transformers pillow accelerate

# 2. Test PyTorch
python -c "import torch; print('CUDA available:', torch.cuda.is_available())"

# 3. Download models (first run)
python src/python/room_styler.py tmp/1756369989231_room.png "Modern" tmp/test.png

# 4. Start your backend/frontend
npm run dev
```

## ✅ Success Indicators

- PyTorch imports without errors
- Models download successfully to cache
- JSON output generated correctly
- Styled images created in tmp/ folder
- Backend can parse the JSON output

**Enjoy your AI-powered room styling! 🎨🏠**
