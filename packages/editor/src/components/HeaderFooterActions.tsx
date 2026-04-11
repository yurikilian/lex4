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
      className="flex flex-wrap items-center gap-1"
      data-testid="header-footer-actions"
    >
      <label className="flex items-center gap-1 text-xs text-gray-600" htmlFor="page-counter-mode">
        <span>Page counter</span>
        <select
          id="page-counter-mode"
          className="h-6 rounded border border-gray-200 bg-white px-1.5 text-xs text-gray-700
                     focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
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
    onMouseDown={(e) => e.preventDefault()}
    onClick={onClick}
    disabled={disabled}
    className="h-6 rounded border border-gray-200 bg-white px-2 text-xs text-gray-600
               transition-colors hover:bg-gray-50 hover:text-gray-900
               disabled:cursor-not-allowed disabled:opacity-40"
    data-testid={testId}
  >
    {label}
  </button>
);
