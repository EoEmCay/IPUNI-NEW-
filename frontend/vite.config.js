import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { spawn } from 'child_process';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/icon-192.png', 'icons/icon-512.png'],
      manifest: {
        name: 'DIA+ - Theo dõi tiểu đường',
        short_name: 'DIA+',
        description: 'Ứng dụng theo dõi sức khỏe dành cho bệnh nhân tiểu đường',
        theme_color: '#1B5FA6',
        background_color: '#F4F6F9',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' }
        ]
      }
    }),
    {
      name: 'open-browser',
      configResolved() {
        if (process.env.NODE_ENV === 'development') {
          setTimeout(() => {
            const url = 'http://localhost:5173';
            const platform = process.platform;
            if (platform === 'darwin') {
              spawn('open', [url], { stdio: 'ignore', detached: true });
            } else if (platform === 'win32') {
              spawn('cmd.exe', ['/c', 'start chrome ' + url + ' --incognito'], { stdio: 'ignore', detached: true });
            } else {
              spawn('xdg-open', [url], { stdio: 'ignore', detached: true });
            }
          }, 1500);
        }
      }
    }
  ],
  server: {
    port: 5173,
    open: false
  }
});
