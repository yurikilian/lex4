import { useEffect, useRef } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $getRoot,
  $isElementNode,
  type LexicalNode,
  type SerializedEditorState,
  type SerializedLexicalNode,
} from 'lexical';
import { debug, debugWarn } from '../../utils/debug';
import { performMidBlockSplit } from '../utils/mid-block-split';

/**
 * Recursively serializes a Lexical node and all its children.
 * ElementNode.exportJSON() returns children: [] by default —
 * the recursive walk must be done manually.
 */
function serializeNodeTree(node: LexicalNode): SerializedLexicalNode {
  const json = node.exportJSON();
  if ($isElementNode(node)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (json as any).children = node.getChildren().map(serializeNodeTree);
  }
  return json;
}

interface OverflowPluginProps {
  /** Called with the serialized overflow content that must go to the next page */
  onOverflow: (
    overflowContent: SerializedEditorState,
    cause: 'paste' | 'content',
  ) => void;
}

/** Debounce delay for typing-triggered overflow checks (ms) */
const OVERFLOW_DEBOUNCE_MS = 300;

/**
 * OverflowPlugin — Detects content overflow inside a Lexical editor
 * and automatically extracts overflow nodes.
 *
 * Uses registerRootListener to reliably get the root element (handles
 * the case where the root is not yet available on first render).
 *
 * Measures child element positions via getBoundingClientRect() relative
 * to the container, which works regardless of CSS overflow settings.
 *
 * Debounces overflow checks during normal typing (300ms) to avoid
 * extracting only the empty trailing paragraph. Paste and external
 * state changes (e.g. setEditorState) trigger immediate checks.
 */
