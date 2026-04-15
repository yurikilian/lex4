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
import { useTranslations, interpolate } from '../../i18n';
import type { HistoryActionDescriptor, HistoryRegion } from '../../types/history';

interface HistoryCapturePluginProps {
  pageId: string;
  region: Exclude<HistoryRegion, 'document'>;
}

export const HistoryCapturePlugin: React.FC<HistoryCapturePluginProps> = ({ pageId, region }) => {
  const [editor] = useLexicalComposerContext();
  const { document, queueHistoryAction } = useDocument();
  const t = useTranslations();

  const context = useMemo(() => {
    const pageNumber = document.pages.findIndex(page => page.id === pageId);
    return {
      pageNumber: pageNumber >= 0 ? pageNumber + 1 : null,
      source: region,
    };
  }, [document.pages, pageId, region]);

  const createPageLabel = useMemo(() => {
    return (r: HistoryCapturePluginProps['region'], pageNumber: number | null): string => {
      if (r === 'body') {
        return pageNumber ? interpolate(t.regions.page, { page: pageNumber }) : t.regions.body;
      }
      const regionLabel = r === 'header' ? t.regions.header : t.regions.footer;
      return pageNumber
        ? `${regionLabel} ${interpolate(t.regions.page, { page: pageNumber })}`
        : regionLabel;
    };
  }, [t]);

  useEffect(() => {
    const buildDescriptor = (label: string): HistoryActionDescriptor => ({
      label: `${label} - ${createPageLabel(region, context.pageNumber)}`,
      source: context.source,
      pageId,
      region,
    });

    return editor.registerCommand(
      CONTROLLED_TEXT_INSERTION_COMMAND,
      () => {
        queueHistoryAction(buildDescriptor(t.historyLabels.typedText));
        return false;
      },
      COMMAND_PRIORITY_LOW,
    );
  }, [context.pageNumber, context.source, createPageLabel, editor, pageId, queueHistoryAction, region, t]);

  useEffect(() => {
    const buildDescriptor = (label: string): HistoryActionDescriptor => ({
      label: `${label} - ${createPageLabel(region, context.pageNumber)}`,
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

        queueHistoryAction(buildDescriptor(t.historyLabels.typedText));
        return false;
      },
      COMMAND_PRIORITY_LOW,
    );
  }, [context.pageNumber, context.source, createPageLabel, editor, pageId, queueHistoryAction, region, t]);

  useEffect(() => {
    const buildDescriptor = (label: string): HistoryActionDescriptor => ({
      label: `${label} - ${createPageLabel(region, context.pageNumber)}`,
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
        queueHistoryAction(buildDescriptor(t.historyLabels.pastedContent));
        return false;
      },
      COMMAND_PRIORITY_LOW,
    );
  }, [context.pageNumber, context.source, createPageLabel, editor, pageId, queueHistoryAction, region, t]);

  useEffect(() => {
    const buildDescriptor = (label: string): HistoryActionDescriptor => ({
      label: `${label} - ${createPageLabel(region, context.pageNumber)}`,
      source: context.source,
      pageId,
      region,
    });

    return editor.registerCommand(
      KEY_ENTER_COMMAND,
      () => {
        queueHistoryAction(buildDescriptor(t.historyLabels.insertedLineBreak));
        return false;
      },
      COMMAND_PRIORITY_LOW,
    );
  }, [context.pageNumber, context.source, createPageLabel, editor, pageId, queueHistoryAction, region, t]);

  useEffect(() => {
    const buildDescriptor = (label: string): HistoryActionDescriptor => ({
      label: `${label} - ${createPageLabel(region, context.pageNumber)}`,
      source: context.source,
      pageId,
      region,
    });

    return editor.registerCommand(
      KEY_BACKSPACE_COMMAND,
      () => {
        queueHistoryAction(buildDescriptor(t.historyLabels.deletedBackward));
        return false;
      },
      COMMAND_PRIORITY_LOW,
    );
  }, [context.pageNumber, context.source, createPageLabel, editor, pageId, queueHistoryAction, region, t]);

  useEffect(() => {
    const buildDescriptor = (label: string): HistoryActionDescriptor => ({
      label: `${label} - ${createPageLabel(region, context.pageNumber)}`,
      source: context.source,
      pageId,
      region,
    });

    return editor.registerCommand(
      KEY_DELETE_COMMAND,
      () => {
        queueHistoryAction(buildDescriptor(t.historyLabels.deletedForward));
        return false;
      },
      COMMAND_PRIORITY_LOW,
    );
  }, [context.pageNumber, context.source, createPageLabel, editor, pageId, queueHistoryAction, region, t]);

  useEffect(() => {
    const buildDescriptor = (label: string): HistoryActionDescriptor => ({
      label: `${label} - ${createPageLabel(region, context.pageNumber)}`,
      source: context.source,
      pageId,
      region,
    });

    return editor.registerCommand(
      FORMAT_TEXT_COMMAND,
      () => {
        queueHistoryAction(buildDescriptor(t.historyLabels.formattedText));
        return false;
      },
      COMMAND_PRIORITY_LOW,
    );
  }, [context.pageNumber, context.source, createPageLabel, editor, pageId, queueHistoryAction, region, t]);

  useEffect(() => {
    const buildDescriptor = (label: string): HistoryActionDescriptor => ({
      label: `${label} - ${createPageLabel(region, context.pageNumber)}`,
      source: context.source,
      pageId,
      region,
    });

    return editor.registerCommand(
      FORMAT_ELEMENT_COMMAND,
      () => {
        queueHistoryAction(buildDescriptor(t.historyLabels.formattedParagraph));
        return false;
      },
      COMMAND_PRIORITY_LOW,
    );
  }, [context.pageNumber, context.source, createPageLabel, editor, pageId, queueHistoryAction, region, t]);

  return null;
};
