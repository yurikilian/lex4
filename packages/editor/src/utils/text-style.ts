export function extractStyleValue(style: string, property: string): string | undefined {
  const escapedProperty = property.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = style.match(new RegExp(`${escapedProperty}:\\s*([^;]+)`));
  return match ? match[1].trim().replace(/['"]/g, '') : undefined;
}

export function mergeStyleDeclaration(
  existingStyle: string,
  property: string,
  value: string,
): string {
  const escapedProperty = property.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const stripped = existingStyle.replace(
    new RegExp(`${escapedProperty}:\\s*[^;]+;?\\s*`, 'g'),
    '',
  ).trim();
  const declaration = `${property}: ${value}`;
  return stripped ? `${stripped}; ${declaration}` : declaration;
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
