import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wand2, ChevronDown, ChevronUp, Sparkles,
  SlidersHorizontal, Loader2,
} from 'lucide-react';
import * as api from '../services/api';
import type { AIEngine, StylePreset, AspectRatio } from '../services/api';
import type { MultiEngineGenerationResult } from './MultiEngineGenerationPanel';

const STYLE_ICONS: Record<string, string> = {
  none: '✦', photorealistic: '📷', anime: '🎌', 'digital-art': '🖥️',
  watercolor: '🎨', oil_painting: '🖼️', sketch: '✏️', cyberpunk: '⚡',
  fantasy: '🔮', minimalist: '⬜',
};

interface PromptWorkspaceProps {
  onResult: (result: MultiEngineGenerationResult) => void;
  isGenerating: boolean;
  setIsGenerating: (v: boolean) => void;
}

const LIGHTING_OPTIONS = [
  { id: 'natural', name: 'Natural' }, { id: 'golden_hour', name: 'Golden Hour' },
  { id: 'blue_hour', name: 'Blue Hour' }, { id: 'studio', name: 'Studio' },
  { id: 'dramatic', name: 'Dramatic' }, { id: 'neon', name: 'Neon' },
  { id: 'backlit', name: 'Backlit' }, { id: 'overcast', name: 'Overcast' },
];
const CAMERA_OPTIONS = [
  { id: 'eye level', name: 'Eye Level' }, { id: 'low angle', name: 'Low Angle' },
  { id: 'high angle', name: 'High Angle' }, { id: 'aerial', name: 'Aerial' },
  { id: 'close up', name: 'Close Up' }, { id: 'wide angle', name: 'Wide Angle' },
  { id: 'portrait', name: 'Portrait' }, { id: 'cinematic', name: 'Cinematic' },
];

