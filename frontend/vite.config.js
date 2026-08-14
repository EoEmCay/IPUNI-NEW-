import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { spawn } from 'child_process';

export default defineConfig({
  plugins: [
    react(),
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
