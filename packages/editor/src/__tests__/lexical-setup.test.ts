import { describe, it, expect } from 'vitest';
import { createEditorConfig } from '../lexical/editor-setup';

describe('createEditorConfig', () => {
  it('creates a valid config for body mode', () => {
    const config = createEditorConfig('body', 'page-1');
    expect(config.namespace).toBe('lex4-body-page-1');
    expect(config.theme).toBeDefined();
    expect(config.nodes).toBeDefined();
    expect(config.nodes!.length).toBeGreaterThan(0);
    expect(config.onError).toBeInstanceOf(Function);
  });

  it('creates a valid config for header mode', () => {
    const config = createEditorConfig('header', 'page-1');
    expect(config.namespace).toBe('lex4-header-page-1');
  });

  it('creates a valid config for footer mode', () => {
    const config = createEditorConfig('footer');
    expect(config.namespace).toBe('lex4-footer');
  });

  it('uses fallback namespace when no pageId provided', () => {
    const config = createEditorConfig('body');
    expect(config.namespace).toBe('lex4-body');
  });
});
