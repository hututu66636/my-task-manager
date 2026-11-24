import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// 本地开发：前端跑 5173，后端跑 3001，/api 请求自动转发给后端
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:3001'
    }
  }
});