const PromptWorkspace: React.FC<PromptWorkspaceProps> = ({ onResult, isGenerating, setIsGenerating }) => {
  const [engines, setEngines] = useState<AIEngine[]>([]);
  const [selectedEngine, setSelectedEngine] = useState('placeholder');
  const [prompt, setPrompt] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [stylePreset, setStylePreset] = useState('none');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [lighting, setLighting] = useState('natural');
  const [cameraAngle, setCameraAngle] = useState('eye level');
  const [guidanceScale, setGuidanceScale] = useState(7.5);
  const [seed, setSeed] = useState('');
  const [outputFormat, setOutputFormat] = useState<'png' | 'jpeg' | 'webp'>('png');
  const [stylePresets, setStylePresets] = useState<StylePreset[]>([]);
  const [aspectRatios, setAspectRatios] = useState<AspectRatio[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [error, setError] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    api.getEngines().then((d) => {
      setEngines(d.engines);
      const first = d.engines.find((e) => e.available);
      if (first) setSelectedEngine(first.id);
    }).catch(() => {});
    api.getStylePresets().then((d) => {
      setStylePresets(d.style_presets);
      setAspectRatios(d.aspect_ratios);
    }).catch(() => {});
  }, []);

  const resolveSize = () => {
    const r = aspectRatios.find((r) => r.id === aspectRatio);
    return { width: r?.width ?? 1024, height: r?.height ?? 1024 };
  };

  const handleGenerate = async () => {
    if (!prompt.trim() || isGenerating) return;
    setIsGenerating(true);
    setError('');
    try {
      const { width, height } = resolveSize();
      const parsedSeed = seed ? parseInt(seed, 10) : undefined;
      const result = await api.generateMultiEngine({
        prompt, engine_id: selectedEngine,
        negative_prompt: negativePrompt || undefined,
        width, height, aspect_ratio: aspectRatio,
        style_preset: stylePreset, lighting, camera_angle: cameraAngle,
        guidance_scale: guidanceScale,
        seed: parsedSeed && !isNaN(parsedSeed) ? parsedSeed : undefined,
        output_format: outputFormat,
      });
      onResult({ ...result, prompt, outputFormat });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Generation failed');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleGenerate();
  };

  const displayPresets = stylePresets.length > 0 ? stylePresets : [
    { id: 'none', name: 'None', description: '' },
    { id: 'photorealistic', name: 'Photorealistic', description: '' },
    { id: 'anime', name: 'Anime', description: '' },
    { id: 'digital-art', name: 'Digital Art', description: '' },
    { id: 'watercolor', name: 'Watercolor', description: '' },
    { id: 'cyberpunk', name: 'Cyberpunk', description: '' },
  ];

  const displayRatios = aspectRatios.length > 0 ? aspectRatios : [
    { id: '1:1', name: 'Square', width: 1024, height: 1024 },
    { id: '16:9', name: 'Widescreen', width: 1792, height: 1024 },
    { id: '9:16', name: 'Portrait', width: 1024, height: 1792 },
    { id: '4:3', name: 'Landscape', width: 1365, height: 1024 },
  ];

  return (
    <div className="space-y-4">
      {/* Engine Selector */}
      <div className="flex gap-2 flex-wrap">
        {engines.length > 0 ? engines.map((engine) => (
          <button
            key={engine.id}
            onClick={() => setSelectedEngine(engine.id)}
            disabled={!engine.available}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 border ${
              selectedEngine === engine.id
                ? 'bg-accent-purple border-accent-purple text-white'
                : 'bg-transparent border-white/10 text-zinc-400 hover:border-white/20 hover:text-white'
            } ${!engine.available ? 'opacity-40 cursor-not-allowed' : ''}`}
          >
            {engine.name}
          </button>
        )) : (
          <div className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-accent-purple bg-accent-purple/20 text-accent-purple">
            AI Engine
          </div>
        )}
      </div>

      {/* Main Prompt Input */}
      <div className="relative">
        <textarea
          ref={textareaRef}
          rows={4}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Describe the image you want to create... (⌘+Enter to generate)"
          disabled={isGenerating}
          className="w-full px-4 py-3 input-dark text-sm resize-none pr-12"
        />
        <button
          onClick={() => {}}
          className="absolute right-3 top-3 p-1.5 rounded-lg text-zinc-500 hover:text-accent-teal hover:bg-white/5 transition-all opacity-50 cursor-not-allowed"
          title="AI Enhance Prompt (coming soon)"
          disabled
        >
          <Wand2 size={16} />
        </button>
      </div>

      {/* Style Presets */}
      <div>
        <p className="text-xs font-semibold text-zinc-400 mb-2 uppercase tracking-wider">Style Preset</p>
        <div className="flex gap-2 flex-wrap">
          {displayPresets.slice(0, 6).map((preset) => (
            <button
              key={preset.id}
              onClick={() => setStylePreset(preset.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-200 border ${
                stylePreset === preset.id
                  ? 'bg-accent-purple/20 border-accent-purple text-accent-purple'
                  : 'bg-white/[0.03] border-white/10 text-zinc-400 hover:border-white/20 hover:text-white'
              }`}
            >
              {STYLE_ICONS[preset.id] || '✦'} {preset.name}
            </button>
          ))}
        </div>
      </div>

      {/* Aspect Ratio */}
      <div>
        <p className="text-xs font-semibold text-zinc-400 mb-2 uppercase tracking-wider">Aspect Ratio</p>
        <div className="flex gap-2">
          {displayRatios.map((r) => (
            <button
              key={r.id}
              onClick={() => setAspectRatio(r.id)}
              className={`flex-1 py-2 rounded-xl text-xs font-medium transition-all duration-200 border ${
                aspectRatio === r.id
                  ? 'bg-accent-purple/20 border-accent-purple text-accent-purple'
                  : 'bg-white/[0.03] border-white/10 text-zinc-400 hover:border-white/20 hover:text-white'
              }`}
            >
              {r.id}
            </button>
          ))}
        </div>
      </div>

      {/* Advanced Settings Toggle */}
      <button
        onClick={() => setShowAdvanced((v) => !v)}
        className="flex items-center gap-2 text-xs font-medium text-zinc-500 hover:text-white transition-colors"
      >
        <SlidersHorizontal size={14} />
        Advanced Settings
        {showAdvanced ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>

      <AnimatePresence>
        {showAdvanced && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="space-y-3 p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
              {/* Negative Prompt */}
              <div>
                <label className="text-xs font-semibold text-zinc-400 block mb-1">Negative Prompt</label>
                <input
                  type="text"
                  value={negativePrompt}
                  onChange={(e) => setNegativePrompt(e.target.value)}
                  placeholder="What to avoid..."
                  disabled={isGenerating}
                  className="w-full px-3 py-2 input-dark text-sm"
                />
              </div>

              {/* Lighting + Camera */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-zinc-400 block mb-1">Lighting</label>
                  <select
                    value={lighting}
                    onChange={(e) => setLighting(e.target.value)}
                    disabled={isGenerating}
                    className="w-full px-3 py-2 select-dark text-sm"
                  >
                    {LIGHTING_OPTIONS.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-zinc-400 block mb-1">Camera</label>
                  <select
                    value={cameraAngle}
                    onChange={(e) => setCameraAngle(e.target.value)}
                    disabled={isGenerating}
                    className="w-full px-3 py-2 select-dark text-sm"
                  >
                    {CAMERA_OPTIONS.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
                  </select>
                </div>
              </div>

              {/* Guidance Scale */}
              <div>
                <label className="text-xs font-semibold text-zinc-400 block mb-1">
                  Guidance Scale: <span className="text-accent-purple">{guidanceScale.toFixed(1)}</span>
                </label>
                <input
                  type="range" min="1" max="15" step="0.5"
                  value={guidanceScale}
                  onChange={(e) => setGuidanceScale(Number(e.target.value))}
                  disabled={isGenerating}
                  className="w-full h-1.5 rounded-full appearance-none cursor-pointer accent-[#6C5CE7]"
                  style={{ background: `linear-gradient(to right, #6C5CE7 ${((guidanceScale-1)/14)*100}%, rgba(255,255,255,0.1) ${((guidanceScale-1)/14)*100}%)` }}
                />
              </div>

              {/* Seed */}
              <div>
                <label className="text-xs font-semibold text-zinc-400 block mb-1">Seed (optional)</label>
                <input
                  type="number"
                  value={seed}
                  onChange={(e) => setSeed(e.target.value)}
                  placeholder="Random if empty"
                  disabled={isGenerating}
                  className="w-full px-3 py-2 input-dark text-sm"
                />
              </div>

              {/* Output Format */}
              <div>
                <label className="text-xs font-semibold text-zinc-400 block mb-1">Output Format</label>
                <div className="flex gap-2">
                  {(['png', 'jpeg', 'webp'] as const).map((fmt) => (
                    <button
                      key={fmt}
                      onClick={() => setOutputFormat(fmt)}
                      disabled={isGenerating}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                        outputFormat === fmt
                          ? 'bg-accent-purple border-accent-purple text-white'
                          : 'bg-transparent border-white/10 text-zinc-400 hover:border-white/20 hover:text-white'
                      }`}
                    >
                      .{fmt === 'jpeg' ? 'jpg' : fmt}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error */}
      {error && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400">
          ⚠ {error}
        </div>
      )}

      {/* Generate Button */}
      <motion.button
        onClick={handleGenerate}
        disabled={isGenerating || !prompt.trim()}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="w-full py-3.5 rounded-xl text-white font-semibold text-sm btn-glow flex items-center justify-center gap-2"
      >
        {isGenerating ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <Sparkles size={16} />
            Generate Image
          </>
        )}
      </motion.button>
    </div>
  );
};

export default PromptWorkspace;
