// vite.config.ui.js
import { resolve, dirname } from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  base: './',

  // This will correctly copy static assets
  publicDir: 'public',

  build: {
    outDir: resolve(__dirname, 'dist'),
    emptyOutDir: true,

    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'src/popup.html'),
        options: resolve(__dirname, 'src/options.html'),
        background: resolve(__dirname, 'src/js/background.js'),
      },
      output: {
        format: 'esm',
        entryFileNames: 'js/[name].js',
        chunkFileNames: 'js/chunks/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          // 根据资源类型分类输出
          const name = assetInfo.name || '';
          if (name.endsWith('.css')) {
            return 'assets/[name]-[hash].[ext]';
          }
          if (name.endsWith('.png') || name.endsWith('.jpg') || name.endsWith('.svg')) {
            return 'assets/[name]-[hash].[ext]';
          }
          return 'assets/[name]-[hash].[ext]';
        },
      },
    },
  },
});
