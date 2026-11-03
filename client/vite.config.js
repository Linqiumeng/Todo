import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// 端口和菜谱站（5173 / 3001）错开，两个站可以同时开发
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    proxy: { '/api': 'http://localhost:3002' },
  },
});
