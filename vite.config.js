import { defineConfig } from 'vite'
    import react from '@vitejs/plugin-react'
    import { VitePWA } from 'vite-plugin-pwa'

    export default defineConfig({
      plugins: [
        react(),
        VitePWA({
          registerType: 'autoUpdate',
          includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
          manifest: {
            name: 'GameZone Review',
            short_name: 'GameZone',
            description: 'Aplikasi Review Game Terkini',
            theme_color: '#ffffff',
            background_color: '#ffffff',
            display: 'standalone',
            scope: '/',
            start_url: '/',
            orientation: 'portrait',
            icons: [
              {
                src: 'pwa-192x192.png', // Kita akan siapkan gambar ini di Fase 5
                sizes: '192x192',
                type: 'image/png'
              },
              {
                src: 'pwa-512x512.png', // Kita akan siapkan gambar ini di Fase 5
                sizes: '512x512',
                type: 'image/png'
              }
            ]
          }
        })
      ],
    })