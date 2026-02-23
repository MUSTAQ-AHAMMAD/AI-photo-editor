import { useState, useCallback, useEffect } from 'react';
import ImageUpload from './components/ImageUpload';
import ImageCanvas from './components/ImageCanvas';
import ImagePreview from './components/ImagePreview';
import EditingPanel, { FilterType } from './components/EditingPanel';
import DownloadButton from './components/DownloadButton';
import MultiEngineGenerationPanel from './components/MultiEngineGenerationPanel';
import type { MultiEngineGenerationResult } from './components/MultiEngineGenerationPanel';
import GenerationHistory from './components/GenerationHistory';
import type { HistoryEntry } from './components/GenerationHistory';
import ComparisonView from './components/ComparisonView';
import MultiFormatDownload from './components/MultiFormatDownload';
import * as api from './services/api';
import './styles/App.css';

type AppTab = 'editor' | 'generate';

function App() {
  const [appTab, setAppTab] = useState<AppTab>('generate');
  const [originalImage, setOriginalImage] = useState<string | undefined>();
  const [processedImage, setProcessedImage] = useState<string | undefined>();
  const [currentFile, setCurrentFile] = useState<File | undefined>();
  const [isProcessing, setIsProcessing] = useState(false);
  const [showCanvas, setShowCanvas] = useState(false);
  const [aiEnabled, setAiEnabled] = useState(false);
  const [error, setError] = useState<string | undefined>();

  // Multi-engine generation state
  const [generatedImage, setGeneratedImage] = useState<string | undefined>();
  const [generatedImageMeta, setGeneratedImageMeta] = useState<{ engineName: string; promptUsed: string; outputFormat: string } | undefined>();
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [compareEntries, setCompareEntries] = useState<[HistoryEntry, HistoryEntry] | null>(null);

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

  const handleGenerationResult = useCallback((result: MultiEngineGenerationResult) => {
    const url = URL.createObjectURL(result.blob);
    setGeneratedImage(url);
    setGeneratedImageMeta({
      engineName: result.engineName,
      promptUsed: result.promptUsed,
      outputFormat: result.outputFormat,
    });
    // Use crypto.randomUUID when available (modern browsers), otherwise fall back to a timestamp-based id
    const genId =
      typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const entry: HistoryEntry = {
      id: genId,
      imageUrl: url,
      prompt: result.prompt,
      engineName: result.engineName,
      engineId: result.engineId,
      timestamp: Date.now(),
      outputFormat: result.outputFormat,
    };
    setHistory((prev) => [entry, ...prev].slice(0, 24));
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

  const handleGenerateFill = async (_prompt: string, _negativePrompt: string) => {
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
            Multi-engine AI image generation &amp; professional editing
          </p>
          {/* App-level Tab Navigation */}
          <div className="flex justify-center gap-3 pt-2">
            {([
              { id: 'generate' as AppTab, label: '✨ Generate', icon: '🚀' },
              { id: 'editor' as AppTab, label: '🎨 Editor', icon: '✏️' },
            ] as const).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setAppTab(tab.id)}
                className={`px-6 py-2.5 rounded-full font-semibold text-sm transition-all duration-200 ${
                  appTab === tab.id
                    ? 'bg-white text-indigo-700 shadow-lg'
                    : 'bg-white/20 text-white hover:bg-white/30'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </header>

        {/* Error Message */}
        {error && (
          <div className="card bg-red-50 border-2 border-red-200">
            <p className="text-red-800 text-center">{error}</p>
          </div>
        )}

        {/* ===================== GENERATE TAB ===================== */}
        {appTab === 'generate' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Generation Controls */}
            <div className="lg:col-span-1 space-y-4">
              <MultiEngineGenerationPanel
                onResult={handleGenerationResult}
                disabled={false}
              />
            </div>

            {/* Right: Result + History */}
            <div className="lg:col-span-2 space-y-6">
              {/* Generated Image Preview */}
              <div className="card space-y-4">
                {generatedImage ? (
                  <>
                    <div className="flex items-center justify-between">
                      <h2 className="text-xl font-bold text-gray-800">Generated Image</h2>
                      {generatedImageMeta && (
                        <span className="text-xs bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full font-medium">
                          {generatedImageMeta.engineName}
                        </span>
                      )}
                    </div>
                    {generatedImageMeta && (
                      <p className="text-xs text-gray-500 italic truncate">
                        Prompt: {generatedImageMeta.promptUsed}
                      </p>
                    )}
                    <img
                      src={generatedImage}
                      alt="Generated"
                      className="w-full rounded-xl shadow-md object-contain max-h-[60vh]"
                    />
                    <MultiFormatDownload
                      imageUrl={generatedImage}
                      baseFilename="ai-generated"
                    />
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-64 text-gray-400 space-y-3">
                    <span className="text-6xl">🎨</span>
                    <p className="text-lg font-medium">Your generated image will appear here</p>
                    <p className="text-sm">Choose an engine, enter a prompt, and click Generate</p>
                  </div>
                )}
              </div>

              {/* Generation History */}
              <div className="card">
                <GenerationHistory
                  history={history}
                  onSelect={(entry) => setGeneratedImage(entry.imageUrl)}
                  onClear={() => setHistory([])}
                  onCompare={(entries) => setCompareEntries(entries)}
                />
              </div>
            </div>
          </div>
        )}

        {/* ===================== EDITOR TAB ===================== */}
        {appTab === 'editor' && (
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
        )}

        {/* Footer */}
        <footer className="text-center text-white text-sm opacity-75">
          <p>
            Built with FastAPI, React, and cutting-edge AI models • © 2024 AI Photo Editor
          </p>
        </footer>
      </div>

      {/* Side-by-side Comparison Modal */}
      {compareEntries && (
        <ComparisonView
          entries={compareEntries}
          onClose={() => setCompareEntries(null)}
        />
      )}
    </div>
  );
}

export default App;
