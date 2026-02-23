import React, { useState, useEffect } from 'react';
import * as api from '../services/api';
import type { AIEngine, StylePreset, AspectRatio } from '../services/api';
import EngineSelector from './EngineSelector';

const LIGHTING_OPTIONS = [
  { id: 'natural', name: 'Natural' },
  { id: 'golden_hour', name: 'Golden Hour' },
  { id: 'blue_hour', name: 'Blue Hour' },
  { id: 'studio', name: 'Studio' },
  { id: 'dramatic', name: 'Dramatic' },
  { id: 'neon', name: 'Neon' },
  { id: 'backlit', name: 'Backlit' },
  { id: 'overcast', name: 'Overcast' },
  { id: 'candlelight', name: 'Candlelight' },
];

const CAMERA_OPTIONS = [
  { id: 'eye level', name: 'Eye Level' },
  { id: 'low angle', name: 'Low Angle' },
  { id: 'high angle', name: 'High Angle' },
  { id: 'aerial', name: 'Aerial' },
  { id: 'close up', name: 'Close Up' },
  { id: 'wide angle', name: 'Wide Angle' },
  { id: 'portrait', name: 'Portrait' },
  { id: 'cinematic', name: 'Cinematic' },
];

export interface MultiEngineGenerationResult {
  blob: Blob;
  engineId: string;
  engineName: string;
  promptUsed: string;
  prompt: string;
  outputFormat: string;
}

interface MultiEngineGenerationPanelProps {
  onResult: (result: MultiEngineGenerationResult) => void;
  disabled?: boolean;
}

