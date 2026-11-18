#!/usr/bin/env bash
# Spins up a throwaway Postgres, applies every migration, and runs the RLS test suite.
# Usage: pnpm --filter @heroics/schema test:db   (needs Postgres 15+ binaries installed)
set -euo pipefail

HERE="$(cd "$(dirname "$0")/.." && pwd)"
PG_BIN="${PG_BIN:-$(dirname "$(ls -d /usr/lib/postgresql/*/bin/initdb 2>/dev/null | sort -V | tail -1)")}"
[ -x "$PG_BIN/initdb" ] || PG_BIN="$(dirname "$(command -v initdb)")"

TMP="$(mktemp -d)"
PORT="${PGTEST_PORT:-54329}"
RUN=()
if [ "$(id -u)" = "0" ]; then
  # initdb refuses to run as root; use the postgres system user.
  chown -R postgres "$TMP"
  RUN=(runuser -u postgres --)
fi

cleanup() {
  "${RUN[@]}" "$PG_BIN/pg_ctl" -D "$TMP/data" -m immediate stop >/dev/null 2>&1 || true
  rm -rf "$TMP"
}
trap cleanup EXIT

"${RUN[@]}" "$PG_BIN/initdb" -D "$TMP/data" -U heroics_owner --auth=trust >/dev/null
"${RUN[@]}" "$PG_BIN/pg_ctl" -D "$TMP/data" -o "-p $PORT -k $TMP -c listen_addresses=''" -l "$TMP/log" -w start >/dev/null

PSQL=("${RUN[@]}" "$PG_BIN/psql" -h "$TMP" -p "$PORT" -U heroics_owner -v ON_ERROR_STOP=1 -q -X)
"${PSQL[@]}" -d postgres -c "create database heroics"

for f in "$HERE"/migrations/*.sql; do
  echo "migrate  $(basename "$f")"
  "${PSQL[@]}" -d heroics -f "$f"
done

echo "test     rls.sql"
"${PSQL[@]}" -d heroics -f "$HERE/test/rls.sql"
echo "ok       all database tests passed"
