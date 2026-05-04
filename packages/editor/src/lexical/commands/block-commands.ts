import { $setBlocksType } from '@lexical/selection';
import {
  $createParagraphNode,
  $getSelection,
  $isRangeSelection,
  type LexicalEditor,
} from 'lexical';
import {
  $createHeadingNode,
  $isHeadingNode,
} from '@lexical/rich-text';

export type BlockType = 'paragraph' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';

export function setBlockType(editor: LexicalEditor, blockType: BlockType): void {
  editor.update(() => {
    const selection = $getSelection();
    if (!$isRangeSelection(selection)) {
      return;
    }

    if (blockType === 'paragraph') {
      $setBlocksType(selection, () => $createParagraphNode());
      return;
    }

    $setBlocksType(selection, () => $createHeadingNode(blockType));
  });
}

export function getActiveBlockType(editor: LexicalEditor): BlockType {
  let blockType: BlockType = 'paragraph';

  editor.getEditorState().read(() => {
    const selection = $getSelection();
    if (!$isRangeSelection(selection)) {
      return;
    }

    const anchorNode = selection.anchor.getNode();
    const topLevelElement = anchorNode.getTopLevelElementOrThrow();
    if ($isHeadingNode(topLevelElement)) {
      blockType = topLevelElement.getTag();
    }
  });

  return blockType;
}
