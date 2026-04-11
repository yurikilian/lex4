import React from 'react';

interface EditorSidebarProps {
  title: string;
  subtitle?: string;
  open: boolean;
  onClose?: () => void;
  children: React.ReactNode;
}

export const EditorSidebar: React.FC<EditorSidebarProps> = ({
  title,
  subtitle,
  open,
  onClose,
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
      <div className="flex items-start justify-between border-b border-gray-200 px-4 py-3">
        <div>
          <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
          {subtitle && (
            <p className="mt-1 text-xs text-gray-500">{subtitle}</p>
          )}
        </div>
        {onClose && (
          <button
            type="button"
            className="rounded border border-gray-300 px-2 py-1 text-xs text-gray-600 transition-colors hover:bg-gray-100"
            data-testid="close-editor-sidebar"
            onClick={onClose}
          >
            Close
          </button>
        )}
      </div>
      <div className="min-h-0 flex-1 overflow-auto">
        {children}
      </div>
    </aside>
  );
};
