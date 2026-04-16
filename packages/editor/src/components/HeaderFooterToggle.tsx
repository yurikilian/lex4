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
      className="lex4-hf-toggle"
      data-testid="header-footer-toggle"
    >
      <Rows3 size={14} className="lex4-hf-toggle-icon" />
      <span className="lex4-hf-toggle-label">
        {t.headerFooter.label}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => onToggle(!enabled)}
        className="lex4-hf-switch"
        style={{ backgroundColor: enabled ? 'var(--lex4-color-primary)' : 'var(--lex4-color-text-disabled)' }}
        data-testid="header-footer-switch"
      >
        <span className="lex4-hf-switch-knob" />
      </button>
    </label>
  );
};
