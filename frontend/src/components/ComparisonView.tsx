import React from 'react';
import type { HistoryEntry } from './GenerationHistory';

interface ComparisonViewProps {
  entries: [HistoryEntry, HistoryEntry];
  onClose: () => void;
}

const ComparisonView: React.FC<ComparisonViewProps> = ({ entries, onClose }) => {
  const [a, b] = entries;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            ↔ Side-by-Side Comparison
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
            aria-label="Close comparison"
          >
            ×
          </button>
        </div>

        {/* Images */}
        <div className="flex flex-1 overflow-hidden">
          {[a, b].map((entry, idx) => (
            <div key={entry.id} className={`flex-1 flex flex-col ${idx === 0 ? 'border-r border-gray-200' : ''}`}>
              <div className="flex-1 overflow-hidden bg-gray-50 flex items-center justify-center p-2">
                <img
                  src={entry.imageUrl}
                  alt={entry.prompt}
                  className="max-w-full max-h-full object-contain rounded"
                />
              </div>
              <div className="px-4 py-3 border-t border-gray-100 bg-white flex-shrink-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold text-indigo-600 uppercase tracking-wide">
                    {idx === 0 ? 'A' : 'B'}
                  </span>
                  <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-medium">
                    {entry.engineName}
                  </span>
                </div>
                <p className="text-sm text-gray-700 line-clamp-2">{entry.prompt}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(entry.timestamp).toLocaleTimeString()}
                </p>
                <a
                  href={entry.imageUrl}
                  download={`comparison-${idx === 0 ? 'A' : 'B'}.${entry.outputFormat}`}
                  className="inline-block mt-2 text-xs px-3 py-1.5 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors"
                >
                  ⬇ Download {idx === 0 ? 'A' : 'B'}
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ComparisonView;
