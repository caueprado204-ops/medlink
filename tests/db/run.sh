#!/usr/bin/env bash
# Aplica as migrações num Postgres local descartável e roda os testes de regras.
# Uso: PGHOST=/caminho/socket PGPORT=5432 PGUSER=postgres tests/db/run.sh
set -euo pipefail
cd "$(dirname "$0")/../.."
DB=medlink_test
psql -q -v ON_ERROR_STOP=1 -d postgres -c "drop database if exists $DB" -c "create database $DB"
psql -q -v ON_ERROR_STOP=1 -d $DB -f tests/db/00_supabase_shim.sql
for f in supabase/migrations/*_base.sql supabase/migrations/*_escalas.sql; do
  psql -q -v ON_ERROR_STOP=1 -d $DB -f "$f"
done
psql -qtA -v ON_ERROR_STOP=1 -d $DB -f tests/db/10_regras.sql 2>&1 | sed 's/^psql:[^ ]* NOTICE:  //'
