import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: {
      // react-hooks v7 nâng rule này lên 'error' theo hướng chuẩn bị cho React Compiler,
      // nhưng nó coi MỌI hàm gọi từ trong effect mà (trực tiếp/gián tiếp) có setState là vi
      // phạm - kể cả pattern fetch-on-mount hợp lệ và được chính docs của React liệt kê là
      // 1 trong số ít lý do chính đáng để dùng effect (ví dụ ScanHistoryPage, SettingsPage
      // gọi API rồi setState sau khi await). Hạ xuống 'warn' để không chặn build vì các
      // effect fetch dữ liệu hợp lệ, nhưng vẫn cảnh báo nếu ai vô tình setState đồng bộ
      // ngay trong thân effect (anti-pattern thật).
      'react-hooks/set-state-in-effect': 'warn',
    },
  },
  {
    files: ['vite.config.js'],
    languageOptions: {
      globals: globals.node,
    },
  },
])
