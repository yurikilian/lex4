import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Lex4Editor, astExtension, variablesExtension, PT_BR_TRANSLATIONS } from '@yurikilian/lex4';
import type { Lex4Document, Lex4EditorHandle, VariableDefinition, Lex4Translations } from '@yurikilian/lex4';
import { Button } from '@/components/ui/button';
import type { SerializedEditorState } from 'lexical';
import { Save, Download, Globe, ChevronDown, ListOrdered } from 'lucide-react';
import '@yurikilian/lex4/style.css';

type DeepPartial<T> = { [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P] };

const LANGUAGES: { code: string; label: string; shortLabel: string; translations?: DeepPartial<Lex4Translations> }[] = [
  { code: 'en', label: 'English', shortLabel: 'EN' },
  { code: 'pt-BR', label: 'Português', shortLabel: 'PT', translations: PT_BR_TRANSLATIONS },
];

const DEMO_VARIABLES: VariableDefinition[] = [
  { key: 'customer.name', label: 'Customer Name', description: 'Full name', valueType: 'string', group: 'Customer' },
  { key: 'customer.email', label: 'Customer Email', valueType: 'string', group: 'Customer' },
  { key: 'customer.document', label: 'Customer Doc', valueType: 'string', group: 'Customer' },
  { key: 'proposal.date', label: 'Proposal Date', valueType: 'date', group: 'Proposal' },
  { key: 'proposal.validUntil', label: 'Valid Until', valueType: 'date', group: 'Proposal' },
  { key: 'seller.name', label: 'Seller Name', valueType: 'string', group: 'Seller' },
  { key: 'company.address.city', label: 'City', valueType: 'string', group: 'Company' },
];

function makeEditorState(children: object[]): SerializedEditorState {
  return {
    root: {
      type: 'root',
      version: 1,
      children,
      direction: null,
      format: '',
      indent: 0,
    },
  } as SerializedEditorState;
}

const ALPHA_LIST_SAMPLE_DOCUMENT: Lex4Document = {
  pages: [
    {
      id: 'alpha-list-sample-page',
      bodyState: makeEditorState([
        {
          type: 'heading',
          tag: 'h2',
          format: '',
          indent: 0,
          version: 1,
          direction: null,
          children: [{ type: 'text', text: 'Alphabetic outline sample', format: 0, style: '', version: 1, detail: 0, mode: 'normal' }],
        },
        {
          type: 'paragraph',
          format: '',
          indent: 0,
          version: 1,
          direction: null,
          children: [
            {
              type: 'text',
              text: 'Demo preset for alphabetic lists, AST export, and i18n toolbar labels.',
              format: 0,
              style: '',
              version: 1,
              detail: 0,
              mode: 'normal',
            },
          ],
        },
        {
          type: 'alpha-list',
          listType: 'number',
          tag: 'ol',
          start: 1,
          version: 1,
          format: '',
          indent: 0,
          direction: null,
          markerStyle: 'alpha',
          children: [
            {
              type: 'listitem',
              value: 1,
              format: 0,
              indent: 0,
              direction: null,
              version: 1,
              children: [{ type: 'text', text: 'Gather contract requirements', format: 0, style: '', version: 1, detail: 0, mode: 'normal' }],
            },
            {
              type: 'listitem',
              value: 2,
              format: 0,
              indent: 0,
              direction: null,
              version: 1,
              children: [{ type: 'text', text: 'Draft rollout checklist', format: 0, style: '', version: 1, detail: 0, mode: 'normal' }],
            },
            {
              type: 'listitem',
              value: 3,
              format: 0,
              indent: 0,
              direction: null,
              version: 1,
              children: [{ type: 'text', text: 'Review approval timeline', format: 0, style: '', version: 1, detail: 0, mode: 'normal' }],
            },
          ],
        },
      ]),
      headerState: null,
      footerState: null,
      headerHeight: 0,
      footerHeight: 0,
      bodySyncVersion: 0,
      headerSyncVersion: 0,
      footerSyncVersion: 0,
    },
  ],
  headerFooterEnabled: false,
  pageCounterMode: 'none',
  defaultHeaderState: null,
  defaultFooterState: null,
  defaultHeaderHeight: 0,
  defaultFooterHeight: 0,
};

