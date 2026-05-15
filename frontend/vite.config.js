import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  /** 8848 — реже конфликтует с другими dev-серверами на 3000/5173 */
  const port = Number(env.VITE_DEV_PORT) || 8848;

  return {
    base: '/',
    build: {
      sourcemap: false,
      chunkSizeWarningLimit: 900,
    },
    server: {
      /** только локальный интерфейс — Safari/брандмауэр меньше сюрпризов, чем 0.0.0.0 */
      host: '127.0.0.1',
      port,
      strictPort: false,
      open: '/',
    },
    plugins: [
      react(),
      {
        name: 'print-dev-url',
        configureServer(server) {
          server.httpServer?.once('listening', () => {
            const addr = server.httpServer?.address();
            const p = typeof addr === 'object' && addr && 'port' in addr ? addr.port : port;
            // eslint-disable-next-line no-console
            console.log(`\n  >>> Сайт: http://127.0.0.1:${p}  (браузер откроется сам)\n`);
          });
        },
      },
    ],
  };
});
