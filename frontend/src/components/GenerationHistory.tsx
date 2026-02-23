import React from 'react';

export interface HistoryEntry {
  id: string;
  imageUrl: string;
  prompt: string;
  engineName: string;
  engineId: string;
  timestamp: number;
  outputFormat: string;
}

interface GenerationHistoryProps {
  history: HistoryEntry[];
  onSelect: (entry: HistoryEntry) => void;
  onClear: () => void;
  onCompare: (entries: [HistoryEntry, HistoryEntry]) => void;
}

const GenerationHistory: React.FC<GenerationHistoryProps> = ({
  history,
  onSelect,
  onClear,
  onCompare,
}) => {
  const [selected, setSelected] = React.useState<string[]>([]);

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 2) return [prev[1], id];
      return [...prev, id];
    });
  };

  const handleCompare = () => {
    if (selected.length === 2) {
      const a = history.find((h) => h.id === selected[0]);
      const b = history.find((h) => h.id === selected[1]);
      if (a && b) onCompare([a, b]);
    }
  };

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (history.length === 0) {
    return (
      <div className="p-4 text-center text-gray-400 text-sm italic">
        No generations yet. Create your first image above! ✨
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-700 text-sm flex items-center gap-2">
          <span>🕐</span> Generation History
          <span className="bg-gray-200 text-gray-600 text-xs px-2 py-0.5 rounded-full">
            {history.length}
          </span>
        </h3>
        <div className="flex gap-2">
          {selected.length === 2 && (
            <button
              onClick={handleCompare}
              className="text-xs px-3 py-1.5 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors"
            >
              Compare ↔
            </button>
          )}
          <button
            onClick={onClear}
            className="text-xs px-3 py-1.5 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
          >
            Clear
          </button>
        </div>
      </div>

      {selected.length > 0 && (
        <p className="text-xs text-indigo-600 italic">
          {selected.length === 1 ? 'Select one more to compare' : 'Press Compare to view side-by-side'}
        </p>
      )}

      <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto pr-1">
        {history.map((entry) => {
          const isSelected = selected.includes(entry.id);
          return (
            <div
              key={entry.id}
              className={`relative group rounded-lg overflow-hidden border-2 cursor-pointer transition-all duration-200 ${
                isSelected ? 'border-indigo-500 ring-2 ring-indigo-300' : 'border-transparent hover:border-gray-300'
              }`}
            >
              <img
                src={entry.imageUrl}
                alt={entry.prompt}
                className="w-full aspect-square object-cover"
                onClick={() => onSelect(entry)}
              />
              <div
                className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-200 flex items-end"
                onClick={() => onSelect(entry)}
              >
                <div className="w-full p-1.5 bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="text-xs truncate font-medium">{entry.prompt}</p>
                  <p className="text-xs text-gray-300">{entry.engineName} · {formatTime(entry.timestamp)}</p>
                </div>
              </div>
              {/* Select for compare checkbox */}
              <button
                onClick={(e) => { e.stopPropagation(); toggleSelect(entry.id); }}
                className={`absolute top-1 right-1 w-5 h-5 rounded flex items-center justify-center text-xs font-bold transition-colors ${
                  isSelected ? 'bg-indigo-500 text-white' : 'bg-white/80 text-gray-600 hover:bg-indigo-100'
                }`}
                title="Select for comparison"
              >
                {isSelected ? '✓' : '+'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default GenerationHistory;
