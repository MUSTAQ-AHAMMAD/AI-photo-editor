import React, { useState, useEffect } from 'react';
import * as api from '../services/api';

export type FilterType = 'none' | 'blur' | 'sharpen' | 'edge' | 'grayscale';
export type TabType = 'basic' | 'generate' | 'effects' | 'outpaint';

interface EditingPanelProps {
  onRemoveBackground: () => void;
  onApplyFilter: (filter: FilterType) => void;
  onAdjustBrightness: (factor: number) => void;
  onGenerateImage: (prompt: string, stylePreset: string, aspectRatio: string, negativePrompt: string) => void;
  onGenerateFill: (prompt: string, negativePrompt: string) => void;
  onApplyStyleTransfer: (stylePrompt: string, strength: number) => void;
  onGenerateTextEffect: (text: string, style: string) => void;
  onOutpaint: (direction: string, expandPixels: number, prompt: string) => void;
  disabled?: boolean;
  aiEnabled?: boolean;
  hasImage?: boolean;
}

const EditingPanel: React.FC<EditingPanelProps> = ({
  onRemoveBackground,
  onApplyFilter,
  onAdjustBrightness,
  onGenerateImage,
  onGenerateFill,
  onApplyStyleTransfer,
  onGenerateTextEffect,
  onOutpaint,
  disabled = false,
  aiEnabled = false,
  hasImage = false,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('basic');
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('none');
  const [brightness, setBrightness] = useState(1.0);

  // Generate Tab
  const [prompt, setPrompt] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [stylePreset, setStylePreset] = useState('none');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [stylePresets, setStylePresets] = useState<api.StylePreset[]>([]);
  const [aspectRatios, setAspectRatios] = useState<api.AspectRatio[]>([]);

  // Generative Fill Tab
  const [fillPrompt, setFillPrompt] = useState('');
  const [fillNegativePrompt, setFillNegativePrompt] = useState('');

  // Style Transfer
  const [styleTransferPrompt, setStyleTransferPrompt] = useState('');
  const [styleStrength, setStyleStrength] = useState(0.75);

  // Text Effect
  const [textEffectText, setTextEffectText] = useState('');
  const [textEffectStyle, setTextEffectStyle] = useState('3d metallic');

  // Outpaint
  const [outpaintDirection, setOutpaintDirection] = useState<string>('all');
  const [outpaintPixels, setOutpaintPixels] = useState(256);
  const [outpaintPrompt, setOutpaintPrompt] = useState('');

  useEffect(() => {
    if (aiEnabled) {
      api.getStylePresets().then((data) => {
        setStylePresets(data.style_presets);
        setAspectRatios(data.aspect_ratios);
      }).catch(err => console.error('Failed to load style presets:', err));
    }
  }, [aiEnabled]);

  const handleFilterChange = (filter: FilterType) => {
    setSelectedFilter(filter);
    onApplyFilter(filter);
  };

  const handleBrightnessChange = (value: number) => {
    setBrightness(value);
    onAdjustBrightness(value);
  };

  const handleGenerateImage = () => {
    if (prompt.trim()) {
      onGenerateImage(prompt, stylePreset, aspectRatio, negativePrompt);
    }
  };

  const handleGenerateFill = () => {
    if (fillPrompt.trim()) {
      onGenerateFill(fillPrompt, fillNegativePrompt);
    }
  };

  const handleStyleTransfer = () => {
    if (styleTransferPrompt.trim()) {
      onApplyStyleTransfer(styleTransferPrompt, styleStrength);
    }
  };

  const handleTextEffect = () => {
    if (textEffectText.trim()) {
      onGenerateTextEffect(textEffectText, textEffectStyle);
    }
  };

  const handleOutpaint = () => {
    onOutpaint(outpaintDirection, outpaintPixels, outpaintPrompt);
  };

  const tabs = [
    { id: 'basic' as TabType, name: 'Basic', icon: '🎨' },
    { id: 'generate' as TabType, name: 'Generate', icon: '✨', requiresAI: true },
    { id: 'effects' as TabType, name: 'Effects', icon: '🎭', requiresAI: true },
    { id: 'outpaint' as TabType, name: 'Extend', icon: '🖼️', requiresAI: true },
  ];

  return (
    <div className="space-y-4 p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-gray-800">Adobe Firefly Tools</h2>

      {/* Tab Navigation */}
      <div className="flex space-x-2 border-b-2 border-gray-200">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            disabled={tab.requiresAI && !aiEnabled}
            className={`px-4 py-2 font-semibold transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${
              activeTab === tab.id
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            {tab.icon} {tab.name}
          </button>
        ))}
      </div>

      {/* Basic Tab */}
      {activeTab === 'basic' && (
        <div className="space-y-4">
          {/* Background Removal */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-gray-700">Background</h3>
            <button
              onClick={onRemoveBackground}
              disabled={disabled || !hasImage}
              className="w-full px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Remove Background
            </button>
          </div>

          {/* Filters */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-gray-700">Filters</h3>
            <div className="grid grid-cols-2 gap-2">
              {(['none', 'blur', 'sharpen', 'edge', 'grayscale'] as FilterType[]).map((filter) => (
                <button
                  key={filter}
                  onClick={() => handleFilterChange(filter)}
                  disabled={disabled || !hasImage}
                  className={`px-4 py-2 rounded transition-colors capitalize disabled:opacity-50 disabled:cursor-not-allowed ${
                    selectedFilter === filter
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          {/* Brightness */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-gray-700">
              Brightness: {brightness.toFixed(1)}x
            </h3>
            <input
              type="range"
              min="0.1"
              max="3.0"
              step="0.1"
              value={brightness}
              onChange={(e) => handleBrightnessChange(Number(e.target.value))}
              disabled={disabled || !hasImage}
              className="w-full"
            />
          </div>
        </div>
      )}

      {/* Generate Tab */}
      {activeTab === 'generate' && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-700">Text to Image</h3>
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe the image you want to generate..."
            disabled={disabled}
            className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">Style Preset</label>
            <select
              value={stylePreset}
              onChange={(e) => setStylePreset(e.target.value)}
              disabled={disabled}
              className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {stylePresets.map((preset) => (
                <option key={preset.id} value={preset.id}>
                  {preset.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">Aspect Ratio</label>
            <select
              value={aspectRatio}
              onChange={(e) => setAspectRatio(e.target.value)}
              disabled={disabled}
              className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {aspectRatios.map((ratio) => (
                <option key={ratio.id} value={ratio.id}>
                  {ratio.name} ({ratio.id})
                </option>
              ))}
            </select>
          </div>

          <input
            type="text"
            value={negativePrompt}
            onChange={(e) => setNegativePrompt(e.target.value)}
            placeholder="What to avoid (optional)..."
            disabled={disabled}
            className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <button
            onClick={handleGenerateImage}
            disabled={disabled || !prompt.trim()}
            className="w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Generate Image
          </button>
        </div>
      )}

      {/* Effects Tab */}
      {activeTab === 'effects' && (
        <div className="space-y-6">
          {/* Generative Fill */}
          <div className="space-y-2 p-4 bg-blue-50 rounded">
            <h3 className="text-lg font-semibold text-gray-700">Generative Fill</h3>
            <p className="text-sm text-gray-600">Use canvas to select area, then describe what to add</p>
            <input
              type="text"
              value={fillPrompt}
              onChange={(e) => setFillPrompt(e.target.value)}
              placeholder="What to generate in selected area..."
              disabled={disabled || !hasImage}
              className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              value={fillNegativePrompt}
              onChange={(e) => setFillNegativePrompt(e.target.value)}
              placeholder="What to avoid (optional)..."
              disabled={disabled || !hasImage}
              className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleGenerateFill}
              disabled={disabled || !hasImage || !fillPrompt.trim()}
              className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Apply Generative Fill
            </button>
          </div>

          {/* Style Transfer */}
          <div className="space-y-2 p-4 bg-purple-50 rounded">
            <h3 className="text-lg font-semibold text-gray-700">Style Transfer</h3>
            <input
              type="text"
              value={styleTransferPrompt}
              onChange={(e) => setStyleTransferPrompt(e.target.value)}
              placeholder="Describe the style (e.g., 'oil painting', 'cyberpunk')..."
              disabled={disabled || !hasImage}
              className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <div className="space-y-1">
              <label className="text-sm text-gray-600">Strength: {styleStrength.toFixed(2)}</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={styleStrength}
                onChange={(e) => setStyleStrength(Number(e.target.value))}
                disabled={disabled || !hasImage}
                className="w-full"
              />
            </div>
            <button
              onClick={handleStyleTransfer}
              disabled={disabled || !hasImage || !styleTransferPrompt.trim()}
              className="w-full px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Apply Style Transfer
            </button>
          </div>

          {/* Text Effects */}
          <div className="space-y-2 p-4 bg-pink-50 rounded">
            <h3 className="text-lg font-semibold text-gray-700">Text Effects</h3>
            <input
              type="text"
              value={textEffectText}
              onChange={(e) => setTextEffectText(e.target.value)}
              placeholder="Enter text..."
              disabled={disabled}
              className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-pink-500"
            />
            <select
              value={textEffectStyle}
              onChange={(e) => setTextEffectStyle(e.target.value)}
              disabled={disabled}
              className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-pink-500"
            >
              <option value="3d metallic">3D Metallic</option>
              <option value="neon glow">Neon Glow</option>
              <option value="watercolor">Watercolor</option>
              <option value="fire">Fire Effect</option>
              <option value="ice crystal">Ice Crystal</option>
              <option value="gold">Gold Texture</option>
            </select>
            <button
              onClick={handleTextEffect}
              disabled={disabled || !textEffectText.trim()}
              className="w-full px-4 py-2 bg-pink-500 text-white rounded hover:bg-pink-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Generate Text Effect
            </button>
          </div>
        </div>
      )}

      {/* Outpaint Tab */}
      {activeTab === 'outpaint' && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-700">Image Extension</h3>
          <p className="text-sm text-gray-600">Extend your image borders with AI</p>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">Direction</label>
            <div className="grid grid-cols-3 gap-2">
              {['left', 'right', 'top', 'bottom', 'all'].map((dir) => (
                <button
                  key={dir}
                  onClick={() => setOutpaintDirection(dir)}
                  disabled={disabled || !hasImage}
                  className={`px-4 py-2 rounded transition-colors capitalize disabled:opacity-50 disabled:cursor-not-allowed ${
                    outpaintDirection === dir
                      ? 'bg-orange-500 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {dir}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">
              Expand Pixels: {outpaintPixels}
            </label>
            <input
              type="range"
              min="64"
              max="512"
              step="16"
              value={outpaintPixels}
              onChange={(e) => setOutpaintPixels(Number(e.target.value))}
              disabled={disabled || !hasImage}
              className="w-full"
            />
          </div>

          <input
            type="text"
            value={outpaintPrompt}
            onChange={(e) => setOutpaintPrompt(e.target.value)}
            placeholder="Guide the extension (optional)..."
            disabled={disabled || !hasImage}
            className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
          />

          <button
            onClick={handleOutpaint}
            disabled={disabled || !hasImage}
            className="w-full px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Extend Image
          </button>
        </div>
      )}

      {/* AI Not Enabled Warning */}
      {!aiEnabled && activeTab !== 'basic' && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
          <p className="text-sm text-yellow-800">
            AI features are disabled. Set ENABLE_STABLE_DIFFUSION=true in backend .env to enable.
          </p>
        </div>
      )}
    </div>
  );
};

export default EditingPanel;
