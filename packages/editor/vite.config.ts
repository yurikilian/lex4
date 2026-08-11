import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import dts from 'vite-plugin-dts';
import { resolve } from 'path';

const rootDir = import.meta.dirname;

export default defineConfig({
  plugins: [
    react(),
    dts({
      insertTypesEntry: true,
      include: ['src'],
      exclude: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    }),
  ],
  build: {
    lib: {
      entry: resolve(rootDir, 'src/index.ts'),
      name: 'Lex4Editor',
      formats: ['es', 'cjs'],
      fileName: 'lex4-editor',
      // Vite >= 6 derives the lib CSS file name from `fileName`; the published
      // `./style.css` export must keep its name.
      cssFileName: 'style',
    },
    rollupOptions: {
      external: [
        'react',
        'react-dom',
        'react/jsx-runtime',
        'lexical',
        /^@lexical\/.*/,
      ],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
        },
      },
    },
    sourcemap: true,
    minify: false,
  },
  resolve: {
    alias: {
      '@': resolve(rootDir, 'src'),
    },
  },
});
