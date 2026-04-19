import React, { useCallback } from 'react';
import { useDocument } from '../context/document-context';
import { useTranslations, interpolate } from '../i18n';
import type { PageCounterMode } from '../types/document';
import { HeaderFooterToggle } from './HeaderFooterToggle';
import { HeaderFooterActions } from './HeaderFooterActions';

export const CanvasControls: React.FC = () => {
  const { document, dispatch, activePageId, runHistoryAction } = useDocument();
  const t = useTranslations();

  const runCanvasAction = useCallback((label: string, callback: () => void) => {
    runHistoryAction(
      {
        label,
        source: 'toolbar',
        region: 'document',
      },
      callback,
    );
  }, [runHistoryAction]);

  const handleToggle = useCallback((enabled: boolean) => {
    runCanvasAction(
      enabled ? t.history.actions.enabledHeadersFooters : t.history.actions.disabledHeadersFooters,
      () => {
        dispatch({ type: 'SET_HEADER_FOOTER_ENABLED', enabled });
      },
    );
  }, [dispatch, runCanvasAction, t.history.actions.disabledHeadersFooters, t.history.actions.enabledHeadersFooters]);

  const handleCopyHeaderToAll = useCallback(() => {
    if (!activePageId) {
      return;
    }

    runCanvasAction(t.history.actions.copiedHeaderToAll, () => {
      dispatch({ type: 'COPY_HEADER_TO_ALL', sourcePageId: activePageId });
    });
  }, [activePageId, dispatch, runCanvasAction, t.history.actions.copiedHeaderToAll]);

  const handleCopyFooterToAll = useCallback(() => {
    if (!activePageId) {
      return;
    }

    runCanvasAction(t.history.actions.copiedFooterToAll, () => {
      dispatch({ type: 'COPY_FOOTER_TO_ALL', sourcePageId: activePageId });
    });
  }, [activePageId, dispatch, runCanvasAction, t.history.actions.copiedFooterToAll]);

  const handleClearHeader = useCallback(() => {
    if (!activePageId) {
      return;
    }

    runCanvasAction(t.history.actions.clearedHeader, () => {
      dispatch({ type: 'CLEAR_HEADER', pageId: activePageId });
    });
  }, [activePageId, dispatch, runCanvasAction, t.history.actions.clearedHeader]);

  const handleClearFooter = useCallback(() => {
    if (!activePageId) {
      return;
    }

    runCanvasAction(t.history.actions.clearedFooter, () => {
      dispatch({ type: 'CLEAR_FOOTER', pageId: activePageId });
    });
  }, [activePageId, dispatch, runCanvasAction, t.history.actions.clearedFooter]);

  const handleClearAllHeaders = useCallback(() => {
    runCanvasAction(t.history.actions.clearedAllHeaders, () => {
      dispatch({ type: 'CLEAR_ALL_HEADERS' });
    });
  }, [dispatch, runCanvasAction, t.history.actions.clearedAllHeaders]);

  const handleClearAllFooters = useCallback(() => {
    runCanvasAction(t.history.actions.clearedAllFooters, () => {
      dispatch({ type: 'CLEAR_ALL_FOOTERS' });
    });
  }, [dispatch, runCanvasAction, t.history.actions.clearedAllFooters]);

  const handlePageCounterModeChange = useCallback((mode: PageCounterMode) => {
    runCanvasAction(interpolate(t.history.actions.pageCounterSet, { value: mode }), () => {
      dispatch({ type: 'SET_PAGE_COUNTER_MODE', mode });
    });
  }, [dispatch, runCanvasAction, t.history.actions.pageCounterSet]);

  return (
    <div className="lex4-toolbar-group lex4-toolbar-group-gap" data-testid="header-footer-controls">
      <HeaderFooterToggle
        enabled={document.headerFooterEnabled}
        onToggle={handleToggle}
      />

      {document.headerFooterEnabled && (
        <HeaderFooterActions
          activePageId={activePageId}
          pageCounterMode={document.pageCounterMode}
          onPageCounterModeChange={handlePageCounterModeChange}
          onCopyHeaderToAll={handleCopyHeaderToAll}
          onCopyFooterToAll={handleCopyFooterToAll}
          onClearHeader={handleClearHeader}
          onClearFooter={handleClearFooter}
          onClearAllHeaders={handleClearAllHeaders}
          onClearAllFooters={handleClearAllFooters}
        />
      )}
    </div>
  );
};
