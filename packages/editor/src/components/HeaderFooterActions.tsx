import React from 'react';
import {
  Hash,
  CopyPlus,
  Eraser,
  Trash2,
} from 'lucide-react';
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
      className="flex flex-wrap items-center gap-2 text-xs"
      data-testid="header-footer-actions"
    >
      <label className="flex items-center gap-1 text-gray-500" htmlFor="page-counter-mode">
        <Hash size={13} className="text-gray-400" />
        <select
          id="page-counter-mode"
          className="h-6 rounded border border-gray-200 bg-white px-1.5 text-xs text-gray-600
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

      <ActionDivider />

      <span className="text-gray-400 font-medium">Header</span>
      <ActionIconButton
        title="Copy header to all pages"
        icon={<CopyPlus size={13} />}
        onClick={onCopyHeaderToAll}
        disabled={!hasActivePage}
        testId="copy-header-all"
      />
      <ActionIconButton
        title="Clear header on this page"
        icon={<Eraser size={13} />}
        onClick={onClearHeader}
        disabled={!hasActivePage}
        testId="clear-header"
      />
      <ActionIconButton
        title="Clear all headers"
        icon={<Trash2 size={13} />}
        onClick={onClearAllHeaders}
        testId="clear-all-headers"
      />

      <ActionDivider />

      <span className="text-gray-400 font-medium">Footer</span>
      <ActionIconButton
        title="Copy footer to all pages"
        icon={<CopyPlus size={13} />}
        onClick={onCopyFooterToAll}
        disabled={!hasActivePage}
        testId="copy-footer-all"
      />
      <ActionIconButton
        title="Clear footer on this page"
        icon={<Eraser size={13} />}
        onClick={onClearFooter}
        disabled={!hasActivePage}
        testId="clear-footer"
      />
      <ActionIconButton
        title="Clear all footers"
        icon={<Trash2 size={13} />}
        onClick={onClearAllFooters}
        testId="clear-all-footers"
      />
    </div>
  );
};

interface ActionIconButtonProps {
  title: string;
  icon: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  testId: string;
}

const ActionIconButton: React.FC<ActionIconButtonProps> = ({ title, icon, onClick, disabled, testId }) => (
  <button
    type="button"
    title={title}
    aria-label={title}
    onMouseDown={(e) => e.preventDefault()}
    onClick={onClick}
    disabled={disabled}
    className="flex h-6 w-6 items-center justify-center rounded text-gray-500 transition-colors
               hover:bg-gray-200/60 hover:text-gray-700
               disabled:cursor-not-allowed disabled:text-gray-300"
    data-testid={testId}
  >
    {icon}
  </button>
);

const ActionDivider: React.FC = () => (
  <div className="mx-0.5 h-4 w-px bg-gray-300/60" />
);
