import { useEffect, useMemo } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  COMMAND_PRIORITY_LOW,
  CONTROLLED_TEXT_INSERTION_COMMAND,
  FORMAT_ELEMENT_COMMAND,
  FORMAT_TEXT_COMMAND,
  KEY_BACKSPACE_COMMAND,
  KEY_DELETE_COMMAND,
  KEY_DOWN_COMMAND,
  KEY_ENTER_COMMAND,
  PASTE_COMMAND,
} from 'lexical';

import { useDocument } from '../../context/document-context';
import type { HistoryActionDescriptor, HistoryRegion } from '../../types/history';

interface HistoryCapturePluginProps {
  pageId: string;
  region: Exclude<HistoryRegion, 'document'>;
}

function createPageLabel(region: HistoryCapturePluginProps['region'], pageNumber: number | null): string {
  if (region === 'body') {
    return pageNumber ? `Page ${pageNumber}` : 'Body';
  }

  const regionLabel = region.charAt(0).toUpperCase() + region.slice(1);
  return pageNumber ? `${regionLabel} Page ${pageNumber}` : regionLabel;
}

export const HistoryCapturePlugin: React.FC<HistoryCapturePluginProps> = ({ pageId, region }) => {
  const [editor] = useLexicalComposerContext();
  const { document, queueHistoryAction } = useDocument();

  const context = useMemo(() => {
    const pageNumber = document.pages.findIndex(page => page.id === pageId);
    return {
      pageNumber: pageNumber >= 0 ? pageNumber + 1 : null,
      source: region,
    };
  }, [document.pages, pageId, region]);

  useEffect(() => {
    const buildDescriptor = (prefix: string): HistoryActionDescriptor => ({
      label: `${prefix} - ${createPageLabel(region, context.pageNumber)}`,
      source: context.source,
      pageId,
      region,
    });

    return editor.registerCommand(
      CONTROLLED_TEXT_INSERTION_COMMAND,
      () => {
        queueHistoryAction(buildDescriptor('Typed text'));
        return false;
      },
      COMMAND_PRIORITY_LOW,
    );
  }, [context.pageNumber, context.source, editor, pageId, queueHistoryAction, region]);

  useEffect(() => {
    const buildDescriptor = (prefix: string): HistoryActionDescriptor => ({
      label: `${prefix} - ${createPageLabel(region, context.pageNumber)}`,
      source: context.source,
      pageId,
      region,
    });

    return editor.registerCommand(
      KEY_DOWN_COMMAND,
      (event: KeyboardEvent) => {
        if (event.metaKey || event.ctrlKey || event.altKey) {
          return false;
        }

        if (event.key.length !== 1) {
          return false;
        }

        queueHistoryAction(buildDescriptor('Typed text'));
        return false;
      },
      COMMAND_PRIORITY_LOW,
    );
  }, [context.pageNumber, context.source, editor, pageId, queueHistoryAction, region]);

  useEffect(() => {
    const buildDescriptor = (prefix: string): HistoryActionDescriptor => ({
      label: `${prefix} - ${createPageLabel(region, context.pageNumber)}`,
      source: context.source,
      pageId,
      region,
    });

    return editor.registerCommand(
      PASTE_COMMAND,
      (event: ClipboardEvent) => {
        const text = event.clipboardData?.getData('text/plain') ?? '';
        if (text.trim().length === 0) {
          return false;
        }
        queueHistoryAction(buildDescriptor('Pasted content'));
        return false;
      },
      COMMAND_PRIORITY_LOW,
    );
  }, [context.pageNumber, context.source, editor, pageId, queueHistoryAction, region]);

  useEffect(() => {
    const buildDescriptor = (prefix: string): HistoryActionDescriptor => ({
      label: `${prefix} - ${createPageLabel(region, context.pageNumber)}`,
      source: context.source,
      pageId,
      region,
    });

    return editor.registerCommand(
      KEY_ENTER_COMMAND,
      () => {
        queueHistoryAction(buildDescriptor('Inserted line break'));
        return false;
      },
      COMMAND_PRIORITY_LOW,
    );
  }, [context.pageNumber, context.source, editor, pageId, queueHistoryAction, region]);

  useEffect(() => {
    const buildDescriptor = (prefix: string): HistoryActionDescriptor => ({
      label: `${prefix} - ${createPageLabel(region, context.pageNumber)}`,
      source: context.source,
      pageId,
      region,
    });

    return editor.registerCommand(
      KEY_BACKSPACE_COMMAND,
      () => {
        queueHistoryAction(buildDescriptor('Deleted backward'));
        return false;
      },
      COMMAND_PRIORITY_LOW,
    );
  }, [context.pageNumber, context.source, editor, pageId, queueHistoryAction, region]);

  useEffect(() => {
    const buildDescriptor = (prefix: string): HistoryActionDescriptor => ({
      label: `${prefix} - ${createPageLabel(region, context.pageNumber)}`,
      source: context.source,
      pageId,
      region,
    });

    return editor.registerCommand(
      KEY_DELETE_COMMAND,
      () => {
        queueHistoryAction(buildDescriptor('Deleted forward'));
        return false;
      },
      COMMAND_PRIORITY_LOW,
    );
  }, [context.pageNumber, context.source, editor, pageId, queueHistoryAction, region]);

  useEffect(() => {
    const buildDescriptor = (prefix: string): HistoryActionDescriptor => ({
      label: `${prefix} - ${createPageLabel(region, context.pageNumber)}`,
      source: context.source,
      pageId,
      region,
    });

    return editor.registerCommand(
      FORMAT_TEXT_COMMAND,
      () => {
        queueHistoryAction(buildDescriptor('Formatted text'));
        return false;
      },
      COMMAND_PRIORITY_LOW,
    );
  }, [context.pageNumber, context.source, editor, pageId, queueHistoryAction, region]);

  useEffect(() => {
    const buildDescriptor = (prefix: string): HistoryActionDescriptor => ({
      label: `${prefix} - ${createPageLabel(region, context.pageNumber)}`,
      source: context.source,
      pageId,
      region,
    });

    return editor.registerCommand(
      FORMAT_ELEMENT_COMMAND,
      () => {
        queueHistoryAction(buildDescriptor('Formatted paragraph'));
        return false;
      },
      COMMAND_PRIORITY_LOW,
    );
  }, [context.pageNumber, context.source, editor, pageId, queueHistoryAction, region]);

  return null;
};
