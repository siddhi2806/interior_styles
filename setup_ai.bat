@echo off
echo ========================================
echo    Room Styler AI - Quick Setup
echo ========================================
echo.

echo [1/4] Installing PyTorch with CUDA support...
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118

echo.
echo [2/4] Installing AI dependencies...
pip install diffusers transformers pillow accelerate huggingface_hub requests

echo.
echo [3/4] Testing PyTorch installation...
python -c "import torch; print('PyTorch version:', torch.__version__); print('CUDA available:', torch.cuda.is_available())"

echo.
echo [4/4] Testing AI pipeline...
echo This will download models on first run (may take 15-30 minutes)
python test_ai_setup.py

echo.
echo ========================================
echo    Setup Complete!
echo ========================================
echo Run 'npm run dev' to start the application
pause
