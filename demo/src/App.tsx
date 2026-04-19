import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Lex4Editor, astExtension, variablesExtension, PT_BR_TRANSLATIONS } from '@yurikilian/lex4';
import type { Lex4Document, Lex4EditorHandle, VariableDefinition, Lex4Translations } from '@yurikilian/lex4';
import { Button } from '@/components/ui/button';
import { Save, Download, Globe, ChevronDown } from 'lucide-react';
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

export const App: React.FC = () => {
  const editorRef = useRef<Lex4EditorHandle>(null);
  const [langCode, setLangCode] = useState('en');

  const currentLang = LANGUAGES.find(l => l.code === langCode) ?? LANGUAGES[0];

  const extensions = useMemo(() => [
    astExtension(),
    variablesExtension(DEMO_VARIABLES),
  ], []);

  const handleChange = useCallback((doc: Lex4Document) => {
    console.log(`Document changed: ${doc.pages.length} page(s)`);
  }, []);
  const searchParams = new URLSearchParams(window.location.search);
  const captureHistoryShortcutsOnWindow = searchParams.get('captureHistoryShortcutsOnWindow') !== 'false';

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
          captureHistoryShortcutsOnWindow={captureHistoryShortcutsOnWindow}
          onDocumentChange={handleChange}
          extensions={extensions}
          translations={currentLang.translations}
        />
      </main>
    </div>
  );
};
