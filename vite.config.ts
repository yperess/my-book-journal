import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// BASE_PATH lets the app be served from a sub-path, e.g. "/my-book-journal/" on GitHub Pages.
const base = process.env.BASE_PATH ?? '/';

export default defineConfig({
  base,
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'My Book Journal',
        short_name: 'Book Journal',
        description: 'Rate, review and tag the books you read. Backed by a Google Sheet in your Drive.',
        theme_color: '#6750A4',
        background_color: '#FEF7FF',
        display: 'standalone',
        start_url: base,
        scope: base,
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        // Legal pages are standalone HTML, not routes of the single-page app.
        navigateFallbackDenylist: [/\/(privacy|terms)\.html$/],
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.hostname === 'covers.openlibrary.org',
            handler: 'CacheFirst',
            options: {
              cacheName: 'openlibrary-covers',
              expiration: { maxEntries: 500, maxAgeSeconds: 60 * 60 * 24 * 90 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
  build: { chunkSizeWarningLimit: 800 },
  test: {
    environment: 'node',
  },
});
