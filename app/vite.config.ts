import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg', 'apple-touch-icon-180x180.png'],
      manifest: {
        name: 'Vector Doc Hub',
        short_name: 'Doc Hub',
        description: 'Quotations, invoices, delivery notes and statements for Vector Technical.',
        theme_color: '#0b0c0f',
        background_color: '#0b0c0f',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // The PDF engine and fonts are large; cache them so PDFs work offline.
        maximumFileSizeToCacheInBytes: 8 * 1024 * 1024,
        globPatterns: ['**/*.{js,mjs,css,html,svg,png,ico}', 'assets/*-latin-[0-9]*.woff'],
        // Screen fonts come in many language subsets; cache only the ones the browser asks for.
        runtimeCaching: [{ urlPattern: /\.woff2$/, handler: 'CacheFirst', options: { cacheName: 'ui-fonts' } }],
      },
    }),
  ],
});
