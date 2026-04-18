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
      className="lex4-sidebar-action-btn"
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
          className="lex4-history-empty"
          data-testid="history-empty"
        >
          {t.history.empty}
        </div>
      ) : (
        <ol className="lex4-history-list" data-testid="history-entry-list">
          {visibleEntries.map((entry, reversedIndex) => {
            const actualIndex = historyEntries.length - reversedIndex - 1;
            const isCurrent = actualIndex === historyCursor - 1;

            return (
              <li key={entry.id}>
                <button
                  type="button"
                  className={`lex4-history-entry ${
                    isCurrent ? 'active' : ''
                  }`}
                  data-testid={`history-entry-${actualIndex}`}
                  data-history-current={isCurrent ? 'true' : 'false'}
                  onClick={() => jumpToHistoryEntry(actualIndex)}
                >
                  <div className="lex4-history-entry-row">
                    <div className="lex4-history-entry-dot" />
                    <div className="lex4-history-entry-content">
                      <div className="lex4-history-entry-label">
                        {entry.label}
                      </div>
                      <div className="lex4-history-entry-meta">
                        <span className="lex4-history-entry-source">
                          {t.regions[entry.source as keyof typeof t.regions] ?? entry.source}
                        </span>
                        <span className="lex4-history-entry-meta-dot">·</span>
                        <span className="lex4-history-entry-time">
                          {formatTimestamp(entry.timestamp)}
                        </span>
                      </div>
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
