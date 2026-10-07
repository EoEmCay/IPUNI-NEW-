import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { spawn } from 'child_process';

// Giờ build (giờ VN) - hiện ở cuối trang Hồ sơ để biết máy đang chạy bản nào
const BUILD_TIME = new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' });

export default defineConfig({
  define: { 'import.meta.env.VITE_BUILD_TIME': JSON.stringify(BUILD_TIME) },
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
