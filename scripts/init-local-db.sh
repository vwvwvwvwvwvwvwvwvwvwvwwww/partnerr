#!/usr/bin/env bash
# Создаёт пользователя, БД и расширения PostGIS для работы без Docker.
# Требуется: Homebrew, postgis, PostgreSQL той же мажорной версии, для которой собран postgis
# (сейчас в Homebrew postgis чаще всего идёт с postgresql@17 / @18, а не @16 — см. README).
set -euo pipefail

DB_NAME="${DB_NAME:-agro_erp}"
DB_USER="${DB_USER:-agro_erp_user}"
DB_PASS="${DB_PASSWORD:-change_me_securely}"

if ! command -v brew &>/dev/null; then
  echo "Установите Homebrew: https://brew.sh"
  exit 1
fi

# MAJOR: 17, 18, … — каталог share/postgresql@MAJOR/extension
PG_MAJOR=""
PG_PREFIX=""
POSTGIS_PREFIX="$(brew --prefix postgis 2>/dev/null || true)"

pick_postgres_for_postgis() {
  if [[ -z "$POSTGIS_PREFIX" || ! -d "$POSTGIS_PREFIX" ]]; then
    echo "Пакет postgis не найден. Выполните: brew install postgis"
    return 1
  fi

  # Явный выбор: POSTGRES_BREW_PKG=postgresql@17 ./scripts/init-local-db.sh
  if [[ -n "${POSTGRES_BREW_PKG:-}" ]]; then
    PG_PREFIX="$(brew --prefix "$POSTGRES_BREW_PKG" 2>/dev/null || true)"
    if [[ -z "$PG_PREFIX" || ! -x "$PG_PREFIX/bin/psql" ]]; then
      echo "Не найден $POSTGRES_BREW_PKG. Установите: brew install $POSTGRES_BREW_PKG"
      return 1
    fi
    if [[ "$POSTGRES_BREW_PKG" =~ postgresql@([0-9]+) ]]; then
      PG_MAJOR="${BASH_REMATCH[1]}"
    else
      echo "POSTGRES_BREW_PKG должен быть вида postgresql@17"
      return 1
    fi
    local ctrl="$POSTGIS_PREFIX/share/postgresql@${PG_MAJOR}/extension/postgis.control"
    if [[ ! -f "$ctrl" ]]; then
      echo "Для PostgreSQL ${PG_MAJOR} в пакете postgis нет postgis.control (ожидалось: $ctrl)."
      echo "Поставьте другую версию Postgre из Homebrew или обновите postgis: brew upgrade postgis"
      return 1
    fi
    return 0
  fi

  local maj ctrl pref
  for maj in 18 17 16 15; do
    ctrl="$POSTGIS_PREFIX/share/postgresql@${maj}/extension/postgis.control"
    pref="$(brew --prefix postgresql@${maj} 2>/dev/null || true)"
    if [[ -f "$ctrl" && -n "$pref" && -x "$pref/bin/psql" ]]; then
      PG_MAJOR=$maj
      PG_PREFIX=$pref
      return 0
    fi
  done

  # postgis.control в нестандартном месте внутри Cellar
  local found
  found="$(find "$POSTGIS_PREFIX" -name postgis.control 2>/dev/null | head -1 || true)"
  if [[ -z "$found" ]]; then
    echo "Не найден postgis.control внутри $POSTGIS_PREFIX."
    echo "Выполните: brew reinstall postgis"
    echo "Либо Postgres.app: https://postgresapp.com/"
    return 1
  fi

  if [[ "$found" =~ postgresql@([0-9]+)/extension ]]; then
    maj="${BASH_REMATCH[1]}"
    pref="$(brew --prefix postgresql@${maj} 2>/dev/null || true)"
    if [[ -n "$pref" && -x "$pref/bin/psql" ]]; then
      PG_MAJOR=$maj
      PG_PREFIX=$pref
      return 0
    fi
    echo "PostGIS в Homebrew собран для PostgreSQL ${maj}, но пакет postgresql@${maj} не установлен."
    echo "Выполните: brew install postgresql@${maj} && brew services start postgresql@${maj}"
    echo "(если порт 5432 занят старым postgresql@16: brew services stop postgresql@16)"
    return 1
  fi

  echo "Не удалось сопоставить PostGIS с установленным PostgreSQL."
  echo "Установите пару из одной эпохи Homebrew, например: brew install postgresql@17 postgis"
  return 1
}