export const App: React.FC = () => {
  const editorRef = useRef<Lex4EditorHandle>(null);
  const [langCode, setLangCode] = useState('en');

  const currentLang = LANGUAGES.find(l => l.code === langCode) ?? LANGUAGES[0];
  const searchParams = new URLSearchParams(window.location.search);
  const captureHistoryShortcutsOnWindow = searchParams.get('captureHistoryShortcutsOnWindow') !== 'false';
  const hasAlphaSamplePreset = searchParams.get('sample') === 'alpha-list';

  const extensions = useMemo(() => [
    astExtension(),
    variablesExtension(DEMO_VARIABLES),
  ], []);

  const handleChange = useCallback((doc: Lex4Document) => {
    console.log(`Document changed: ${doc.pages.length} page(s)`);
  }, []);

  const handleExportAst = useCallback(() => {
    if (editorRef.current) {
      const ast = editorRef.current.getDocumentAst();
      // Expose on window for E2E test access
      (window as unknown as Record<string, unknown>).__lex4_last_ast = ast;
      console.log('Exported AST:', JSON.stringify(ast, null, 2));
    }
  }, []);

  const handleSave = useCallback(() => {
    if (editorRef.current) {
      const ast = editorRef.current.getDocumentAst();
      (window as unknown as Record<string, unknown>).__lex4_last_ast = ast;
      console.log('[Lex4 Save] Document AST:', ast);
      console.log('[Lex4 Save] JSON payload:', editorRef.current.getDocumentJson());
    }
  }, []);

  const handleToggleAlphaSample = useCallback(() => {
    const nextParams = new URLSearchParams(window.location.search);
    if (hasAlphaSamplePreset) {
      nextParams.delete('sample');
    } else {
      nextParams.set('sample', 'alpha-list');
    }
    window.location.search = nextParams.toString();
  }, [hasAlphaSamplePreset]);

  useEffect(() => {
    (window as unknown as Record<string, unknown>).__lex4_editor = editorRef;

    return () => {
      delete (window as unknown as Record<string, unknown>).__lex4_editor;
    };
  }, []);

  return (
    <div className="h-screen flex flex-col bg-background">
      <header className="h-12 border-b border-border bg-surface-elevated/95 backdrop-blur-xl sticky top-0 z-30">
        <div className="h-full px-4 flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div
              className="h-7 w-7 rounded-lg flex items-center justify-center text-primary-foreground font-bold text-sm shadow-sm"
              style={{ background: 'var(--gradient-brand)' }}
            >
              L
            </div>
            <div className="leading-tight">
              <div className="text-[13px] font-semibold tracking-tight">
                Lex<span className="text-primary">4</span>
              </div>
              <div className="text-[9px] text-muted-foreground font-medium uppercase tracking-wider">
                Document Editor
              </div>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-1 ml-4 text-[10px] text-muted-foreground">
            <span className="font-medium text-foreground">Untitled proposal</span>
            <span className="opacity-40">·</span>
            <span>Auto-saved 2s ago</span>
            <span className="opacity-40">·</span>
            <span>{hasAlphaSamplePreset ? 'Alpha sample loaded' : 'Try alpha list preset'}</span>
          </div>

          <div className="ml-auto flex items-center gap-1">
            <button
              className="h-7 px-2 inline-flex items-center gap-1 rounded-md hover:bg-secondary text-[10px] text-muted-foreground transition-colors"
              title={currentLang.label}
            >
              <Globe className="h-2.5 w-2.5" />
              <select
                value={langCode}
                onChange={(e) => setLangCode(e.target.value)}
                className="w-[1.8rem] bg-transparent text-[10px] font-medium text-muted-foreground appearance-none cursor-pointer focus:outline-none"
                data-testid="language-selector"
                aria-label="Language"
              >
                {LANGUAGES.map(lang => (
                  <option key={lang.code} value={lang.code}>
                    {lang.shortLabel}
                  </option>
                ))}
              </select>
              <ChevronDown className="h-2.5 w-2.5" />
            </button>
            <Button
              variant="outline"
              size="sm"
              data-testid="btn-toggle-alpha-sample"
              className="h-7 gap-1 px-2 text-[10px]"
              onClick={handleToggleAlphaSample}
            >
              <ListOrdered className="h-2.5 w-2.5" />
              {hasAlphaSamplePreset ? 'Reset Demo' : 'Alpha Sample'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              data-testid="btn-export-ast"
              className="h-7 gap-1 px-2 text-[10px]"
              onClick={handleExportAst}
            >
              <Download className="h-2.5 w-2.5" />
              Export AST
            </Button>
            <Button
              size="sm"
              data-testid="btn-save"
              className="h-7 gap-1 px-2 text-[10px] shadow-sm hover:shadow-md transition-shadow"
              style={{ background: 'var(--gradient-brand)' }}
              onClick={handleSave}
            >
              <Save className="h-2.5 w-2.5" />
              Save
            </Button>
          </div>
        </div>
      </header>
      <main className="flex-1 overflow-hidden">
        <Lex4Editor
          ref={editorRef}
          initialDocument={hasAlphaSamplePreset ? ALPHA_LIST_SAMPLE_DOCUMENT : undefined}
          captureHistoryShortcutsOnWindow={captureHistoryShortcutsOnWindow}
          onDocumentChange={handleChange}
          extensions={extensions}
          translations={currentLang.translations}
        />
      </main>
    </div>
  );
};
