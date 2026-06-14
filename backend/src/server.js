import app from './app.js';
import { env } from './config/env.js';

process.on('uncaughtException', (err) => {
  console.error('uncaughtException:', err?.stack || err);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('unhandledRejection:', reason);
  if (reason instanceof Error) {
    console.error(reason.stack);
  }
  if (env.NODE_ENV === 'production') {
    process.exit(1);
  }
});

const server = app.listen(env.PORT, '0.0.0.0', () => {
  console.log(
    `ERP backend слушает порт ${env.PORT} (0.0.0.0), DB_DRIVER=${env.DB_DRIVER}, NODE_ENV=${env.NODE_ENV}`,
  );
});

server.on('error', (err) => {
  console.error('Не удалось открыть порт (проверьте PORT):', err);
  process.exit(1);
});

const SHUTDOWN_MS = 10_000;

function shutdown(signal) {
  console.log(`Сигнал ${signal}, закрываю HTTP…`);
  server.close(() => {
    console.log('HTTP закрыт');
    process.exit(0);
  });
  setTimeout(() => {
    console.error('Таймаут shutdown, принудительный выход');
    process.exit(1);
  }, SHUTDOWN_MS).unref?.();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
