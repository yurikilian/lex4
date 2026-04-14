import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Settings,
  ChevronDown,
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

const PAGE_COUNTER_OPTIONS: { value: PageCounterMode; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'header', label: 'Header' },
  { value: 'footer', label: 'Footer' },
  { value: 'both', label: 'Both' },
];

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
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const hasActivePage = activePageId !== null;

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        close();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open, close]);

  const handleAction = (action: () => void) => {
    action();
    close();
  };

  return (
    <div ref={containerRef} className="relative" data-testid="header-footer-actions">
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => setOpen(!open)}
        className={`
          flex h-7 items-center gap-1 rounded px-1.5 text-xs transition-colors
          ${open
            ? 'bg-blue-50 text-blue-600'
            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}
        `}
        data-testid="header-footer-menu-trigger"
        aria-expanded={open}
        aria-haspopup="true"
      >
        <Settings size={14} />
        <ChevronDown size={12} />
      </button>

      {open && (
        <div
          className="absolute left-0 top-full mt-1 z-50 w-56 rounded-lg border border-gray-200 bg-white py-1 shadow-lg"
          role="menu"
          data-testid="header-footer-menu"
        >
          <SectionLabel>Page counter</SectionLabel>
          <div className="px-3 pb-2 grid grid-cols-2 gap-1" data-testid="page-counter-mode">
            {PAGE_COUNTER_OPTIONS.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                role="menuitemradio"
                aria-checked={pageCounterMode === value}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => onPageCounterModeChange(value)}
                className={`
                  rounded px-2 py-1 text-xs text-left transition-colors
                  ${pageCounterMode === value
                    ? 'bg-blue-50 text-blue-700 font-medium'
                    : 'text-gray-600 hover:bg-gray-100'}
                `}
                data-testid={`page-counter-${value}`}
              >
                {label}
              </button>
            ))}
          </div>

          <MenuDivider />

          <SectionLabel>Header</SectionLabel>
          <MenuItem
            icon={<CopyPlus size={14} />}
            label="Copy to all pages"
            onClick={() => handleAction(onCopyHeaderToAll)}
            disabled={!hasActivePage}
            testId="copy-header-all"
          />
          <MenuItem
            icon={<Eraser size={14} />}
            label="Clear this page"
            onClick={() => handleAction(onClearHeader)}
            disabled={!hasActivePage}
            testId="clear-header"
          />
          <MenuItem
            icon={<Trash2 size={14} />}
            label="Clear all"
            onClick={() => handleAction(onClearAllHeaders)}
            testId="clear-all-headers"
          />

          <MenuDivider />

          <SectionLabel>Footer</SectionLabel>
          <MenuItem
            icon={<CopyPlus size={14} />}
            label="Copy to all pages"
            onClick={() => handleAction(onCopyFooterToAll)}
            disabled={!hasActivePage}
            testId="copy-footer-all"
          />
          <MenuItem
            icon={<Eraser size={14} />}
            label="Clear this page"
            onClick={() => handleAction(onClearFooter)}
            disabled={!hasActivePage}
            testId="clear-footer"
          />
          <MenuItem
            icon={<Trash2 size={14} />}
            label="Clear all"
            onClick={() => handleAction(onClearAllFooters)}
            testId="clear-all-footers"
          />
        </div>
      )}
    </div>
  );
};

const SectionLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
    {children}
  </div>
);

interface MenuItemProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  testId: string;
}

const MenuItem: React.FC<MenuItemProps> = ({ icon, label, onClick, disabled, testId }) => (
  <button
    type="button"
    role="menuitem"
    onMouseDown={(e) => e.preventDefault()}
    onClick={onClick}
    disabled={disabled}
    className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-gray-700 transition-colors
               hover:bg-gray-50 disabled:cursor-not-allowed disabled:text-gray-300"
    data-testid={testId}
  >
    {icon}
    {label}
  </button>
);

const MenuDivider: React.FC = () => (
  <div className="my-1 h-px bg-gray-100" />
);