pick_postgres_for_postgis

export PATH="$PG_PREFIX/bin:$PATH"

# Homebrew: postgis и postgresql@MAJOR в разных префиксах — без симлинков CREATE EXTENSION postgis падает.
link_postgis_extensions() {
  local target_ext="$PG_PREFIX/share/postgresql@${PG_MAJOR}/extension"
  local target_lib="$PG_PREFIX/lib/postgresql"

  if [[ -f "$target_ext/postgis.control" ]]; then
    return 0
  fi

  local ctrl="$POSTGIS_PREFIX/share/postgresql@${PG_MAJOR}/extension/postgis.control"
  if [[ ! -f "$ctrl" ]]; then
    ctrl="$(find "$POSTGIS_PREFIX" -path "*/postgresql@${PG_MAJOR}/extension/postgis.control" -print -quit 2>/dev/null || true)"
  fi
  if [[ -z "$ctrl" || ! -f "$ctrl" ]]; then
    echo "Не найден postgis.control для PostgreSQL ${PG_MAJOR}."
    return 1
  fi

  local src_ext
  src_ext="$(dirname "$ctrl")"
  echo "Связываю PostGIS для PostgreSQL ${PG_MAJOR} ($src_ext → $target_ext)…"
  mkdir -p "$target_ext"
  local f
  for f in "$src_ext"/*; do
    [[ -e "$f" ]] || continue
    ln -sf "$f" "$target_ext/$(basename "$f")"
  done

  mkdir -p "$target_lib"
  while IFS= read -r -d '' f; do
    ln -sf "$f" "$target_lib/$(basename "$f")"
  done < <(find "$POSTGIS_PREFIX/lib" \( -name 'postgis*.dylib' -o -name 'postgis*.so' -o -name 'libpostgis*.dylib' \) -print0 2>/dev/null || true)

  return 0
}

if ! pg_isready -q 2>/dev/null; then
  echo "Запустите PostgreSQL, например: brew services start postgresql@${PG_MAJOR}"
  exit 1
fi

SUPER_DB="${SUPER_DB:-postgres}"

if psql -d "$SUPER_DB" -tAc "SELECT 1 FROM pg_roles WHERE rolname = '$DB_USER'" | grep -q 1; then
  psql -d "$SUPER_DB" -v ON_ERROR_STOP=1 -c "ALTER ROLE \"$DB_USER\" WITH PASSWORD '$DB_PASS';"
else
  psql -d "$SUPER_DB" -v ON_ERROR_STOP=1 -c "CREATE ROLE \"$DB_USER\" LOGIN PASSWORD '$DB_PASS';"
fi

if psql -d "$SUPER_DB" -tAc "SELECT 1 FROM pg_database WHERE datname='$DB_NAME'" | grep -q 1; then
  echo "База $DB_NAME уже есть — пропускаю CREATE DATABASE."
else
  createdb -O "$DB_USER" "$DB_NAME"
  echo "Создана база $DB_NAME."
fi

link_postgis_extensions

psql -d "$DB_NAME" -v ON_ERROR_STOP=1 -c "CREATE EXTENSION IF NOT EXISTS postgis;"
psql -d "$DB_NAME" -v ON_ERROR_STOP=1 -c "CREATE EXTENSION IF NOT EXISTS pgcrypto;"

echo ""
echo "Использован PostgreSQL ${PG_MAJOR} из: $PG_PREFIX"
echo "Готово. В backend/.env проверьте: DB_HOST=127.0.0.1 DB_PORT=5432 DB_NAME=$DB_NAME DB_USER=$DB_USER DB_PASSWORD=$DB_PASS"
echo "Дальше: SKIP_DOCKER=1 npm run bootstrap   и   npm run dev"
