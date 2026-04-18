import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Lex4Editor, astExtension, variablesExtension, PT_BR_TRANSLATIONS } from '@yurikilian/lex4';
import type { Lex4Document, Lex4EditorHandle, VariableDefinition, Lex4Translations } from '@yurikilian/lex4';
import { Button } from '@/components/ui/button';
import { Save, Download, Globe, ChevronDown } from 'lucide-react';
import '@yurikilian/lex4/style.css';

type DeepPartial<T> = { [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P] };

const LANGUAGES: { code: string; label: string; flag: string; translations?: DeepPartial<Lex4Translations> }[] = [
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'pt-BR', label: 'Português', flag: '🇧🇷', translations: PT_BR_TRANSLATIONS },
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
      <header className="h-14 border-b border-border bg-surface-elevated/95 backdrop-blur-xl sticky top-0 z-30">
        <div className="h-full px-4 flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <div
              className="h-8 w-8 rounded-lg flex items-center justify-center text-primary-foreground font-bold text-base shadow-sm"
              style={{ background: 'var(--gradient-brand)' }}
            >
              L
            </div>
            <div className="leading-tight">
              <div className="text-sm font-semibold tracking-tight">
                Lex<span className="text-primary">4</span>
              </div>
              <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                Document Editor
              </div>
            </div>
          </div>

          <div className="ml-auto flex items-center gap-1.5">
            <button
              className="h-9 px-2.5 inline-flex items-center gap-1.5 rounded-md hover:bg-secondary text-xs text-muted-foreground transition-colors"
            >
              <Globe className="h-3.5 w-3.5" />
              <select
                value={langCode}
                onChange={(e) => setLangCode(e.target.value)}
                className="bg-transparent text-xs text-muted-foreground appearance-none cursor-pointer focus:outline-none"
                data-testid="language-selector"
              >
                {LANGUAGES.map(lang => (
                  <option key={lang.code} value={lang.code}>
                    {lang.flag} {lang.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="h-3 w-3" />
            </button>
            <Button
              variant="outline"
              size="sm"
              data-testid="btn-export-ast"
              className="h-9 gap-1.5 text-xs"
              onClick={handleExportAst}
            >
              <Download className="h-3.5 w-3.5" />
              Export AST
            </Button>
            <Button
              size="sm"
              data-testid="btn-save"
              className="h-9 gap-1.5 text-xs shadow-sm hover:shadow-md transition-shadow"
              style={{ background: 'var(--gradient-brand)' }}
              onClick={handleSave}
            >
              <Save className="h-3.5 w-3.5" />
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
