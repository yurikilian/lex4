import React from 'react';

import { useDocument } from '../context/document-context';
import { EditorSidebar } from './EditorSidebar';

function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export const HistorySidebar: React.FC = () => {
  const {
    historyEntries,
    historyCursor,
    historySidebarOpen,
    jumpToHistoryEntry,
    setHistorySidebarOpen,
  } = useDocument();

  const visibleEntries = historyEntries.slice().reverse();

  return (
    <EditorSidebar
      title="History"
      subtitle="Word-style session history (last 100 actions)"
      open={historySidebarOpen}
      onClose={() => setHistorySidebarOpen(false)}
    >
      {visibleEntries.length === 0 ? (
        <div
          className="px-4 py-6 text-sm text-gray-500"
          data-testid="history-empty"
        >
          No history yet.
        </div>
      ) : (
        <ol className="divide-y divide-gray-100" data-testid="history-entry-list">
          {visibleEntries.map((entry, reversedIndex) => {
            const actualIndex = historyEntries.length - reversedIndex - 1;
            const isCurrent = actualIndex === historyCursor - 1;

            return (
              <li key={entry.id}>
                <button
                  type="button"
                  className={`w-full px-4 py-3 text-left transition-colors ${
                    isCurrent ? 'bg-blue-50' : 'bg-white hover:bg-gray-50'
                  }`}
                  data-testid={`history-entry-${actualIndex}`}
                  data-history-current={isCurrent ? 'true' : 'false'}
                  onClick={() => jumpToHistoryEntry(actualIndex)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className={`text-sm ${isCurrent ? 'font-semibold text-blue-700' : 'text-gray-900'}`}>
                        {entry.label}
                      </div>
                      <div className="mt-1 text-xs text-gray-500">
                        {entry.source}
                      </div>
                    </div>
                    <div className="shrink-0 text-xs text-gray-400">
                      {formatTimestamp(entry.timestamp)}
                    </div>
                  </div>
                </button>
              </li>
            );
          })}
        </ol>
      )}
    </EditorSidebar>
  );
};
