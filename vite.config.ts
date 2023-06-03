/// <reference types="vitest" />
import path from 'node:path';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

import pkg from './package.json';

export default defineConfig({
  plugins: [
    dts({
      insertTypesEntry: true
    })
  ],
  build: {
    minify: false,
    lib: {
      entry: path.resolve(__dirname, 'src/index.ts'),
      name: 'index',
      fileName: 'index',
      formats: ['es', 'cjs']
    },
    sourcemap: true,
    rollupOptions: {
      // make sure to externalize deps that shouldn't be bundled
      // into your library
      external: [...Object.keys(pkg.dependencies), /^node:/],
      output: {}
    }
  },
  test: {
    globals: true,
    exclude: ['node_modules', 'dist', '.idea', '.git', '.cache', './examples'] // To exclude `./examples` we have to add the defaults as well ("node_modules", etc...)
  }
});
