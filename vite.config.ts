import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Carga las variables de entorno basadas en el modo (development, production)
  // El tercer argumento '' carga todas las vars, no solo las que empiezan con VITE_
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    define: {
    },
    build: {
      outDir: 'dist',
    }
  };
});
