import React from 'react';
import { X } from 'lucide-react';

interface EditorSidebarProps {
  title: string;
  subtitle?: string;
  open: boolean;
  onClose?: () => void;
  headerActions?: React.ReactNode;
  children: React.ReactNode;
}

export const EditorSidebar: React.FC<EditorSidebarProps> = ({
  title,
  subtitle,
  open,
  onClose,
  headerActions,
  children,
}) => {
  if (!open) {
    return null;
  }

  return (
    <aside
      className="flex h-full w-[320px] shrink-0 flex-col border-l border-gray-200 bg-white"
      data-testid="editor-sidebar"
    >
      <div className="flex items-start justify-between border-b border-gray-200 px-3 py-2.5">
        <div>
          <h2 className="text-xs font-semibold text-gray-900">{title}</h2>
          {subtitle && (
            <p className="mt-0.5 text-xs text-gray-500">{subtitle}</p>
          )}
        </div>
        <div className="flex items-center gap-1">
          {headerActions}
          {onClose && (
            <button
              type="button"
              className="flex h-6 w-6 items-center justify-center rounded text-gray-400
                         transition-colors hover:bg-gray-100 hover:text-gray-600"
              data-testid="close-editor-sidebar"
              onClick={onClose}
              aria-label="Close sidebar"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-auto">
        {children}
      </div>
    </aside>
  );
};
