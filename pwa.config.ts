import type { ManifestOptions, VitePWAOptions } from 'vite-plugin-pwa'

export const THEME_COLOR = '#0f766e'
export const BACKGROUND_COLOR = '#f0fdfa'

export const manifest: Partial<ManifestOptions> = {
  id: '/',
  name: 'cebete',
  short_name: 'cebete',
  description: 'A private CBT tracker that keeps your data on your device and works offline.',
  lang: 'en',
  start_url: '/',
  scope: '/',
  display: 'standalone',
  background_color: BACKGROUND_COLOR,
  theme_color: THEME_COLOR,
  icons: [
    { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
    { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
    {
      src: 'icons/icon-maskable-512.png',
      sizes: '512x512',
      type: 'image/png',
      purpose: 'maskable',
    },
  ],
}

export const pwaOptions: Partial<VitePWAOptions> = {
  // New versions install in the background and take over on the next visit.
  registerType: 'autoUpdate',
  // The glob below already caches every icon, so skip the plugin's duplicate entries.
  includeManifestIcons: false,
  manifest,
  workbox: {
    // Cache the whole app shell, including icons, so it opens with no network.
    globPatterns: ['**/*.{js,css,html,svg,png}'],
    cleanupOutdatedCaches: true,
  },
}
