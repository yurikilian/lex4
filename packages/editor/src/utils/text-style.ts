import type { BlockType } from '../lexical/commands/block-types';

const INLINE_BLOCK_STYLE_PROPERTY = '--lex4-block-type';

const INLINE_BLOCK_STYLE_PRESETS: Record<BlockType, Record<string, string>> = {
  paragraph: {
    [INLINE_BLOCK_STYLE_PROPERTY]: 'paragraph',
    'font-size': '12pt',
    'font-weight': '400',
  },
  h1: {
    [INLINE_BLOCK_STYLE_PROPERTY]: 'h1',
    'font-size': '22.5pt',
    'font-weight': '700',
  },
  h2: {
    [INLINE_BLOCK_STYLE_PROPERTY]: 'h2',
    'font-size': '18pt',
    'font-weight': '700',
  },
  h3: {
    [INLINE_BLOCK_STYLE_PROPERTY]: 'h3',
    'font-size': '15pt',
    'font-weight': '600',
  },
  h4: {
    [INLINE_BLOCK_STYLE_PROPERTY]: 'h4',
    'font-size': '13.5pt',
    'font-weight': '600',
  },
  h5: {
    [INLINE_BLOCK_STYLE_PROPERTY]: 'h5',
    'font-size': '12pt',
    'font-weight': '500',
  },
  h6: {
    [INLINE_BLOCK_STYLE_PROPERTY]: 'h6',
    'font-size': '11.25pt',
    'font-weight': '500',
  },
};

function escapeStyleProperty(property: string): string {
  const escapedProperty = property.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return escapedProperty;
}

function stripStyleDeclaration(existingStyle: string, property: string): string {
  const escapedProperty = escapeStyleProperty(property);
  return existingStyle.replace(
    new RegExp(`${escapedProperty}:\\s*[^;]+;?\\s*`, 'g'),
    '',
  ).trim();
}

function isSupportedInlineBlockType(value: string | undefined): value is BlockType {
  return value === 'paragraph'
    || value === 'h1'
    || value === 'h2'
    || value === 'h3'
    || value === 'h4'
    || value === 'h5'
    || value === 'h6';
}

export function extractStyleValue(style: string, property: string): string | undefined {
  const escapedProperty = escapeStyleProperty(property);
  const match = style.match(new RegExp(`${escapedProperty}:\\s*([^;]+)`));
  return match ? match[1].trim().replace(/['"]/g, '') : undefined;
}

export function removeStyleDeclaration(existingStyle: string, property: string): string {
  return stripStyleDeclaration(existingStyle, property);
}

export function mergeStyleDeclaration(
  existingStyle: string,
  property: string,
  value: string,
): string {
  const stripped = stripStyleDeclaration(existingStyle, property);
  const declaration = `${property}: ${value}`;
  return stripped ? `${stripped}; ${declaration}` : declaration;
}

export function mergeStyleDeclarations(
  existingStyle: string,
  declarations: Record<string, string>,
): string {
  return Object.entries(declarations).reduce(
    (style, [property, value]) => mergeStyleDeclaration(style, property, value),
    existingStyle,
  );
}

export function extractFontFamilyFromStyle(style: string): string | undefined {
  return extractStyleValue(style, 'font-family');
}

export function extractFontSizePtFromStyle(style: string): number | undefined {
  const value = extractStyleValue(style, 'font-size');
  if (!value) {
    return undefined;
  }

  const match = value.match(/^(\d+(?:\.\d+)?)\s*pt$/);
  return match ? parseFloat(match[1]) : undefined;
}

export function mergeFontFamilyStyle(existingStyle: string, fontFamily: string): string {
  return mergeStyleDeclaration(existingStyle, 'font-family', fontFamily);
}

export function mergeFontSizeStyle(existingStyle: string, size: number): string {
  return mergeStyleDeclaration(existingStyle, 'font-size', `${size}pt`);
}

export function extractInlineBlockTypeFromStyle(style: string): BlockType | undefined {
  const value = extractStyleValue(style, INLINE_BLOCK_STYLE_PROPERTY);
  return isSupportedInlineBlockType(value) ? value : undefined;
}

export function createInlineBlockTypeStylePatch(blockType: BlockType): Record<string, string> {
  return INLINE_BLOCK_STYLE_PRESETS[blockType];
}

export function mergeInlineBlockTypeStyle(existingStyle: string, blockType: BlockType): string {
  const baseStyle = [
    INLINE_BLOCK_STYLE_PROPERTY,
    'font-size',
    'font-weight',
  ].reduce((style, property) => removeStyleDeclaration(style, property), existingStyle);

  return mergeStyleDeclarations(baseStyle, createInlineBlockTypeStylePatch(blockType));
}
