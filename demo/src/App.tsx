import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Lex4Editor, astExtension, variablesExtension, PT_BR_TRANSLATIONS } from '@yurikilian/lex4';
import type { Lex4Document, Lex4EditorHandle, VariableDefinition, Lex4Translations } from '@yurikilian/lex4';

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
    <div className="h-screen flex flex-col bg-gray-300">
      <header className="bg-gray-800 text-white px-4 py-2 flex items-center gap-2">
        <span className="font-bold text-lg">Lex4</span>
        <span className="text-gray-400 text-sm">— Document Editor</span>
        <button
          type="button"
          data-testid="btn-save"
          className="ml-auto rounded bg-green-600 px-3 py-1 text-sm text-white hover:bg-green-700"
          onClick={handleSave}
        >
          💾 Save
        </button>
        <button
          type="button"
          data-testid="btn-export-ast"
          className="rounded bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700"
          onClick={handleExportAst}
        >
          Export AST
        </button>
        <select
          value={langCode}
          onChange={(e) => setLangCode(e.target.value)}
          className="rounded bg-gray-700 px-2 py-1 text-sm text-white border border-gray-600
                     hover:bg-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-400"
          data-testid="language-selector"
        >
          {LANGUAGES.map(lang => (
            <option key={lang.code} value={lang.code}>
              {lang.flag} {lang.label}
            </option>
          ))}
        </select>
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