export const OverflowPlugin: React.FC<OverflowPluginProps> = ({
  onOverflow,
}) => {
  const [editor] = useLexicalComposerContext();
  const processingRef = useRef(false);
  const onOverflowRef = useRef(onOverflow);
  onOverflowRef.current = onOverflow;

  useEffect(() => {
    let observer: ResizeObserver | null = null;
    let unregisterUpdateListener: (() => void) | null = null;
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;

    const checkOverflow = (
      rootElement: HTMLElement,
      container: HTMLElement,
      cause: 'paste' | 'content',
    ) => {
      if (processingRef.current) return;

      const availableHeight = container.clientHeight;
      if (availableHeight <= 0) return;

      // Use scrollHeight for reliable overflow detection — unaffected by
      // scroll position (getBoundingClientRect is affected when the browser
      // scrolls overflow:hidden containers to follow the cursor after paste).
      const contentHeight = rootElement.scrollHeight;

      // No overflow if all content fits (+2px tolerance for sub-pixel rounding)
      if (contentHeight <= availableHeight + 2) return;

      const children = Array.from(rootElement.children) as HTMLElement[];
      if (children.length === 0) return;

      if (children.length <= 1) {
        debug('overflow', `single block overflows (content=${contentHeight}px > available=${availableHeight}px) — attempting mid-block split`);

        processingRef.current = true;

        editor.update(
          () => {
            const overflowNodes = performMidBlockSplit(rootElement, availableHeight, 0);
            if (!overflowNodes || overflowNodes.length === 0) {
              debug('overflow', 'mid-block split not possible for single block');
              processingRef.current = false;
              return;
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

            debug('overflow', `mid-block split extracted ${overflowNodes.length} overflow nodes from single block`);

            setTimeout(() => {
              onOverflowRef.current(overflowState, cause);
              processingRef.current = false;
            }, 0);
          },
          { tag: 'overflow-split' },
        );
        return;
      }

      processingRef.current = true;

      debug('overflow', `OVERFLOW detected: content=${contentHeight}px available=${availableHeight}px children=${children.length}`);

      // Find the first child whose bottom exceeds the available height.
      // Uses offsetTop (relative to offsetParent, unaffected by scroll)
      // instead of getBoundingClientRect (which shifts with scroll).
      let splitIndex = children.length;
      let firstBlockOverflows = false;
      for (let i = 0; i < children.length; i++) {
        const child = children[i];
        const childBottom = child.offsetTop + child.offsetHeight;

        if (childBottom > availableHeight) {
          if (i === 0) {
            // First block itself overflows — attempt mid-block split on it,
            // then fall through to extract remaining blocks after it
            firstBlockOverflows = true;
            splitIndex = 1; // everything after block 0 overflows
          } else {
            splitIndex = i;
          }
          debug('overflow', `split at index ${i === 0 ? '0 (mid-block)' : i} (childBottom=${childBottom}px > ${availableHeight}px)`);
          break;
        }
      }

      if (splitIndex >= children.length) {
        debugWarn('overflow', 'no valid split point found — all children fit individually');
        processingRef.current = false;
        return;
      }

      editor.update(
        () => {
          const root = $getRoot();
          const allChildren = root.getChildren();

          if (splitIndex >= allChildren.length) {
            debugWarn('overflow', `splitIndex=${splitIndex} >= Lexical children=${allChildren.length} — mismatch`);
            processingRef.current = false;
            return;
          }

          let overflowNodes: SerializedLexicalNode[] = [];

          // If the first block itself overflows, try mid-block split on it
          if (firstBlockOverflows) {
            const midBlockOverflow = performMidBlockSplit(rootElement, availableHeight, 0);
            if (midBlockOverflow && midBlockOverflow.length > 0) {
              overflowNodes.push(...midBlockOverflow);
              debug('overflow', `mid-block split on first block extracted ${midBlockOverflow.length} nodes`);
            } else {
              debug('overflow', 'mid-block split failed on first block — keeping it whole');
            }

            // Serialize and remove remaining blocks after the first
            const freshChildren = root.getChildren();
            const toRemove = freshChildren.slice(1);
            for (const node of toRemove) {
              overflowNodes.push(serializeNodeTree(node));
            }
            for (const node of toRemove) {
              node.remove();
            }
          } else {
            const toRemove = allChildren.slice(splitIndex);
            for (const node of toRemove) {
              overflowNodes.push(serializeNodeTree(node));
            }
            for (const node of toRemove) {
              node.remove();
            }
          }

          if (overflowNodes.length === 0) {
            processingRef.current = false;
            return;
          }

          debug('overflow', `extracted ${overflowNodes.length} overflow nodes total`);

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
            onOverflowRef.current(overflowState, cause);
            processingRef.current = false;
          }, 0);
        },
        { tag: 'overflow-split' },
      );
    };

    const setupObservers = (rootElement: HTMLElement) => {
      // Clean up any previous observers
      if (observer) observer.disconnect();
      if (unregisterUpdateListener) unregisterUpdateListener();
      if (debounceTimer) clearTimeout(debounceTimer);

      const container = rootElement.closest('.lex4-page-body') as HTMLElement | null;
      if (!container) {
        debugWarn('overflow', 'no .lex4-page-body container found');
        return;
      }

      debug('overflow', `observers attached (ns=${editor.getKey()})`);

      const immediateCheck = () => {
        requestAnimationFrame(() => checkOverflow(rootElement, container, 'content'));
      };

      const pasteCheck = () => {
        requestAnimationFrame(() => checkOverflow(rootElement, container, 'paste'));
      };

      const debouncedCheck = () => {
        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(immediateCheck, OVERFLOW_DEBOUNCE_MS);
      };

      // ResizeObserver fires on actual layout changes — debounce to
      // avoid constant checks during typing
      observer = new ResizeObserver(debouncedCheck);
      observer.observe(rootElement);
      observer.observe(container);

      unregisterUpdateListener = editor.registerUpdateListener(({ tags }) => {
        if (tags.has('overflow-split')) return;

        // Paste and external state changes trigger immediate overflow check.
        // Normal typing is debounced to avoid extracting only the cursor paragraph.
        if (tags.has('paste')) {
          debug('overflow', `paste check (tags=${Array.from(tags).join(',')})`);
          pasteCheck();
        } else if (tags.has('collaboration') || tags.has('historic')) {
          debug('overflow', `immediate check (tags=${Array.from(tags).join(',')})`);
          immediateCheck();
        } else {
          debouncedCheck();
        }
      });

      // Initial check after setup (immediate — handles mount with initial content)
      immediateCheck();
    };

    // registerRootListener fires immediately with current root (if any)
    // and again whenever the root element changes — handles the case
    // where getRootElement() returns null on first render
    const unregisterRootListener = editor.registerRootListener(
      (rootElement: HTMLElement | null) => {
        if (rootElement) {
          debug('overflow', `rootListener: root available (ns=${editor.getKey()})`);
          setupObservers(rootElement);
        } else {
          debug('overflow', `rootListener: root detached (ns=${editor.getKey()})`);
          if (observer) observer.disconnect();
          if (unregisterUpdateListener) unregisterUpdateListener();
          if (debounceTimer) clearTimeout(debounceTimer);
          observer = null;
          unregisterUpdateListener = null;
          debounceTimer = null;
        }
      },
    );

    return () => {
      unregisterRootListener();
      if (observer) observer.disconnect();
      if (unregisterUpdateListener) unregisterUpdateListener();
      if (debounceTimer) clearTimeout(debounceTimer);
    };
  }, [editor]);

  return null;
};
