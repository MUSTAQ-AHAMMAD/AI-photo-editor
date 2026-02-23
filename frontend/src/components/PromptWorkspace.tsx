import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, SlidersHorizontal } from 'lucide-react';
import type { AIEngine, StylePreset, AspectRatio } from '../services/api';
import { useAppStore } from '../store';

const STYLE_ICONS: Record<string, string> = {
  none: '✦', photorealistic: '📷', anime: '🎌', 'digital-art': '🖥️',
  watercolor: '🎨', oil_painting: '🖼️', sketch: '✏️', cyberpunk: '⚡',
  fantasy: '🔮', minimalist: '⬜',
};

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

const DEFAULT_PRESETS: StylePreset[] = [
  { id: 'none', name: 'None', description: '' },
  { id: 'photorealistic', name: 'Photorealistic', description: '' },
  { id: 'anime', name: 'Anime', description: '' },
  { id: 'digital-art', name: 'Digital Art', description: '' },
  { id: 'watercolor', name: 'Watercolor', description: '' },
  { id: 'cyberpunk', name: 'Cyberpunk', description: '' },
  { id: 'fantasy', name: 'Fantasy', description: '' },
  { id: 'minimalist', name: 'Minimalist', description: '' },
];

const DEFAULT_RATIOS: AspectRatio[] = [
  { id: '1:1', name: 'Square', width: 1024, height: 1024 },
  { id: '16:9', name: 'Wide', width: 1792, height: 1024 },
  { id: '9:16', name: 'Portrait', width: 1024, height: 1792 },
  { id: '4:3', name: 'Landscape', width: 1365, height: 1024 },
];

interface PromptWorkspaceProps {
  engines: AIEngine[];
  stylePresets: StylePreset[];
  aspectRatios: AspectRatio[];
}

const PromptWorkspace: React.FC<PromptWorkspaceProps> = ({ engines, stylePresets, aspectRatios }) => {
  const {
    genEngineId, genStylePreset, genAspectRatio, genLighting, genCameraAngle,
    genGuidanceScale, genSeed, genNegativePrompt, setGenSettings,
  } = useAppStore();
  const [showAdvanced, setShowAdvanced] = useState(false);

  const displayPresets = stylePresets.length > 0 ? stylePresets : DEFAULT_PRESETS;
  const displayRatios = aspectRatios.length > 0 ? aspectRatios : DEFAULT_RATIOS;

  return (
    <div className="space-y-5">
      {/* AI Engine */}
      <div>
        <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest mb-3">AI Engine</p>
        <div className="flex flex-col gap-1.5">
          {engines.length > 0 ? engines.map((engine) => (
            <button
              key={engine.id}
              onClick={() => setGenSettings({ genEngineId: engine.id })}
              disabled={!engine.available}
              title={engine.description}
              className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200 border text-left ${
                genEngineId === engine.id
                  ? 'bg-accent-purple border-accent-purple text-white'
                  : 'bg-transparent border-white/10 text-zinc-400 hover:border-white/20 hover:text-white'
              } ${!engine.available ? 'opacity-40 cursor-not-allowed' : ''}`}
            >
              {engine.name}
              {!engine.available && <span className="ml-1 opacity-60">(no key)</span>}
            </button>
          )) : (
            <div className="px-3 py-2 rounded-xl text-xs font-semibold border border-accent-purple bg-accent-purple/20 text-accent-purple">
              Demo Engine
            </div>
          )}
        </div>
      </div>

      {/* Style Presets */}
      <div>
        <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest mb-3">Style</p>
        <div className="grid grid-cols-2 gap-1.5">
          {displayPresets.slice(0, 8).map((preset) => (
            <button
              key={preset.id}
              onClick={() => setGenSettings({ genStylePreset: preset.id })}
              className={`px-2.5 py-2 rounded-xl text-xs font-medium transition-all duration-200 border text-left ${
                genStylePreset === preset.id
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
        <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest mb-3">Aspect Ratio</p>
        <div className="grid grid-cols-2 gap-1.5">
          {displayRatios.map((r) => (
            <button
              key={r.id}
              onClick={() => setGenSettings({ genAspectRatio: r.id })}
              className={`py-2.5 rounded-xl text-xs font-medium transition-all duration-200 border flex flex-col items-center ${
                genAspectRatio === r.id
                  ? 'bg-accent-purple/20 border-accent-purple text-accent-purple'
                  : 'bg-white/[0.03] border-white/10 text-zinc-400 hover:border-white/20 hover:text-white'
              }`}
            >
              <span className="font-semibold">{r.id}</span>
              <span className="text-[10px] opacity-60 mt-0.5">{r.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Advanced Settings Toggle */}
      <button
        onClick={() => setShowAdvanced((v) => !v)}
        className="flex items-center gap-2 text-xs font-medium text-zinc-500 hover:text-white transition-colors w-full"
      >
        <SlidersHorizontal size={13} />
        Advanced
        {showAdvanced ? <ChevronUp size={13} className="ml-auto" /> : <ChevronDown size={13} className="ml-auto" />}
      </button>

      <AnimatePresence>
        {showAdvanced && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden"
          >
            <div className="space-y-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
              {/* Negative Prompt */}
              <div>
                <label className="text-[11px] font-semibold text-zinc-400 block mb-1">Negative Prompt</label>
                <input
                  type="text"
                  value={genNegativePrompt}
                  onChange={(e) => setGenSettings({ genNegativePrompt: e.target.value })}
                  placeholder="What to avoid..."
                  className="w-full px-3 py-2 input-dark text-xs"
                />
              </div>

              {/* Lighting */}
              <div>
                <label className="text-[11px] font-semibold text-zinc-400 block mb-1">Lighting</label>
                <select
                  value={genLighting}
                  onChange={(e) => setGenSettings({ genLighting: e.target.value })}
                  className="w-full px-3 py-2 select-dark text-xs"
                >
                  {LIGHTING_OPTIONS.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
                </select>
              </div>

              {/* Camera Angle */}
              <div>
                <label className="text-[11px] font-semibold text-zinc-400 block mb-1">Camera Angle</label>
                <select
                  value={genCameraAngle}
                  onChange={(e) => setGenSettings({ genCameraAngle: e.target.value })}
                  className="w-full px-3 py-2 select-dark text-xs"
                >
                  {CAMERA_OPTIONS.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
                </select>
              </div>

              {/* Guidance Scale */}
              <div>
                <label className="text-[11px] font-semibold text-zinc-400 block mb-1">
                  Guidance Scale: <span className="text-accent-purple">{genGuidanceScale.toFixed(1)}</span>
                </label>
                <input
                  type="range" min="1" max="15" step="0.5"
                  value={genGuidanceScale}
                  onChange={(e) => setGenSettings({ genGuidanceScale: Number(e.target.value) })}
                  className="w-full h-1.5 rounded-full appearance-none cursor-pointer accent-[#6C5CE7]"
                  style={{ background: `linear-gradient(to right, #6C5CE7 ${((genGuidanceScale - 1) / 14) * 100}%, rgba(255,255,255,0.1) ${((genGuidanceScale - 1) / 14) * 100}%)` }}
                />
              </div>

              {/* Seed */}
              <div>
                <label className="text-[11px] font-semibold text-zinc-400 block mb-1">Seed (optional)</label>
                <input
                  type="number"
                  value={genSeed}
                  onChange={(e) => setGenSettings({ genSeed: e.target.value })}
                  placeholder="Random if empty"
                  className="w-full px-3 py-2 input-dark text-xs"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PromptWorkspace;
