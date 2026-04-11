import React from 'react';

interface HeaderFooterToggleProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
}

/**
 * HeaderFooterToggle — Global switch to enable/disable
 * headers and footers across all pages.
 */
export const HeaderFooterToggle: React.FC<HeaderFooterToggleProps> = ({
  enabled,
  onToggle,
}) => {
  return (
    <label
      className="flex items-center gap-2 cursor-pointer select-none"
      data-testid="header-footer-toggle"
    >
      <span className="text-sm font-medium text-gray-700">
        Headers & Footers
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        onClick={() => onToggle(!enabled)}
        className={`
          relative inline-flex h-5 w-9 items-center rounded-full
          transition-colors duration-200
          ${enabled ? 'bg-blue-600' : 'bg-gray-300'}
        `}
        data-testid="header-footer-switch"
      >
        <span
          className={`
            inline-block h-3.5 w-3.5 rounded-full bg-white shadow
            transition-transform duration-200
            ${enabled ? 'translate-x-4' : 'translate-x-0.5'}
          `}
        />
      </button>
    </label>
  );
};
