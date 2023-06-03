/// <reference types="vitest" />
// import path from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

// import pkg from './package.json';

export default defineConfig({
  plugins: [
    dts({
      insertTypesEntry: true
    }),
    react()
  ],
  test: {
    dir: './examples',
    globals: true,
    environment: 'jsdom',
    setupFiles: './examples/setup.js'
  },
  // Fix for using JSX in vitest: https://github.com/vitest-dev/vitest/issues/2727#issuecomment-1552887702
  esbuild: {
    loader: 'jsx',
    include: /(src)\/.*\.jsx?$/,
    exclude: []
  },
  optimizeDeps: {
    esbuildOptions: {
      loader: { '.js': 'jsx' },
      plugins: [
        {
          name: 'load-js-files-as-jsx',
          setup(build) {
            build.onLoad({ filter: /(src)\/.*\.js$/ }, async (args) => ({
              loader: 'jsx',
              contents: await fs.readFile(args.path, 'utf8')
            }));
          }
        }
      ]
    }
  }
});
