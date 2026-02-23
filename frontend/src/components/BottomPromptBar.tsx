import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Loader2 } from 'lucide-react';
import { useAppStore } from '../store';
import type { AIEngine } from '../services/api';

interface BottomPromptBarProps {
  onGenerate: () => void;
  isGenerating: boolean;
  engines: AIEngine[];
  error?: string;
  onDismissError?: () => void;
}

const BottomPromptBar: React.FC<BottomPromptBarProps> = ({
  onGenerate,
  isGenerating,
  engines,
  error,
  onDismissError,
}) => {
  const { genPrompt, genOutputFormat, genEngineId, setGenSettings } = useAppStore();

  const currentEngine = engines.find((e) => e.id === genEngineId);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) onGenerate();
  };

  return (
    <div className="flex-shrink-0 border-t border-white/[0.06] bg-[#0E0E11]/95 backdrop-blur-xl">
      {/* Error strip */}
      {error && (
        <div className="flex items-center justify-between px-4 py-2 bg-red-500/10 border-b border-red-500/20">
          <p className="text-xs text-red-400">⚠ {error}</p>
          {onDismissError && (
            <button onClick={onDismissError} className="text-red-400 hover:text-red-300 text-xs ml-3">✕</button>
          )}
        </div>
      )}

      <div className="px-4 py-3 md:px-6">
        <div className="flex items-end gap-3 max-w-5xl mx-auto">
          {/* Prompt area */}
          <div className="flex-1 relative">
            {/* Engine badge inside textarea */}
            {currentEngine && (
              <div className="absolute left-3 top-2.5 z-10 pointer-events-none">
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent-purple/25 text-accent-purple border border-accent-purple/30 font-medium">
                  {currentEngine.name}
                </span>
              </div>
            )}
            <textarea
              rows={2}
              value={genPrompt}
              onChange={(e) => setGenSettings({ genPrompt: e.target.value })}
              onKeyDown={handleKeyDown}
              placeholder="Describe the image you want to create… (⌘+Enter to generate)"
              disabled={isGenerating}
              className="w-full px-4 py-3 pt-8 input-dark text-sm resize-none leading-relaxed"
              style={{ paddingTop: currentEngine ? '2rem' : '0.75rem' }}
            />
          </div>

          {/* Right controls */}
          <div className="flex flex-col gap-2 flex-shrink-0">
            {/* Output format */}
            <div className="flex gap-1">
              {(['png', 'jpeg', 'webp'] as const).map((fmt) => (
                <button
                  key={fmt}
                  onClick={() => setGenSettings({ genOutputFormat: fmt })}
                  disabled={isGenerating}
                  className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition-all border ${
                    genOutputFormat === fmt
                      ? 'bg-accent-purple border-accent-purple text-white'
                      : 'bg-transparent border-white/10 text-zinc-400 hover:border-white/20 hover:text-white'
                  } disabled:opacity-50`}
                >
                  .{fmt === 'jpeg' ? 'jpg' : fmt}
                </button>
              ))}
            </div>

            {/* Generate button */}
            <motion.button
              onClick={onGenerate}
              disabled={isGenerating || !genPrompt.trim()}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-5 py-2.5 rounded-xl text-white font-semibold text-sm btn-glow flex items-center justify-center gap-2 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isGenerating ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  Generating…
                </>
              ) : (
                <>
                  <Sparkles size={15} />
                  Generate
                </>
              )}
            </motion.button>
          </div>
        </div>

        {/* Keyboard hint */}
        <p className="text-[11px] text-zinc-600 mt-1.5 text-center select-none">
          Ctrl/⌘+Enter to generate · Filters &amp; style controls in the left panel
        </p>
      </div>
    </div>
  );
};

export default BottomPromptBar;
