// @ts-check
import { defineConfig } from 'astro/config';

import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import AstroPWA from '@vite-pwa/astro';
import pagefind from 'astro-pagefind';

import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  site: 'https://donum-dei.pages.dev',
  integrations: [
    react(),
    sitemap(),
    pagefind(),
    AstroPWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      manifest: {
        name: 'Donum Dei — Heilpflanzen-Datenbank',
        short_name: 'Donum Dei',
        description: 'Interaktive Heilpflanzen-Datenbank mit Karte, Saisonkalender und Quiz. Offline-fähig.',
        theme_color: '#047857',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/de/',
        lang: 'de',
        icons: [
          {
            src: '/favicon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,svg,jpg,jpeg,png,webp,ico,json,woff2}'],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        // Auto-Update-Verhalten: neuer SW übernimmt sofort + alte Caches weg.
        skipWaiting: true,
        clientsClaim: true,
        cleanupOutdatedCaches: true,
        // HTML wird NICHT precached — sonst sieht User alte Versionen.
        // Stattdessen via NetworkFirst zur Laufzeit, mit Fallback offline.
        navigateFallback: null,
        runtimeCaching: [
          {
            // HTML/Navigation: immer Netzwerk zuerst, Cache nur als Backup.
            urlPattern: ({ request }) => request.mode === 'navigate',
            handler: 'NetworkFirst',
            options: {
              cacheName: 'html-pages',
              networkTimeoutSeconds: 3,
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 7 }
            }
          },
          {
            urlPattern: /^https:\/\/[a-z]\.tile\.openstreetmap\.org\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'osm-tiles',
              expiration: { maxEntries: 1000, maxAgeSeconds: 60 * 60 * 24 * 30 }
            }
          }
          // Google Fonts caching entfernt — Fonts werden self-hosted via @fontsource/* (DSGVO).
        ]
      }
    })
  ],
  i18n: {
    defaultLocale: 'de',
    locales: ['de', 'en'],
    routing: {
      prefixDefaultLocale: true,
      redirectToDefaultLocale: true
    }
  },
  vite: {
    plugins: [tailwindcss()]
  }
});
