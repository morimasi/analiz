import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, (process as any).cwd(), '');
  
  return {
    plugins: [react()],
    server: {
      proxy: {
        // /api ile başlayan tüm istekleri http://localhost:3001'e yönlendir
        '/api': {
          target: 'http://localhost:3001',
          changeOrigin: true,
          secure: false,
        },
      },
    },
    define: {
      'process.env': {},
      'process.env.API_KEY': JSON.stringify(process.env.API_KEY || env.API_KEY),
    },
  };
});