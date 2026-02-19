import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // .env dosyasındaki değişkenleri yükler (Local geliştirme için)
  const env = loadEnv(mode, (process as any).cwd(), '');
  
  return {
    plugins: [react()],
    define: {
      // Google GenAI SDK'sının 'process.env.API_KEY' formatını 
      // tarayıcıda kullanabilmesi için değişkeni tanımlıyoruz.
      // ÖNCELİK SIRASI: 
      // 1. process.env.API_KEY (Vercel Dashboard / Sistem Değişkeni)
      // 2. env.API_KEY (.env dosyası - Local)
      'process.env.API_KEY': JSON.stringify(process.env.API_KEY || env.API_KEY),
    },
  };
});