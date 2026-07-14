import { useEffect } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { COMMAND_PRIORITY_EDITOR } from 'lexical';
import { OptionalSegmentNode } from './optional-segment-node';
import {
  TOGGLE_OPTIONAL_SEGMENT_COMMAND,
  $toggleOptionalSegment,
} from './optional-segment-commands';
import { useTranslations } from '../i18n';

/**
 * OptionalSegmentPlugin — registers the TOGGLE_OPTIONAL_SEGMENT_COMMAND
 * handler and keeps the localized tooltip on segment DOM elements.
 */
export const OptionalSegmentPlugin: React.FC = () => {
  const [editor] = useLexicalComposerContext();
  const t = useTranslations();

  useEffect(() => {
    return editor.registerCommand(
      TOGGLE_OPTIONAL_SEGMENT_COMMAND,
      () => {
        let handled = false;
        editor.update(() => {
          handled = $toggleOptionalSegment();
        });
        return handled;
      },
      COMMAND_PRIORITY_EDITOR,
    );
  }, [editor]);

  useEffect(() => {
    return editor.registerMutationListener(
      OptionalSegmentNode,
      (mutations) => {
        editor.getEditorState().read(() => {
          for (const [key, mutation] of mutations) {
            if (mutation === 'created' || mutation === 'updated') {
              const element = editor.getElementByKey(key);
              if (element) {
                element.title = t.variables.optionalSegmentTooltip;
              }
            }
          }
        });
      },
      { skipInitialization: false },
    );
  }, [editor, t.variables.optionalSegmentTooltip]);

  return null;
};
