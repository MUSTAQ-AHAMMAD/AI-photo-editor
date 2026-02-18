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
    <div className="space-y-4 p-6 bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-xl border border-gray-100">
      <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
        Advanced AI Tools
      </h2>

      {/* AI Status Warning - Show at top if AI is disabled */}
      {!aiEnabled && (
        <div className="p-4 bg-gradient-to-r from-yellow-50 to-amber-50 border-2 border-yellow-400 rounded-xl shadow-md">
          <div className="flex items-start gap-3">
            <span className="text-2xl">⚠️</span>
            <div className="flex-1">
              <p className="text-sm font-semibold text-yellow-900 mb-1">
                AI Features Currently Disabled
              </p>
              <p className="text-xs text-yellow-800 mb-2">
                Advanced AI tools (Generate, Effects, Extend) require Stable Diffusion to be enabled.
              </p>
              <div className="text-xs text-yellow-900 bg-yellow-100 p-2 rounded border border-yellow-300">
                <p className="font-semibold mb-1">To enable AI features:</p>
                <ol className="list-decimal list-inside space-y-1 ml-2">
                  <li>Create <code className="bg-yellow-200 px-1 rounded">backend/.env</code> file from <code className="bg-yellow-200 px-1 rounded">.env.example</code></li>
                  <li>Set <code className="bg-yellow-200 px-1 rounded">ENABLE_STABLE_DIFFUSION=true</code></li>
                  <li>Restart the backend server</li>
                </ol>
                <p className="mt-2 text-yellow-700">
                  Note: First run will download ~4GB of AI models. Requires 8GB+ RAM.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex space-x-2 border-b border-gray-200 pb-1">
        {tabs.map((tab) => {
          const isDisabled = tab.requiresAI && !aiEnabled;
          return (
            <div key={tab.id} className="relative group">
              <button
                onClick={() => setActiveTab(tab.id)}
                disabled={isDisabled}
                className={`px-5 py-2.5 font-semibold rounded-t-lg transition-all duration-200 ${
                  isDisabled
                    ? 'opacity-40 cursor-not-allowed bg-gray-200 text-gray-500'
                    : activeTab === tab.id
                    ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-md transform -translate-y-0.5'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                {tab.icon} {tab.name}
                {isDisabled && <span className="ml-1 text-xs">🔒</span>}
              </button>
              {/* Tooltip for disabled tabs */}
              {isDisabled && (
                <div className="absolute hidden group-hover:block z-10 w-64 p-2 mt-1 text-xs text-white bg-gray-900 rounded shadow-lg -left-20">
                  <p className="font-semibold mb-1">🔒 AI Feature Locked</p>
                  <p>Enable Stable Diffusion in backend settings to unlock this feature.</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Basic Tab */}
      {activeTab === 'basic' && (
        <div className="space-y-4 pt-4">
          {/* Background Removal */}
          <div className="space-y-2 p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <span className="text-2xl">🎭</span> Background
            </h3>
            <button
              onClick={onRemoveBackground}
              disabled={disabled || !hasImage}
              className="w-full px-4 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-md hover:shadow-lg"
            >
              Remove Background
            </button>
          </div>

          {/* Filters */}
          <div className="space-y-2 p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <span className="text-2xl">🎨</span> Filters
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {(['none', 'blur', 'sharpen', 'edge', 'grayscale'] as FilterType[]).map((filter) => (
                <button
                  key={filter}
                  onClick={() => handleFilterChange(filter)}
                  disabled={disabled || !hasImage}
                  className={`px-4 py-2.5 rounded-lg transition-all duration-200 capitalize disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-sm hover:shadow-md ${
                    selectedFilter === filter
                      ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          {/* Brightness */}
          <div className="space-y-2 p-4 bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl border border-amber-200">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <span className="text-2xl">💡</span> Brightness: <span className="text-amber-600">{brightness.toFixed(1)}x</span>
            </h3>
            <input
              type="range"
              min="0.1"
              max="3.0"
              step="0.1"
              value={brightness}
              onChange={(e) => handleBrightnessChange(Number(e.target.value))}
              disabled={disabled || !hasImage}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
          </div>
        </div>
      )}

      {/* Generate Tab */}
      {activeTab === 'generate' && (
        <div className="space-y-4 pt-4">
          <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-100 rounded-xl border border-green-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <span className="text-2xl">✨</span> Text to Image Generation
            </h3>
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe the image you want to generate..."
              disabled={disabled}
              className="w-full px-4 py-3 border-2 border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent shadow-sm"
            />

            <div className="space-y-2 mt-4">
              <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <span>🎨</span> Style Preset
              </label>
              <select
                value={stylePreset}
                onChange={(e) => setStylePreset(e.target.value)}
                disabled={disabled}
                className="w-full px-4 py-3 border-2 border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent shadow-sm bg-white"
              >
                {stylePresets.map((preset) => (
                  <option key={preset.id} value={preset.id}>
                    {preset.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2 mt-4">
              <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <span>📐</span> Aspect Ratio
              </label>
              <select
                value={aspectRatio}
                onChange={(e) => setAspectRatio(e.target.value)}
                disabled={disabled}
                className="w-full px-4 py-3 border-2 border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent shadow-sm bg-white"
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
              className="w-full px-4 py-3 mt-4 border-2 border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent shadow-sm"
            />

            <button
              onClick={handleGenerateImage}
              disabled={disabled || !prompt.trim()}
              className="w-full px-4 py-3 mt-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-md hover:shadow-lg"
            >
              Generate Image
            </button>
          </div>
        </div>
      )}

      {/* Effects Tab */}
      {activeTab === 'effects' && (
        <div className="space-y-4 pt-4">
          {/* Generative Fill */}
          <div className="space-y-3 p-4 bg-gradient-to-br from-blue-50 to-cyan-100 rounded-xl border border-blue-200 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <span className="text-2xl">🎯</span> Generative Fill
            </h3>
            <p className="text-sm text-gray-600">Use canvas to select area, then describe what to add</p>
            <input
              type="text"
              value={fillPrompt}
              onChange={(e) => setFillPrompt(e.target.value)}
              placeholder="What to generate in selected area..."
              disabled={disabled || !hasImage}
              className="w-full px-4 py-3 border-2 border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
            />
            <input
              type="text"
              value={fillNegativePrompt}
              onChange={(e) => setFillNegativePrompt(e.target.value)}
              placeholder="What to avoid (optional)..."
              disabled={disabled || !hasImage}
              className="w-full px-4 py-3 border-2 border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
            />
            <button
              onClick={handleGenerateFill}
              disabled={disabled || !hasImage || !fillPrompt.trim()}
              className="w-full px-4 py-3 bg-gradient-to-r from-blue-500 to-cyan-600 text-white rounded-lg hover:from-blue-600 hover:to-cyan-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-md hover:shadow-lg"
            >
              Apply Generative Fill
            </button>
          </div>

          {/* Style Transfer */}
          <div className="space-y-3 p-4 bg-gradient-to-br from-purple-50 to-pink-100 rounded-xl border border-purple-200 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <span className="text-2xl">🎨</span> Style Transfer
            </h3>
            <input
              type="text"
              value={styleTransferPrompt}
              onChange={(e) => setStyleTransferPrompt(e.target.value)}
              placeholder="Describe the style (e.g., 'oil painting', 'cyberpunk')..."
              disabled={disabled || !hasImage}
              className="w-full px-4 py-3 border-2 border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent shadow-sm"
            />
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <span>💪</span> Strength: <span className="text-purple-600">{styleStrength.toFixed(2)}</span>
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={styleStrength}
                onChange={(e) => setStyleStrength(Number(e.target.value))}
                disabled={disabled || !hasImage}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-500"
              />
            </div>
            <button
              onClick={handleStyleTransfer}
              disabled={disabled || !hasImage || !styleTransferPrompt.trim()}
              className="w-full px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-lg hover:from-purple-600 hover:to-pink-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-md hover:shadow-lg"
            >
              Apply Style Transfer
            </button>
          </div>

          {/* Text Effects */}
          <div className="space-y-3 p-4 bg-gradient-to-br from-pink-50 to-rose-100 rounded-xl border border-pink-200 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <span className="text-2xl">✍️</span> Text Effects
            </h3>
            <input
              type="text"
              value={textEffectText}
              onChange={(e) => setTextEffectText(e.target.value)}
              placeholder="Enter text..."
              disabled={disabled}
              className="w-full px-4 py-3 border-2 border-pink-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent shadow-sm"
            />
            <select
              value={textEffectStyle}
              onChange={(e) => setTextEffectStyle(e.target.value)}
              disabled={disabled}
              className="w-full px-4 py-3 border-2 border-pink-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent shadow-sm bg-white"
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
              className="w-full px-4 py-3 bg-gradient-to-r from-pink-500 to-rose-600 text-white rounded-lg hover:from-pink-600 hover:to-rose-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-md hover:shadow-lg"
            >
              Generate Text Effect
            </button>
          </div>
        </div>
      )}

      {/* Outpaint Tab */}
      {activeTab === 'outpaint' && (
        <div className="space-y-4 pt-4">
          <div className="p-4 bg-gradient-to-br from-orange-50 to-amber-100 rounded-xl border border-orange-200 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-800 mb-2 flex items-center gap-2">
              <span className="text-2xl">🖼️</span> Image Extension
            </h3>
            <p className="text-sm text-gray-600 mb-4">Extend your image borders with AI</p>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Direction</label>
              <div className="grid grid-cols-3 gap-2">
                {['left', 'right', 'top', 'bottom', 'all'].map((dir) => (
                  <button
                    key={dir}
                    onClick={() => setOutpaintDirection(dir)}
                    disabled={disabled || !hasImage}
                    className={`px-4 py-2.5 rounded-lg transition-all duration-200 capitalize disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-sm hover:shadow-md ${
                      outpaintDirection === dir
                        ? 'bg-gradient-to-r from-orange-500 to-amber-600 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                    }`}
                  >
                    {dir}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2 mt-4">
              <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <span>📏</span> Expand Pixels: <span className="text-orange-600">{outpaintPixels}</span>
              </label>
              <input
                type="range"
                min="64"
                max="512"
                step="16"
                value={outpaintPixels}
                onChange={(e) => setOutpaintPixels(Number(e.target.value))}
                disabled={disabled || !hasImage}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
              />
            </div>

            <input
              type="text"
              value={outpaintPrompt}
              onChange={(e) => setOutpaintPrompt(e.target.value)}
              placeholder="Guide the extension (optional)..."
              disabled={disabled || !hasImage}
              className="w-full px-4 py-3 mt-4 border-2 border-orange-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent shadow-sm"
            />

            <button
              onClick={handleOutpaint}
              disabled={disabled || !hasImage}
              className="w-full px-4 py-3 mt-4 bg-gradient-to-r from-orange-500 to-amber-600 text-white rounded-lg hover:from-orange-600 hover:to-amber-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-md hover:shadow-lg"
            >
              Extend Image
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditingPanel;
