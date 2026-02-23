import React from 'react';
import type { AIEngine } from '../services/api';

interface EngineSelectorProps {
  engines: AIEngine[];
  selectedEngine: string;
  onSelect: (engineId: string) => void;
  disabled?: boolean;
}

const ENGINE_ICONS: Record<string, string> = {
  openai_dalle3: '🤖',
  replicate: '⚡',
  huggingface: '🤗',
  stable_diffusion_local: '💻',
  placeholder: '🎨',
};

const EngineSelector: React.FC<EngineSelectorProps> = ({
  engines,
  selectedEngine,
  onSelect,
  disabled = false,
}) => {
  return (
    <div className="space-y-2">
      <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
        <span>🔧</span> AI Engine
      </label>
      <div className="grid grid-cols-1 gap-2">
        {engines.map((engine) => {
          const isSelected = selectedEngine === engine.id;
          const icon = ENGINE_ICONS[engine.id] || '🌐';
          return (
            <button
              key={engine.id}
              onClick={() => onSelect(engine.id)}
              disabled={disabled || !engine.available}
              title={engine.available ? engine.description : `${engine.description} — API key not configured`}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg border-2 text-left transition-all duration-200 ${
                !engine.available
                  ? 'opacity-40 cursor-not-allowed bg-gray-50 border-gray-200 text-gray-400'
                  : isSelected
                  ? 'border-indigo-500 bg-indigo-50 text-indigo-900 shadow-md'
                  : 'border-gray-200 bg-white hover:border-indigo-300 hover:bg-indigo-50 text-gray-700'
              }`}
            >
              <span className="text-xl flex-shrink-0">{icon}</span>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm flex items-center gap-2">
                  {engine.name}
                  {!engine.available && (
                    <span className="text-xs bg-gray-200 text-gray-500 px-1.5 py-0.5 rounded">
                      No API key
                    </span>
                  )}
                  {engine.available && isSelected && (
                    <span className="text-xs bg-indigo-200 text-indigo-700 px-1.5 py-0.5 rounded">
                      Selected
                    </span>
                  )}
                </div>
                <div className="text-xs text-gray-500 truncate mt-0.5">{engine.description}</div>
              </div>
            </button>
          );
        })}
      </div>
      {engines.length === 0 && (
        <p className="text-xs text-gray-500 italic">Loading engines…</p>
      )}
    </div>
  );
};

export default EngineSelector;
