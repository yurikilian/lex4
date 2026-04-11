import React from 'react';
import type { PageCounterMode } from '../types/document';

interface HeaderFooterActionsProps {
  activePageId: string | null;
  pageCounterMode: PageCounterMode;
  onPageCounterModeChange: (mode: PageCounterMode) => void;
  onCopyHeaderToAll: () => void;
  onCopyFooterToAll: () => void;
  onClearHeader: () => void;
  onClearFooter: () => void;
  onClearAllHeaders: () => void;
  onClearAllFooters: () => void;
}

/**
 * HeaderFooterActions — Buttons for copy/clear operations
 * on headers and footers.
 */
export const HeaderFooterActions: React.FC<HeaderFooterActionsProps> = ({
  activePageId,
  pageCounterMode,
  onPageCounterModeChange,
  onCopyHeaderToAll,
  onCopyFooterToAll,
  onClearHeader,
  onClearFooter,
  onClearAllHeaders,
  onClearAllFooters,
}) => {
  const hasActivePage = activePageId !== null;
  const handlePageCounterModeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const nextMode = event.target.value;
    if (nextMode === 'none' || nextMode === 'header' || nextMode === 'footer' || nextMode === 'both') {
      onPageCounterModeChange(nextMode);
    }
  };

  return (
    <div
      className="flex flex-wrap items-center gap-2"
      data-testid="header-footer-actions"
    >
      <label className="flex items-center gap-2 text-xs text-gray-600" htmlFor="page-counter-mode">
        <span>Page counter</span>
        <select
          id="page-counter-mode"
          className="rounded border border-gray-300 bg-white px-2 py-1 text-xs"
          data-testid="page-counter-mode"
          value={pageCounterMode}
          onChange={handlePageCounterModeChange}
        >
          <option value="none">None</option>
          <option value="header">Header</option>
          <option value="footer">Footer</option>
          <option value="both">Both</option>
        </select>
      </label>

      <ActionButton
        label="Copy Header → All"
        onClick={onCopyHeaderToAll}
        disabled={!hasActivePage}
        testId="copy-header-all"
      />
      <ActionButton
        label="Copy Footer → All"
        onClick={onCopyFooterToAll}
        disabled={!hasActivePage}
        testId="copy-footer-all"
      />
      <ActionButton
        label="Clear Header"
        onClick={onClearHeader}
        disabled={!hasActivePage}
        testId="clear-header"
      />
      <ActionButton
        label="Clear Footer"
        onClick={onClearFooter}
        disabled={!hasActivePage}
        testId="clear-footer"
      />
      <ActionButton
        label="Clear All Headers"
        onClick={onClearAllHeaders}
        testId="clear-all-headers"
      />
      <ActionButton
        label="Clear All Footers"
        onClick={onClearAllFooters}
        testId="clear-all-footers"
      />
    </div>
  );
};

interface ActionButtonProps {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  testId: string;
}

const ActionButton: React.FC<ActionButtonProps> = ({ label, onClick, disabled, testId }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded border border-gray-300
               disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    data-testid={testId}
  >
    {label}
  </button>
);