const MultiEngineGenerationPanel: React.FC<MultiEngineGenerationPanelProps> = ({
  onResult,
  disabled = false,
}) => {
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
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    api.getEngines()
      .then((data) => {
        setEngines(data.engines);
        const first = data.engines.find((e) => e.available);
        if (first) setSelectedEngine(first.id);
      })
      .catch(() => {/* backend may not be running */});

    api.getStylePresets()
      .then((data) => {
        setStylePresets(data.style_presets);
        setAspectRatios(data.aspect_ratios);
      })
      .catch(() => {});
  }, []);

  const resolveSize = () => {
    const ratio = aspectRatios.find((r) => r.id === aspectRatio);
    return { width: ratio?.width ?? 1024, height: ratio?.height ?? 1024 };
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    setError('');
    try {
      const { width, height } = resolveSize();
      const parsedSeed = seed ? parseInt(seed, 10) : undefined;

      const result = await api.generateMultiEngine({
        prompt,
        engine_id: selectedEngine,
        negative_prompt: negativePrompt || undefined,
        width,
        height,
        aspect_ratio: aspectRatio,
        style_preset: stylePreset,
        lighting,
        camera_angle: cameraAngle,
        guidance_scale: guidanceScale,
        seed: !isNaN(parsedSeed as number) ? parsedSeed : undefined,
        output_format: outputFormat,
      });

      onResult({
        ...result,
        prompt,
        outputFormat,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg || 'Generation failed. Check the backend logs.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-5 p-6 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border border-indigo-200 shadow-sm">
      <h3 className="text-lg font-bold text-indigo-900 flex items-center gap-2">
        <span className="text-2xl">🚀</span> Multi-Engine AI Generation
      </h3>

      {/* Engine Selector */}
      <EngineSelector
        engines={engines}
        selectedEngine={selectedEngine}
        onSelect={setSelectedEngine}
        disabled={disabled || isGenerating}
      />

      {/* Prompt */}
      <div className="space-y-1">
        <label className="text-sm font-semibold text-gray-700">Prompt</label>
        <textarea
          rows={3}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe the image you want to generate…"
          disabled={disabled || isGenerating}
          className="w-full px-4 py-3 border-2 border-indigo-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-sm resize-none"
        />
      </div>

      {/* Style + Aspect Ratio row */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-sm font-semibold text-gray-700">🎨 Style</label>
          <select
            value={stylePreset}
            onChange={(e) => setStylePreset(e.target.value)}
            disabled={disabled || isGenerating}
            className="w-full px-3 py-2.5 border-2 border-indigo-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-sm"
          >
            {stylePresets.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
            {stylePresets.length === 0 && <option value="none">None</option>}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-sm font-semibold text-gray-700">📐 Aspect Ratio</label>
          <select
            value={aspectRatio}
            onChange={(e) => setAspectRatio(e.target.value)}
            disabled={disabled || isGenerating}
            className="w-full px-3 py-2.5 border-2 border-indigo-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-sm"
          >
            {aspectRatios.map((r) => (
              <option key={r.id} value={r.id}>{r.name} ({r.id})</option>
            ))}
            {aspectRatios.length === 0 && <option value="1:1">Square (1:1)</option>}
          </select>
        </div>
      </div>

      {/* Lighting + Camera row */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-sm font-semibold text-gray-700">💡 Lighting</label>
          <select
            value={lighting}
            onChange={(e) => setLighting(e.target.value)}
            disabled={disabled || isGenerating}
            className="w-full px-3 py-2.5 border-2 border-indigo-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-sm"
          >
            {LIGHTING_OPTIONS.map((o) => (
              <option key={o.id} value={o.id}>{o.name}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-sm font-semibold text-gray-700">📷 Camera Angle</label>
          <select
            value={cameraAngle}
            onChange={(e) => setCameraAngle(e.target.value)}
            disabled={disabled || isGenerating}
            className="w-full px-3 py-2.5 border-2 border-indigo-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-sm"
          >
            {CAMERA_OPTIONS.map((o) => (
              <option key={o.id} value={o.id}>{o.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Advanced toggle */}
      <button
        type="button"
        onClick={() => setShowAdvanced((v) => !v)}
        className="text-sm text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
      >
        {showAdvanced ? '▲' : '▼'} Advanced Options
      </button>

      {showAdvanced && (
        <div className="space-y-3 p-4 bg-white/60 rounded-lg border border-indigo-200">
          {/* Negative Prompt */}
          <div className="space-y-1">
            <label className="text-sm font-semibold text-gray-700">🚫 Negative Prompt</label>
            <input
              type="text"
              value={negativePrompt}
              onChange={(e) => setNegativePrompt(e.target.value)}
              placeholder="What to avoid…"
              disabled={disabled || isGenerating}
              className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            />
          </div>

          {/* Guidance Scale */}
          <div className="space-y-1">
            <label className="text-sm font-semibold text-gray-700">
              🎯 Guidance Scale: <span className="text-indigo-600">{guidanceScale.toFixed(1)}</span>
            </label>
            <input
              type="range"
              min="1"
              max="15"
              step="0.5"
              value={guidanceScale}
              onChange={(e) => setGuidanceScale(Number(e.target.value))}
              disabled={disabled || isGenerating}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
          </div>

          {/* Seed */}
          <div className="space-y-1">
            <label className="text-sm font-semibold text-gray-700">🎲 Seed (optional)</label>
            <input
              type="number"
              value={seed}
              onChange={(e) => setSeed(e.target.value)}
              placeholder="Random if empty"
              disabled={disabled || isGenerating}
              className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            />
          </div>

          {/* Output Format */}
          <div className="space-y-1">
            <label className="text-sm font-semibold text-gray-700">📁 Output Format</label>
            <div className="flex gap-2">
              {(['png', 'jpeg', 'webp'] as const).map((fmt) => (
                <button
                  key={fmt}
                  onClick={() => setOutputFormat(fmt)}
                  disabled={disabled || isGenerating}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                    outputFormat === fmt
                      ? 'bg-indigo-500 text-white'
                      : 'bg-white border border-gray-300 text-gray-600 hover:bg-indigo-50'
                  }`}
                >
                  .{fmt === 'jpeg' ? 'jpg' : fmt}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          ⚠️ {error}
        </div>
      )}

      {/* Generate Button */}
      <button
        onClick={handleGenerate}
        disabled={disabled || isGenerating || !prompt.trim()}
        className="w-full py-3 px-6 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl text-lg"
      >
        {isGenerating ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
            Generating…
          </span>
        ) : (
          '✨ Generate Image'
        )}
      </button>
    </div>
  );
};

export default MultiEngineGenerationPanel;
