# Перенос на GitHub и деплой на хост

Краткая инструкция: новый репозиторий → push → Railway или Render.

## Что не попадает в Git (уже в `.gitignore`)

- `backend/.env`, `frontend/.env` — секреты и локальные настройки
- `backend/data/` — файл SQLite с данными
- `node_modules/`, `frontend/dist/`

В репозитории только **`.env.example`** — без паролей.

---

## 1. Создать репозиторий на GitHub

1. [github.com/new](https://github.com/new)
2. Имя, например: `partner-erp` или `agro-erp`
3. **Без** README, .gitignore и license (они уже есть в проекте)
4. Создать пустой репозиторий

---

## 2. Залить код из папки проекта

В терминале (путь к проекту — лучше **латиница**, см. README про `dev:latin`):

```bash
cd /Users/User/Desktop/диплом

# Проверить, что секреты не попадут в коммит
git status

# Добавить все файлы проекта ( .env и sqlite не добавятся — в .gitignore )
git add .

# Коммит
git commit -m "$(cat <<'EOF'
Подготовка к деплою: SQLite, Leaflet-карта, фиксированное меню.

Без отдельной PostgreSQL на хостинге; инструкции в docs/GITHUB-AND-HOST.md.
EOF
)"

# Подключить НОВЫЙ репозиторий (замените URL на свой)
git remote remove origin 2>/dev/null || true
git remote add origin https://github.com/ВАШ_ЛОГИН/ИМЯ_РЕПО.git

git branch -M main
git push -u origin main
```

Если `git remote remove origin` не нужен (репозиторий уже новый локально):

```bash
git remote add origin https://github.com/ВАШ_ЛОГИН/ИМЯ_РЕПО.git
git push -u origin main
```

---

## 3. Деплой на Railway (рекомендуется)

1. [railway.com/new](https://railway.com/new) → **Deploy from GitHub** → выберите репозиторий
2. В **Variables** сервиса:

| Переменная | Значение |
|------------|----------|
| `NODE_ENV` | `production` |
| `DB_DRIVER` | `sqlite` |
| `SQLITE_PATH` | `./data/agro_erp.sqlite` |
| `VITE_API_URL` | `/api` |
| `JWT_SECRET` | случайная строка **≥ 32 символов** |

`DATABASE_URL` **не нужен**.

3. Дождаться зелёного деплоя
4. **Settings → Networking → Generate Domain**
5. Открыть `https://ваш-домен.up.railway.app/api/health` → `{"status":"ok"}`

### Первый запуск (Shell в Railway)

```bash
ADMIN_USERNAME=admin \
ADMIN_PASSWORD='ВашНадёжныйПароль' \
ADMIN_FULL_NAME='Администратор' \
npm run create-admin --prefix backend

SEED_STAFF_PASSWORD='ВашНадёжныйПароль' \
npm run seed-staff --prefix backend

npm run seed-sqlite-demo --prefix backend
```

Вход: `admin` / ваш пароль.

Подробнее: [DEPLOY-RAILWAY.md](../DEPLOY-RAILWAY.md)

---

## 4. Деплой на Render (альтернатива)

1. [dashboard.render.com](https://dashboard.render.com) → **New → Blueprint**
2. Подключить репозиторий — используется `render.yaml` (SQLite, без Postgres)
3. Задать **`JWT_SECRET`** при создании
4. После деплоя — те же команды в **Shell**, что для Railway

Подробнее: [DEPLOY-RENDER.md](../DEPLOY-RENDER.md)

---

## 5. Проверка после деплоя

- [ ] `https://…/api/health` → `{"status":"ok"}`
- [ ] Страница логина открывается
- [ ] Вход `admin` работает
- [ ] Раздел «Поля и ГИС» — карта и реестр полей

---

## 6. Обновление сайта

```bash
git add .
git commit -m "Описание изменений"
git push origin main
```

Railway/Render пересоберут проект автоматически (если включён auto-deploy).

**Важно:** на free-плане файл SQLite может обнуляться при пересборке — после деплоя при необходимости снова выполните `create-admin` и `seed-sqlite-demo` в Shell.

---

## 7. Локальная разработка (после клонирования)

```bash
git clone https://github.com/ВАШ_ЛОГИН/ИМЯ_РЕПО.git
cd ИМЯ_РЕПО
npm run bootstrap
npm run dev
```

Сайт: http://127.0.0.1:8848 — `admin` / `Admin12345Secure!` (после bootstrap).
