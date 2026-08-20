// @ts-check
import { readFileSync, readdirSync } from 'node:fs';
import { defineConfig } from 'astro/config';

import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import AstroPWA from '@vite-pwa/astro';
import pagefind from 'astro-pagefind';

import tailwindcss from '@tailwindcss/vite';

// === Rechtlich kontrollierte Arten (Cannabis, Koka, Peyote …) ===
// Deren Detailseiten stehen seit 2026-08-10 auf noindex (Entscheidung fuer den
// AdSense-Neuantrag). Eine Seite gleichzeitig zu sperren und in die Sitemap zu
// schreiben waeren widerspruechliche Signale — deshalb hier ebenfalls raus.
// Zum Rueckgaengigmachen: diesen Block und die noindex-Flags in
// src/pages/{de,en}/plant/[slug].astro sowie den Themenseiten entfernen.
const controlledSlugs = new Set(
  readdirSync(new URL('./src/data/plants/', import.meta.url))
    .filter(f => f.endsWith('.json'))
    .flatMap(f => {
      try {
        const d = JSON.parse(readFileSync(new URL(`./src/data/plants/${f}`, import.meta.url), 'utf-8'));
        return d?.legal_status?.controlled === true ? [d.slug] : [];
      } catch {
        return [];
      }
    }),
);

// https://astro.build/config
export default defineConfig({
  site: 'https://donum-dei.pages.dev',
  integrations: [
    react(),
    // Sitemap: nur Seiten, die Google auch indexieren SOLL.
    // Draussen bleiben:
    //  - die Wurzel-URL (leitet per 301 auf /de/ um; Weiterleitungen gehoeren
    //    nie in eine Sitemap und erzeugen "Duplikat"-Meldungen in der GSC)
    //  - die Sprach-Shells /fr/ /es/ /bg/ (stehen im Layout auf noindex —
    //    eine Seite gleichzeitig anzubieten und zu sperren ist widerspruechlich)
    sitemap({
      filter: (page) => {
        const path = new URL(page).pathname;
        if (path === '/') return false;
        if (/^\/(fr|es|bg)\/$/.test(path)) return false;
        // Themenseiten der kontrollierten Arten
        if (path === '/de/rauschpflanzen/' || path === '/en/psychoactive/') return false;
        // Seiten ohne eigenen Inhalt: die Suche und der Formular-Schritt des
        // Garten-Planers. Sie stehen auf noindex — eine Seite gleichzeitig zu
        // sperren und in die Sitemap zu schreiben waeren widerspruechliche
        // Signale. (Ergaenzt 2026-08-10 nach der zweiten AdSense-Ablehnung.)
        if (/^\/(de\/suche|en\/search|de\/mein-garten\/start|en\/my-garden\/start)\/$/.test(path)) return false;
        // Deren Detailseiten
        const m = path.match(/^\/(de|en)\/plant\/([^/]+)\/$/);
        if (m && controlledSlugs.has(m[2])) return false;
        return true;
      },
    }),
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
