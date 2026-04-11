import { useEffect, useRef } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getRoot, type SerializedEditorState, type SerializedLexicalNode } from 'lexical';

interface OverflowPluginProps {
  /** Called with the serialized overflow content that must go to the next page */
  onOverflow: (overflowContent: SerializedEditorState) => void;
}

/**
 * OverflowPlugin — Detects content overflow inside a Lexical editor
 * and automatically extracts overflow nodes.
 *
 * Uses the actual rendered container height (from CSS flexbox) rather
 * than a prop, so it correctly handles header/footer size changes.
 *
 * Observes both the root element (content changes) and its container
 * (layout changes from header/footer resizing) to catch all overflow.
 */
export const OverflowPlugin: React.FC<OverflowPluginProps> = ({
  onOverflow,
}) => {
  const [editor] = useLexicalComposerContext();
  const processingRef = useRef(false);
  const onOverflowRef = useRef(onOverflow);
  onOverflowRef.current = onOverflow;

  useEffect(() => {
    const rootElement = editor.getRootElement();
    if (!rootElement) return;

    const container = rootElement.closest('.lex4-page-body') as HTMLElement | null;
    if (!container) return;

    const checkOverflow = () => {
      if (processingRef.current) return;

      // Use the actual rendered container height — this correctly reflects
      // the flex layout including header/footer space changes
      const availableHeight = container.clientHeight;
      if (availableHeight <= 0) return;

      if (rootElement.scrollHeight <= availableHeight + 2) return; // +2 for sub-pixel

      processingRef.current = true;

      // Find the split point by measuring DOM children
      const children = Array.from(rootElement.children) as HTMLElement[];
      if (children.length <= 1) {
        processingRef.current = false;
        return;
      }

      // Measure relative to the container top for accuracy
      const containerTop = container.getBoundingClientRect().top;
      let splitIndex = children.length;

      for (let i = 0; i < children.length; i++) {
        const child = children[i];
        const rect = child.getBoundingClientRect();
        const bottomRelative = rect.bottom - containerTop;

        if (bottomRelative > availableHeight && i > 0) {
          splitIndex = i;
          break;
        }
      }

      if (splitIndex >= children.length) {
        processingRef.current = false;
        return;
      }

      // Extract overflow nodes from the editor
      editor.update(
        () => {
          const root = $getRoot();
          const allChildren = root.getChildren();

          if (splitIndex >= allChildren.length) {
            processingRef.current = false;
            return;
          }

          const overflowNodes: SerializedLexicalNode[] = [];
          const toRemove = allChildren.slice(splitIndex);

          for (const node of toRemove) {
            overflowNodes.push(node.exportJSON());
          }

          for (const node of toRemove) {
            node.remove();
          }

          const overflowState: SerializedEditorState = {
            root: {
              children: overflowNodes,
              direction: null,
              format: '',
              indent: 0,
              type: 'root',
              version: 1,
            },
          } as SerializedEditorState;

          setTimeout(() => {
            onOverflowRef.current(overflowState);
            processingRef.current = false;
          }, 0);
        },
        { tag: 'overflow-split' },
      );
    };

    const observer = new ResizeObserver(() => {
      requestAnimationFrame(checkOverflow);
    });

    // Watch the root element for content size changes
    observer.observe(rootElement);
    // Watch the container for layout changes (header/footer resize)
    observer.observe(container);

    const unregister = editor.registerUpdateListener(({ tags }) => {
      if (tags.has('overflow-split')) return;
      requestAnimationFrame(checkOverflow);
    });

    return () => {
      observer.disconnect();
      unregister();
    };
  }, [editor]);

  return null;
};
