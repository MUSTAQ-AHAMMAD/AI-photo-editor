import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Image as ImageIcon, Upload, Wand2, Menu, X, Sparkles } from 'lucide-react';
import Sidebar from './components/Sidebar';
import PromptWorkspace from './components/PromptWorkspace';
import GalleryView from './components/GalleryView';
import ImageUpload from './components/ImageUpload';
import ImagePreview from './components/ImagePreview';
import EditingPanel, { FilterType } from './components/EditingPanel';
import DownloadButton from './components/DownloadButton';
import ImageCanvas from './components/ImageCanvas';
import ComparisonView from './components/ComparisonView';
import type { MultiEngineGenerationResult } from './components/MultiEngineGenerationPanel';
import type { HistoryEntry } from './components/GenerationHistory';
import { useAppStore } from './store';
import * as api from './services/api';
import './styles/App.css';

function App() {
  const { appTab, setAppTab } = useAppStore();

  // Generate tab state
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | undefined>();
  const [generatedImageMeta, setGeneratedImageMeta] = useState<{ engineName: string; promptUsed: string; outputFormat: string } | undefined>();
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [compareEntries, setCompareEntries] = useState<[HistoryEntry, HistoryEntry] | null>(null);

  // Editor tab state
  const [originalImage, setOriginalImage] = useState<string | undefined>();
  const [processedImage, setProcessedImage] = useState<string | undefined>();
  const [currentFile, setCurrentFile] = useState<File | undefined>();
  const [isProcessing, setIsProcessing] = useState(false);
  const [showCanvas, setShowCanvas] = useState(false);
  const [error, setError] = useState<string | undefined>();

  // Mobile sidebar
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const handleGenerationResult = useCallback((result: MultiEngineGenerationResult) => {
    const url = URL.createObjectURL(result.blob);
    setGeneratedImage(url);
    setGeneratedImageMeta({ engineName: result.engineName, promptUsed: result.promptUsed, outputFormat: result.outputFormat });
    const genId = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const entry: HistoryEntry = {
      id: genId, imageUrl: url, prompt: result.prompt,
      engineName: result.engineName, engineId: result.engineId,
      timestamp: Date.now(), outputFormat: result.outputFormat,
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
    setIsProcessing(true); setError(undefined);
    try { const blob = await api.removeBackground(currentFile); setProcessedImage(URL.createObjectURL(blob)); }
    catch (err) { console.error('Background removal failed:', err); setError('Failed to remove background.'); }
    finally { setIsProcessing(false); }
  };

  const handleApplyFilter = async (filter: FilterType) => {
    if (!currentFile) return;
    setIsProcessing(true); setError(undefined);
    try { const blob = await api.applyFilter(currentFile, filter); setProcessedImage(URL.createObjectURL(blob)); }
    catch (err) { console.error('Filter failed:', err); setError('Failed to apply filter.'); }
    finally { setIsProcessing(false); }
  };

  const handleAdjustBrightness = async (factor: number) => {
    if (!currentFile) return;
    setIsProcessing(true); setError(undefined);
    try { const blob = await api.adjustBrightness(currentFile, factor); setProcessedImage(URL.createObjectURL(blob)); }
    catch (err) { console.error('Brightness adjustment failed:', err); setError('Failed to adjust brightness.'); }
    finally { setIsProcessing(false); }
  };

  const handleGenerateImage = async (prompt: string, stylePreset: string, aspectRatio: string, negativePrompt: string) => {
    setIsProcessing(true); setError(undefined);
    try { const blob = await api.generateWithStyle(prompt, stylePreset, negativePrompt, aspectRatio); setProcessedImage(URL.createObjectURL(blob)); }
    catch (err) { console.error('Image generation failed:', err); setError('Failed to generate image.'); }
    finally { setIsProcessing(false); }
  };

  const handleGenerateFill = async (_prompt: string, _negativePrompt: string) => {
    setError('Please use the canvas to select an area first, then apply generative fill.');
  };

  const handleApplyStyleTransfer = async (stylePrompt: string, strength: number) => {
    if (!currentFile) return;
    setIsProcessing(true); setError(undefined);
    try { const blob = await api.applyStyleTransfer(currentFile, stylePrompt, strength); setProcessedImage(URL.createObjectURL(blob)); }
    catch (err) { console.error('Style transfer failed:', err); setError('Failed to apply style transfer.'); }
    finally { setIsProcessing(false); }
  };

  const handleGenerateTextEffect = async (text: string, style: string) => {
    setIsProcessing(true); setError(undefined);
    try { const blob = await api.generateTextEffect(text, style); setProcessedImage(URL.createObjectURL(blob)); }
    catch (err) { console.error('Text effect failed:', err); setError('Failed to generate text effect.'); }
    finally { setIsProcessing(false); }
  };

  const handleOutpaint = async (direction: string, expandPixels: number, prompt: string) => {
    if (!currentFile) return;
    setIsProcessing(true); setError(undefined);
    try {
      const blob = await api.outpaintImage(currentFile, direction as 'left'|'right'|'top'|'bottom'|'all', expandPixels, prompt);
      const url = URL.createObjectURL(blob);
      setProcessedImage(url); setOriginalImage(url);
    }
    catch (err) { console.error('Outpaint failed:', err); setError('Failed to extend image.'); }
    finally { setIsProcessing(false); }
  };

  const handleMaskCreate = async (maskBlob: Blob) => {
    if (!currentFile) return;
    setIsProcessing(true); setError(undefined);
    try {
      const maskFile = new File([maskBlob], 'mask.png', { type: 'image/png' });
      const blob = await api.inpaintImage(currentFile, maskFile, false);
      setProcessedImage(URL.createObjectURL(blob));
      setShowCanvas(false);
    }
    catch (err) { console.error('Inpaint failed:', err); setError('Failed to remove objects.'); }
    finally { setIsProcessing(false); }
  };

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#0E0E11' }}>
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {mobileSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 lg:hidden"
          >
            <div className="absolute inset-0 bg-black/60" onClick={() => setMobileSidebarOpen(false)} />
            <motion.div
              initial={{ x: -220 }}
              animate={{ x: 0 }}
              exit={{ x: -220 }}
              transition={{ duration: 0.25 }}
              className="relative z-50"
            >
              <Sidebar />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Bar */}
        <header className="flex-shrink-0 flex items-center justify-between px-4 md:px-6 py-3 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            {/* Mobile menu */}
            <button
              className="lg:hidden p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5"
              onClick={() => setMobileSidebarOpen(true)}
            >
              <Menu size={20} />
            </button>

            {/* Tab switcher */}
            <div className="flex gap-1 p-1 rounded-xl bg-white/[0.04] border border-white/[0.06]">
              <button
                onClick={() => setAppTab('generate')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                  appTab === 'generate'
                    ? 'bg-accent-purple text-white shadow-glow-purple'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Sparkles size={13} /> Generate
              </button>
              <button
                onClick={() => setAppTab('editor')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                  appTab === 'editor'
                    ? 'bg-accent-purple text-white'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Wand2 size={13} /> Editor
              </button>
            </div>
          </div>

          {/* Status badge */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-accent-teal/10 border border-accent-teal/20 text-accent-teal text-[11px] font-medium">
              <div className="w-1.5 h-1.5 rounded-full bg-accent-teal animate-pulse" />
              AI Ready
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {/* Error Banner */}
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-between">
              <p className="text-sm text-red-400">{error}</p>
              <button onClick={() => setError(undefined)} className="text-red-400 hover:text-red-300">
                <X size={16} />
              </button>
            </div>
          )}

          {/* ===== GENERATE TAB ===== */}
          {appTab === 'generate' && (
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 md:gap-6">
              {/* Left: Prompt + Controls */}
              <div className="xl:col-span-5 glass-card p-5">
                <div className="flex items-center gap-2 mb-5">
                  <div className="w-6 h-6 rounded-lg bg-accent-purple/20 flex items-center justify-center">
                    <Sparkles size={12} className="text-accent-purple" />
                  </div>
                  <h2 className="text-sm font-semibold text-white">Create</h2>
                </div>
                <PromptWorkspace
                  onResult={handleGenerationResult}
                  isGenerating={isGenerating}
                  setIsGenerating={setIsGenerating}
                />
              </div>

              {/* Right: Gallery */}
              <div className="xl:col-span-7">
                <GalleryView
                  generatedImage={generatedImage}
                  generatedImageMeta={generatedImageMeta}
                  isGenerating={isGenerating}
                  history={history}
                  onSelectFromHistory={(entry) => {
                    setGeneratedImage(entry.imageUrl);
                    setGeneratedImageMeta({ engineName: entry.engineName, promptUsed: entry.prompt, outputFormat: entry.outputFormat });
                  }}
                />
              </div>
            </div>
          )}

          {/* ===== EDITOR TAB ===== */}
          {appTab === 'editor' && (
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 md:gap-6">
              {/* Left: Upload + Tools */}
              <div className="xl:col-span-4 space-y-4">
                <div className="glass-card p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-6 h-6 rounded-lg bg-accent-purple/20 flex items-center justify-center">
                      <Upload size={12} className="text-accent-purple" />
                    </div>
                    <h2 className="text-sm font-semibold text-white">Upload Image</h2>
                  </div>
                  <ImageUpload onImageSelect={handleImageSelect} disabled={isProcessing} />
                </div>

                {originalImage && (
                  <>
                    <div className="glass-card p-5">
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
                        aiEnabled={true}
                        hasImage={!!originalImage}
                      />
                    </div>
                    <div className="glass-card p-4">
                      <button
                        onClick={() => setShowCanvas(!showCanvas)}
                        disabled={isProcessing}
                        className="w-full py-2.5 rounded-xl text-sm font-semibold text-white border border-orange-500/30 bg-orange-500/10 hover:bg-orange-500/20 transition-colors disabled:opacity-50"
                      >
                        {showCanvas ? 'Hide' : 'Show'} Object Removal Tool
                      </button>
                    </div>
                  </>
                )}
              </div>

              {/* Right: Preview + Canvas */}
              <div className="xl:col-span-8 space-y-4">
                <div className="glass-card p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-6 h-6 rounded-lg bg-accent-purple/20 flex items-center justify-center">
                      <ImageIcon size={12} className="text-accent-purple" />
                    </div>
                    <h2 className="text-sm font-semibold text-white">Preview</h2>
                  </div>
                  <ImagePreview
                    originalImage={originalImage}
                    processedImage={processedImage}
                    isProcessing={isProcessing}
                  />
                </div>

                {showCanvas && originalImage && (
                  <div className="glass-card p-5">
                    <h2 className="text-sm font-semibold text-white mb-4">Object Removal</h2>
                    <ImageCanvas image={originalImage} onMaskCreate={handleMaskCreate} />
                  </div>
                )}

                {processedImage && (
                  <div className="glass-card p-4 flex justify-center">
                    <DownloadButton imageUrl={processedImage} filename="lumina-edited.png" disabled={isProcessing} />
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Comparison Modal */}
      {compareEntries && (
        <ComparisonView entries={compareEntries} onClose={() => setCompareEntries(null)} />
      )}
    </div>
  );
}

export default App;
