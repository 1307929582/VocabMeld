// vite.config.content.js
import { resolve } from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  // No public assets are handled by this build config.
  publicDir: false,

  build: {
    outDir: resolve(__dirname, 'dist'),
    // Append to the dist directory, do not clean it.
    emptyOutDir: false,

    // Build as a library for IIFE output control.
    lib: {
      entry: resolve(__dirname, 'src/js/content.js'),
      name: 'VocabMeldContentScript',
      formats: ['iife'],
      fileName: () => 'js/content.js',
    },

    rollupOptions: {
      output: {
        // All assets are handled by the UI build.
      },
    },
  },
});
