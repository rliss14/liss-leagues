import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/icon-192.png', 'icons/icon-512.png'],
      manifest: {
        name: 'Liss Leagues',
        short_name: 'Liss Leagues',
        description: 'Clubhouse scoreboard for the Liss Leagues betting pools',
        theme_color: '#1b3d2f',
        background_color: '#1b3d2f',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      },
      workbox: {
        // Don't cache ESPN/Supabase API calls aggressively — always try network first
        // so scores stay live; fall back to cache offline.
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/site\.api\.espn\.com\//,
            handler: 'NetworkFirst',
            options: { cacheName: 'espn-api', networkTimeoutSeconds: 5 }
          },
          {
            urlPattern: /supabase\.co\/.*$/,
            handler: 'NetworkFirst',
            options: { cacheName: 'supabase-api', networkTimeoutSeconds: 5 }
          }
        ]
      }
    })
  ]
})
