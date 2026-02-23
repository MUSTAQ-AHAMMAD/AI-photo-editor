import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Expand, Layers, X, ChevronLeft, ChevronRight } from 'lucide-react';
import type { HistoryEntry } from './GenerationHistory';
import MultiFormatDownload from './MultiFormatDownload';

interface GalleryViewProps {
  generatedImage?: string;
  generatedImageMeta?: { engineName: string; promptUsed: string; outputFormat: string };
  isGenerating: boolean;
  history: HistoryEntry[];
  onSelectFromHistory: (entry: HistoryEntry) => void;
}

const GalleryView: React.FC<GalleryViewProps> = ({
  generatedImage, generatedImageMeta, isGenerating, history, onSelectFromHistory,
}) => {
  const [previewEntry, setPreviewEntry] = useState<{ url: string; meta?: { engineName: string; promptUsed: string } } | null>(null);
  const [previewHistoryIndex, setPreviewHistoryIndex] = useState<number | null>(null);

  const openPreview = (url: string, meta?: { engineName: string; promptUsed: string }, historyIndex?: number) => {
    setPreviewEntry({ url, meta });
    setPreviewHistoryIndex(historyIndex ?? null);
  };

  const closePreview = () => {
    setPreviewEntry(null);
    setPreviewHistoryIndex(null);
  };

  const navigatePreview = (direction: 'prev' | 'next') => {
    if (previewHistoryIndex === null) return;
    const newIdx = direction === 'prev'
      ? Math.max(0, previewHistoryIndex - 1)
      : Math.min(history.length - 1, previewHistoryIndex + 1);
    const entry = history[newIdx];
    setPreviewEntry({ url: entry.imageUrl, meta: { engineName: entry.engineName, promptUsed: entry.prompt } });
    setPreviewHistoryIndex(newIdx);
  };

  return (
    <div className="space-y-4">
      {/* Current / Latest Result */}
      <div className="glass-card p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-white">Latest Result</h3>
          {generatedImageMeta && (
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-accent-purple/20 text-accent-purple border border-accent-purple/30">
              {generatedImageMeta.engineName}
            </span>
          )}
        </div>

        {isGenerating ? (
          <div className="aspect-square rounded-2xl skeleton flex items-center justify-center">
            <div className="text-center space-y-3">
              <div className="w-10 h-10 rounded-full border-2 border-accent-purple border-t-transparent animate-spin mx-auto" />
              <p className="text-xs text-zinc-500">Generating your image...</p>
            </div>
          </div>
        ) : generatedImage ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="relative group rounded-2xl overflow-hidden"
          >
            <img
              src={generatedImage}
              alt="Generated"
              className="w-full object-cover rounded-2xl"
            />
            {/* Hover overlay */}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-all duration-200 rounded-2xl flex items-center justify-center gap-3">
              <button
                onClick={() => openPreview(generatedImage, generatedImageMeta ? { engineName: generatedImageMeta.engineName, promptUsed: generatedImageMeta.promptUsed } : undefined)}
                className="p-2.5 rounded-xl bg-white/10 backdrop-blur text-white hover:bg-white/20 transition-colors"
                title="Full screen"
              >
                <Expand size={16} />
              </button>
              <a
                href={generatedImage}
                download={`lumina-ai.${generatedImageMeta?.outputFormat ?? 'png'}`}
                className="p-2.5 rounded-xl bg-white/10 backdrop-blur text-white hover:bg-white/20 transition-colors"
                title="Download"
              >
                <Download size={16} />
              </a>
            </div>
          </motion.div>
        ) : (
          <div className="aspect-square rounded-2xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center gap-3 text-zinc-600">
            <div className="w-12 h-12 rounded-2xl bg-white/[0.03] flex items-center justify-center">
              <Layers size={20} />
            </div>
            <p className="text-sm">Your image will appear here</p>
            <p className="text-xs">Enter a prompt and click Generate</p>
          </div>
        )}

        {generatedImage && generatedImageMeta && (
          <p className="mt-2 text-[11px] text-zinc-500 truncate">"{generatedImageMeta.promptUsed}"</p>
        )}

        {generatedImage && (
          <div className="mt-3">
            <MultiFormatDownload imageUrl={generatedImage} baseFilename="lumina-ai" />
          </div>
        )}
      </div>

      {/* History Grid */}
      {history.length > 0 && (
        <div className="glass-card p-4">
          <h3 className="text-sm font-semibold text-white mb-3">History</h3>
          <div className="grid grid-cols-3 gap-2">
            <AnimatePresence>
              {history.slice(0, 9).map((entry, idx) => (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ delay: idx * 0.05 }}
                  className="relative aspect-square rounded-xl overflow-hidden cursor-pointer group"
                  onClick={() => {
                    onSelectFromHistory(entry);
                    openPreview(entry.imageUrl, { engineName: entry.engineName, promptUsed: entry.prompt }, idx);
                  }}
                >
                  <img src={entry.imageUrl} alt={entry.prompt} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center justify-center">
                    <Expand size={14} className="text-white" />
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Full-Screen Preview Modal */}
      <AnimatePresence>
        {previewEntry && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={(e) => e.target === e.currentTarget && closePreview()}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="relative max-w-4xl w-full glass-card p-4"
            >
              <button
                onClick={closePreview}
                className="absolute top-3 right-3 p-2 rounded-xl bg-white/10 text-white hover:bg-white/20 z-10"
              >
                <X size={16} />
              </button>

              {previewHistoryIndex !== null && (
                <>
                  <button
                    onClick={() => navigatePreview('prev')}
                    disabled={previewHistoryIndex === 0}
                    className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-xl bg-white/10 text-white hover:bg-white/20 disabled:opacity-30 z-10"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    onClick={() => navigatePreview('next')}
                    disabled={previewHistoryIndex === history.length - 1}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-xl bg-white/10 text-white hover:bg-white/20 disabled:opacity-30 z-10"
                  >
                    <ChevronRight size={16} />
                  </button>
                </>
              )}

              <img
                src={previewEntry.url}
                alt="Preview"
                className="w-full max-h-[80vh] object-contain rounded-xl"
              />

              {previewEntry.meta && (
                <div className="mt-3 flex items-center justify-between">
                  <div>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-accent-purple/20 text-accent-purple border border-accent-purple/30">
                      {previewEntry.meta.engineName}
                    </span>
                    <p className="mt-1 text-xs text-zinc-400">"{previewEntry.meta.promptUsed}"</p>
                  </div>
                  <a
                    href={previewEntry.url}
                    download="lumina-ai.png"
                    className="p-2 rounded-xl bg-accent-purple text-white hover:bg-accent-purple-hover transition-colors"
                  >
                    <Download size={16} />
                  </a>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GalleryView;
