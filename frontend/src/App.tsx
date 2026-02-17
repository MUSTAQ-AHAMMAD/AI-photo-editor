import React, { useState, useEffect } from 'react';
import ImageUpload from './components/ImageUpload';
import ImageCanvas from './components/ImageCanvas';
import ImagePreview from './components/ImagePreview';
import EditingPanel, { FilterType } from './components/EditingPanel';
import DownloadButton from './components/DownloadButton';
import * as api from './services/api';
import './styles/App.css';

function App() {
  const [originalImage, setOriginalImage] = useState<string | undefined>();
  const [processedImage, setProcessedImage] = useState<string | undefined>();
  const [currentFile, setCurrentFile] = useState<File | undefined>();
  const [isProcessing, setIsProcessing] = useState(false);
  const [showCanvas, setShowCanvas] = useState(false);
  const [aiEnabled, setAiEnabled] = useState(false);
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    // Check if AI features are enabled
    api.checkHealth()
      .then((health) => {
        setAiEnabled(health.ai_models_enabled);
      })
      .catch((err) => {
        console.error('Failed to check health:', err);
      });
  }, []);

  const handleImageSelect = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setOriginalImage(e.target?.result as string);
      setProcessedImage(undefined);
      setCurrentFile(file);
      setShowCanvas(false);
      setError(undefined);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveBackground = async () => {
    if (!currentFile) return;

    setIsProcessing(true);
    setError(undefined);
    try {
      const blob = await api.removeBackground(currentFile);
      const url = URL.createObjectURL(blob);
      setProcessedImage(url);
    } catch (err) {
      console.error('Background removal failed:', err);
      setError('Failed to remove background. Make sure the backend is running.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApplyFilter = async (filter: FilterType) => {
    if (!currentFile) return;

    setIsProcessing(true);
    setError(undefined);
    try {
      const blob = await api.applyFilter(currentFile, filter);
      const url = URL.createObjectURL(blob);
      setProcessedImage(url);
    } catch (err) {
      console.error('Filter application failed:', err);
      setError('Failed to apply filter. Make sure the backend is running.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAdjustBrightness = async (factor: number) => {
    if (!currentFile) return;

    setIsProcessing(true);
    setError(undefined);
    try {
      const blob = await api.adjustBrightness(currentFile, factor);
      const url = URL.createObjectURL(blob);
      setProcessedImage(url);
    } catch (err) {
      console.error('Brightness adjustment failed:', err);
      setError('Failed to adjust brightness. Make sure the backend is running.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGenerateImage = async (prompt: string, stylePreset: string, aspectRatio: string, negativePrompt: string) => {
    setIsProcessing(true);
    setError(undefined);
    try {
      const blob = await api.generateWithStyle(prompt, stylePreset, negativePrompt, aspectRatio);
      const url = URL.createObjectURL(blob);
      setProcessedImage(url);
    } catch (err) {
      console.error('Image generation failed:', err);
      setError('Failed to generate image. Make sure AI features are enabled in the backend.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGenerateFill = async (prompt: string, negativePrompt: string) => {
    if (!currentFile) return;

    setIsProcessing(true);
    setError(undefined);
    try {
      // This requires a mask from canvas - need to show canvas first
      setError('Please use the canvas to select an area first, then apply generative fill.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApplyStyleTransfer = async (stylePrompt: string, strength: number) => {
    if (!currentFile) return;

    setIsProcessing(true);
    setError(undefined);
    try {
      const blob = await api.applyStyleTransfer(currentFile, stylePrompt, strength);
      const url = URL.createObjectURL(blob);
      setProcessedImage(url);
    } catch (err) {
      console.error('Style transfer failed:', err);
      setError('Failed to apply style transfer. Make sure AI features are enabled.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGenerateTextEffect = async (text: string, style: string) => {
    setIsProcessing(true);
    setError(undefined);
    try {
      const blob = await api.generateTextEffect(text, style);
      const url = URL.createObjectURL(blob);
      setProcessedImage(url);
    } catch (err) {
      console.error('Text effect generation failed:', err);
      setError('Failed to generate text effect. Make sure AI features are enabled.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleOutpaint = async (direction: string, expandPixels: number, prompt: string) => {
    if (!currentFile) return;

    setIsProcessing(true);
    setError(undefined);
    try {
      const blob = await api.outpaintImage(
        currentFile,
        direction as 'left' | 'right' | 'top' | 'bottom' | 'all',
        expandPixels,
        prompt
      );
      const url = URL.createObjectURL(blob);
      setProcessedImage(url);
      setOriginalImage(url); // Update original to show extended image
    } catch (err) {
      console.error('Outpainting failed:', err);
      setError('Failed to extend image. Make sure AI features are enabled.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMaskCreate = async (maskBlob: Blob) => {
    if (!currentFile) return;

    setIsProcessing(true);
    setError(undefined);
    try {
      const maskFile = new File([maskBlob], 'mask.png', { type: 'image/png' });
      const blob = await api.inpaintImage(currentFile, maskFile, false);
      const url = URL.createObjectURL(blob);
      setProcessedImage(url);
      setShowCanvas(false);
    } catch (err) {
      console.error('Inpainting failed:', err);
      setError('Failed to remove objects. Make sure the backend is running.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="app-container">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <header className="text-center text-white space-y-2">
          <h1 className="text-5xl font-bold">AI Photo Editor</h1>
          <p className="text-xl opacity-90">
            Adobe Firefly-like AI photo editing • Professional image generation & manipulation
          </p>
        </header>

        {/* Error Message */}
        {error && (
          <div className="card bg-red-50 border-2 border-red-200">
            <p className="text-red-800 text-center">{error}</p>
          </div>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Upload and Tools */}
          <div className="space-y-6">
            <div className="card">
              <ImageUpload
                onImageSelect={handleImageSelect}
                disabled={isProcessing}
              />
            </div>

            {originalImage && (
              <>
                <EditingPanel
                  onRemoveBackground={handleRemoveBackground}
                  onApplyFilter={handleApplyFilter}
                  onAdjustBrightness={handleAdjustBrightness}
                  onGenerateImage={handleGenerateImage}
                  onGenerateFill={handleGenerateFill}
                  onApplyStyleTransfer={handleApplyStyleTransfer}
                  onGenerateTextEffect={handleGenerateTextEffect}
                  onOutpaint={handleOutpaint}
                  disabled={isProcessing}
                  aiEnabled={aiEnabled}
                  hasImage={!!originalImage}
                />

                <div className="card">
                  <button
                    onClick={() => setShowCanvas(!showCanvas)}
                    disabled={isProcessing}
                    className="w-full px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 transition-colors disabled:opacity-50"
                  >
                    {showCanvas ? 'Hide' : 'Show'} Object Removal Tool
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Right Column - Preview and Canvas */}
          <div className="lg:col-span-2 space-y-6">
            <div className="card">
              <ImagePreview
                originalImage={originalImage}
                processedImage={processedImage}
                isProcessing={isProcessing}
              />
            </div>

            {showCanvas && originalImage && (
              <div className="card">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">
                  Object Removal
                </h2>
                <ImageCanvas
                  image={originalImage}
                  onMaskCreate={handleMaskCreate}
                />
              </div>
            )}

            {processedImage && (
              <div className="card flex justify-center">
                <DownloadButton
                  imageUrl={processedImage}
                  filename="ai-edited-image.png"
                  disabled={isProcessing}
                />
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <footer className="text-center text-white text-sm opacity-75">
          <p>
            Built with FastAPI, React, and cutting-edge AI models • © 2024 AI Photo Editor
          </p>
        </footer>
      </div>
    </div>
  );
}

export default App;
