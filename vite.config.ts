import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Carga las variables de entorno basadas en el modo (development, production)
  // El tercer argumento '' carga todas las vars, no solo las que empiezan con VITE_
  const env = loadEnv(mode, (process as any).cwd(), '');

  return {
    plugins: [react()],
    define: {
      // Esto permite que el código existente `process.env.API_KEY` funcione en el navegador
      // Inyectando el valor durante el build/dev time.
      'process.env.API_KEY': JSON.stringify(env.API_KEY)
    },
    build: {
      outDir: 'dist',
    }
  };
});