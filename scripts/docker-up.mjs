import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const POSTGRES_CONTAINER = 'agro-erp-postgres';

function run(cmd) {
  execSync(cmd, { cwd: root, stdio: 'inherit', shell: true });
}

/**
 * Одна попытка: compose up с ожиданием или без --wait + пауза.
 */
async function composeUpOnce() {
  try {
    run('docker compose up -d --wait');
  } catch {
    run('docker compose up -d');
    await new Promise((resolve) => {
      setTimeout(resolve, 12000);
    });
  }
}

/**
 * Поднимает PostgreSQL из docker-compose.yml и ждёт готовности.
 * SKIP_DOCKER=1 — пропуск (если Postgres уже установлен отдельно).
 *
 * При конфликте имени контейнера удаляется только контейнер (том agro_erp_pgdata не удаляется).
 */
export async function dockerComposeUpWait() {
  if (process.env.SKIP_DOCKER === '1') {
    console.log('SKIP_DOCKER=1 — контейнер PostgreSQL не поднимаю (используйте свой Postgres).');
    return;
  }

  try {
    await composeUpOnce();
  } catch {
    console.log(
      `\nКонфликт имени контейнера «${POSTGRES_CONTAINER}» — удаляю старый контейнер и поднимаю заново (данные в Docker volume обычно сохраняются)…\n`,
    );
    try {
      execSync(`docker rm -f ${POSTGRES_CONTAINER}`, { stdio: 'pipe', shell: true });
    } catch {
      /* контейнера могло уже не быть */
    }

    try {
      await composeUpOnce();
    } catch {
      throw new Error(
        'Не удалось выполнить «docker compose». Запустите Docker Desktop. Если база уже запущена отдельно: SKIP_DOCKER=1 npm run dev',
      );
    }
  }
}
