import { useEffect, useRef } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getRoot, type SerializedEditorState, type SerializedLexicalNode } from 'lexical';

interface OverflowPluginProps {
  /** Available height for this page body (px) */
  bodyHeight: number;
  /** Called with the serialized overflow content that must go to the next page */
  onOverflow: (overflowContent: SerializedEditorState) => void;
}

/**
 * OverflowPlugin — Detects content overflow inside a Lexical editor
 * and automatically extracts overflow nodes.
 *
 * This runs inside each PageBody's LexicalComposer. When the rendered
 * content exceeds the available bodyHeight, it:
 * 1. Identifies which root children overflow the boundary
 * 2. Removes them from the editor
 * 3. Serializes them and calls onOverflow() with the overflow content
 *
 * The parent component then creates/updates the next page with that content.
 */
export const OverflowPlugin: React.FC<OverflowPluginProps> = ({
  bodyHeight,
  onOverflow,
}) => {
  const [editor] = useLexicalComposerContext();
  const processingRef = useRef(false);
  const onOverflowRef = useRef(onOverflow);
  onOverflowRef.current = onOverflow;
  const bodyHeightRef = useRef(bodyHeight);
  bodyHeightRef.current = bodyHeight;

  useEffect(() => {
    const rootElement = editor.getRootElement();
    if (!rootElement) return;

    const checkOverflow = () => {
      if (processingRef.current) return;

      const root = rootElement;
      if (root.scrollHeight <= bodyHeightRef.current + 2) return; // +2 for sub-pixel

      processingRef.current = true;

      // Find the split point by measuring DOM children
      const children = Array.from(root.children) as HTMLElement[];
      if (children.length <= 1) {
        processingRef.current = false;
        return;
      }

      let cumulativeHeight = 0;
      let splitIndex = children.length;

      for (let i = 0; i < children.length; i++) {
        const child = children[i];
        const rect = child.getBoundingClientRect();
        cumulativeHeight += rect.height;

        if (cumulativeHeight > bodyHeightRef.current && i > 0) {
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

          // Get the overflow nodes' serialized form
          const overflowNodes: SerializedLexicalNode[] = [];
          const toRemove = allChildren.slice(splitIndex);

          for (const node of toRemove) {
            overflowNodes.push(node.exportJSON());
          }

          // Remove overflow nodes from this editor
          for (const node of toRemove) {
            node.remove();
          }

          // Build a serialized state for the overflow content
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

          // Notify parent (schedule after this update completes)
          setTimeout(() => {
            onOverflowRef.current(overflowState);
            processingRef.current = false;
          }, 0);
        },
        { tag: 'overflow-split' },
      );
    };

    // Watch for content changes that might cause overflow
    const observer = new ResizeObserver(() => {
      // Debounce slightly to batch rapid changes
      requestAnimationFrame(checkOverflow);
    });
    observer.observe(rootElement);

    // Also check after editor updates
    const unregister = editor.registerUpdateListener(({ tags }) => {
      // Don't re-trigger on our own overflow-split updates
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
