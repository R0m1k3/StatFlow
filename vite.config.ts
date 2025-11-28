import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'


// https://vitejs.dev/config/
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'https://docs.google.com',
        changeOrigin: true,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        },
        rewrite: (path) => {
          // path is like /api/sheets/SHEET_ID/SHEET_NAME
          // or /api/sheets/SHEET_ID/index
          const localUrl = new URL(path, 'http://localhost');
          const pathParts = localUrl.pathname.split('/');
          // ['', 'api', 'sheets', 'SHEET_ID', 'SHEET_NAME']

          const sheetId = pathParts[3];
          const sheetName = pathParts[4] ? decodeURIComponent(pathParts[4]) : null;

          if (sheetId) {
            // Use gviz/tq endpoint for better reliability
            let dest = `/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv`;
            if (sheetName && sheetName !== 'index') {
              dest += `&sheet=${encodeURIComponent(sheetName)}`;
            }
            return dest;
          }
          return path.replace('/api', '');
        },
      },
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'pwa-192x192.png', 'pwa-512x512.png'],
      manifest: {
        filename: 'manifest.json',
        name: 'Analyseur de Ventes',
        short_name: 'Analyse Ventes',
        description: 'Visualisez les données de ventes depuis Google Sheets',
        theme_color: '#ffffff',
        background_color: '#f1f5f9',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg}'],
        runtimeCaching: [
          {
            urlPattern: /^\/api\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'google-sheets-api-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 7, // 7 jours
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },
    }),
  ],
})