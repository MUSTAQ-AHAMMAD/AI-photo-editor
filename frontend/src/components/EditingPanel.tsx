import React, { useState } from 'react';

export type FilterType = 'none' | 'blur' | 'sharpen' | 'edge' | 'grayscale';

interface EditingPanelProps {
  onRemoveBackground: () => void;
  onApplyFilter: (filter: FilterType) => void;
  onAdjustBrightness: (factor: number) => void;
  onGenerateImage: (prompt: string) => void;
  disabled?: boolean;
  aiEnabled?: boolean;
}

const EditingPanel: React.FC<EditingPanelProps> = ({
  onRemoveBackground,
  onApplyFilter,
  onAdjustBrightness,
  onGenerateImage,
  disabled = false,
  aiEnabled = false,
}) => {
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('none');
  const [brightness, setBrightness] = useState(1.0);
  const [prompt, setPrompt] = useState('');

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
      onGenerateImage(prompt);
    }
  };

  return (
    <div className="space-y-6 p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-gray-800">Editing Tools</h2>

      {/* Background Removal */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-gray-700">Background</h3>
        <button
          onClick={onRemoveBackground}
          disabled={disabled}
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
              disabled={disabled}
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
          disabled={disabled}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-gray-500">
          <span>Darker</span>
          <span>Normal</span>
          <span>Brighter</span>
        </div>
      </div>

      {/* AI Image Generation */}
      {aiEnabled && (
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-gray-700">AI Generation</h3>
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe the image you want to generate..."
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

      {!aiEnabled && (
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
