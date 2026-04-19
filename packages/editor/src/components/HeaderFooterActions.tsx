import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CopyPlus, Eraser, Settings2, Trash2 } from 'lucide-react';
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
    <div ref={containerRef} style={{ position: 'relative' }} data-testid="header-footer-actions">
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => setOpen(!open)}
        className="lex4-settings-trigger lex4-settings-trigger-icon"
        data-testid="header-footer-menu-trigger"
        aria-expanded={open}
        aria-haspopup="true"
        aria-label="Header and footer settings"
        title="Header and footer settings"
      >
        <Settings2 size={14} />
      </button>

      {open && (
        <div
          className="lex4-settings-menu"
          role="menu"
          data-testid="header-footer-menu"
        >
          <SectionLabel>Page counter</SectionLabel>
          <div className="lex4-settings-counter-grid" data-testid="page-counter-mode">
            {PAGE_COUNTER_OPTIONS.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                role="menuitemradio"
                aria-checked={pageCounterMode === value}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => onPageCounterModeChange(value)}
                className="lex4-settings-counter-btn"
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
  <div className="lex4-settings-label">
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
    className="lex4-settings-item"
    data-testid={testId}
  >
    {icon}
    {label}
  </button>
);

const MenuDivider: React.FC = () => (
  <div className="lex4-settings-divider" />
);
