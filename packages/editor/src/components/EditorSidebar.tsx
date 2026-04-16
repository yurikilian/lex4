import React from 'react';
import { X } from 'lucide-react';
import { useTranslations } from '../i18n';

interface EditorSidebarProps {
  title: string;
  subtitle?: string;
  open: boolean;
  onClose?: () => void;
  headerActions?: React.ReactNode;
  testId?: string;
  children: React.ReactNode;
}

export const EditorSidebar: React.FC<EditorSidebarProps> = ({
  title,
  subtitle,
  open,
  onClose,
  headerActions,
  testId = 'editor-sidebar',
  children,
}) => {
  const t = useTranslations();

  if (!open) {
    return null;
  }

  return (
    <aside
      className="lex4-sidebar"
      data-testid={testId}
    >
      <div className="lex4-sidebar-header">
        <div>
          <h2 className="lex4-sidebar-title">{title}</h2>
          {subtitle && (
            <p className="lex4-sidebar-subtitle">{subtitle}</p>
          )}
        </div>
        <div className="lex4-sidebar-actions">
          {headerActions}
          {onClose && (
            <button
              type="button"
              className="lex4-sidebar-action-btn"
              data-testid="close-editor-sidebar"
              onClick={onClose}
              aria-label={t.sidebar.close}
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>
      <div className="lex4-sidebar-body">
        {children}
      </div>
    </aside>
  );
};
