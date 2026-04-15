import React from 'react';
import { Trash2 } from 'lucide-react';
import { useDocument } from '../context/document-context';
import { EditorSidebar } from './EditorSidebar';
import { useTranslations } from '../i18n';

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
    clearHistory,
    historyEntries,
    historyCursor,
    historySidebarOpen,
    jumpToHistoryEntry,
    setHistorySidebarOpen,
  } = useDocument();
  const t = useTranslations();

  const visibleEntries = historyEntries.slice().reverse();

  const headerActions = (
    <button
      type="button"
      title={t.history.clearHistory}
      aria-label={t.history.clearHistory}
      onMouseDown={(e) => e.preventDefault()}
      onClick={() => clearHistory('manual')}
      className="flex h-6 w-6 items-center justify-center rounded text-gray-400
                 transition-colors hover:bg-gray-100 hover:text-gray-600"
      data-testid="clear-history"
    >
      <Trash2 size={13} />
    </button>
  );

  return (
    <EditorSidebar
      title={t.history.title}
      subtitle={t.history.subtitle}
      open={historySidebarOpen}
      onClose={() => setHistorySidebarOpen(false)}
      headerActions={headerActions}
      testId="history-sidebar"
    >
      {visibleEntries.length === 0 ? (
        <div
          className="px-3 py-4 text-xs text-gray-500"
          data-testid="history-empty"
        >
          {t.history.empty}
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
                  className={`w-full px-3 py-2 text-left transition-colors ${
                    isCurrent ? 'bg-blue-50' : 'bg-white hover:bg-gray-50'
                  }`}
                  data-testid={`history-entry-${actualIndex}`}
                  data-history-current={isCurrent ? 'true' : 'false'}
                  onClick={() => jumpToHistoryEntry(actualIndex)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className={`text-xs ${isCurrent ? 'font-semibold text-blue-700' : 'text-gray-900'}`}>
                        {entry.label}
                      </div>
                      <div className="mt-0.5 text-xs text-gray-400">
                        {t.regions[entry.source as keyof typeof t.regions] ?? entry.source}
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
