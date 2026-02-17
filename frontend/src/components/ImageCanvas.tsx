import React, { useRef, useEffect, useState } from 'react';

interface ImageCanvasProps {
  image: string;
  onMaskCreate: (maskBlob: Blob) => void;
}

const ImageCanvas: React.FC<ImageCanvasProps> = ({ image, onMaskCreate }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushSize, setBrushSize] = useState(20);
  const [canvasReady, setCanvasReady] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      setCanvasReady(true);
    };
    img.src = image;
  }, [image]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    draw(e);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing && e.type !== 'mousedown') return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((e.clientY - rect.top) / rect.height) * canvas.height;

    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
    ctx.beginPath();
    ctx.arc(x, y, brushSize, 0, Math.PI * 2);
    ctx.fill();
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
    };
    img.src = image;
  };

  const createMask = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Create a mask canvas
    const maskCanvas = document.createElement('canvas');
    maskCanvas.width = canvas.width;
    maskCanvas.height = canvas.height;
    const maskCtx = maskCanvas.getContext('2d');
    if (!maskCtx) return;

    // Get the original image data
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    // Create mask: white where red overlay exists, black otherwise
    const maskData = maskCtx.createImageData(canvas.width, canvas.height);
    for (let i = 0; i < data.length; i += 4) {
      // Check if pixel has red overlay (r > 200, g < 100, b < 100)
      if (data[i] > 200 && data[i + 1] < 100 && data[i + 2] < 100) {
        maskData.data[i] = 255; // R
        maskData.data[i + 1] = 255; // G
        maskData.data[i + 2] = 255; // B
        maskData.data[i + 3] = 255; // A
      } else {
        maskData.data[i] = 0;
        maskData.data[i + 1] = 0;
        maskData.data[i + 2] = 0;
        maskData.data[i + 3] = 255;
      }
    }

    maskCtx.putImageData(maskData, 0, 0);

    // Convert to blob
    maskCanvas.toBlob((blob) => {
      if (blob) {
        onMaskCreate(blob);
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <label className="text-sm font-medium text-gray-700">
            Brush Size: {brushSize}px
          </label>
          <input
            type="range"
            min="5"
            max="50"
            value={brushSize}
            onChange={(e) => setBrushSize(Number(e.target.value))}
            className="w-32"
          />
        </div>
        <div className="space-x-2">
          <button
            onClick={clearCanvas}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
          >
            Clear
          </button>
          <button
            onClick={createMask}
            disabled={!canvasReady}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors disabled:opacity-50"
          >
            Remove Selected
          </button>
        </div>
      </div>
      
      <div className="border rounded-lg overflow-hidden bg-gray-100">
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseUp={stopDrawing}
          onMouseMove={draw}
          onMouseLeave={stopDrawing}
          className="max-w-full h-auto cursor-crosshair"
          style={{ display: 'block', margin: '0 auto' }}
        />
      </div>
      
      <p className="text-sm text-gray-600 text-center">
        Click and drag to mark areas for removal (shown in red)
      </p>
    </div>
  );
};

export default ImageCanvas;
