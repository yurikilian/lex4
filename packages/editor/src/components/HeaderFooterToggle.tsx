import React from 'react';
import { Rows3 } from 'lucide-react';
import { useTranslations } from '../i18n';

interface HeaderFooterToggleProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
}

export const HeaderFooterToggle: React.FC<HeaderFooterToggleProps> = ({
  enabled,
  onToggle,
}) => {
  const t = useTranslations();

  return (
    <label
      className="flex items-center gap-1.5 cursor-pointer select-none"
      data-testid="header-footer-toggle"
    >
      <Rows3 size={14} className="text-gray-500" />
      <span className="text-xs font-medium text-gray-600">
        {t.headerFooter.label}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => onToggle(!enabled)}
        className={`
          relative inline-flex h-4 w-7 items-center rounded-full
          transition-colors duration-200
          ${enabled ? 'bg-blue-500' : 'bg-gray-300'}
        `}
        data-testid="header-footer-switch"
      >
        <span
          className={`
            inline-block h-3 w-3 rounded-full bg-white shadow-sm
            transition-transform duration-200
            ${enabled ? 'translate-x-3.5' : 'translate-x-0.5'}
          `}
        />
      </button>
    </label>
  );
};
