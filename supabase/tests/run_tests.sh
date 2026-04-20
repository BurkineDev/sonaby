#!/usr/bin/env bash
# ─── CyberGuard SONABHY — pgTAP Test Runner ───────────────────────────────────
#
# Usage :
#   ./supabase/tests/run_tests.sh              # tous les tests
#   ./supabase/tests/run_tests.sh 01           # seulement le fichier 01_*
#
# Prérequis :
#   - Supabase local démarré : supabase start
#   - pg_prove installé      : cpan TAP::Parser::SourceHandler::pgTAP
#     ou: apt-get install libtap-parser-sourcehandler-pgtap-perl
#   - pgTAP installé dans la DB (automatique via config.toml ou :
#     psql -c "create extension if not exists pgtap")
#
# Variables d'environnement (optionnelles) :
#   SUPABASE_DB_URL  : postgres://postgres:postgres@localhost:54322/postgres
# ──────────────────────────────────────────────────────────────────────────────

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DB_URL="${SUPABASE_DB_URL:-postgres://postgres:postgres@localhost:54322/postgres}"
FILTER="${1:-}"

echo "🔬 pgTAP Tests — CyberGuard SONABHY"
echo "   DB : $DB_URL"
echo ""

# S'assurer que pgTAP est installé
psql "$DB_URL" -c "create extension if not exists pgtap;" -q

# Trouver les fichiers de test
if [[ -n "$FILTER" ]]; then
  TEST_FILES=("$SCRIPT_DIR"/${FILTER}*.sql)
else
  TEST_FILES=("$SCRIPT_DIR"/*.sql)
fi

if [[ ${#TEST_FILES[@]} -eq 0 ]]; then
  echo "❌ Aucun fichier de test trouvé pour le filtre : $FILTER"
  exit 1
fi

echo "   Fichiers : ${#TEST_FILES[@]} test(s)"
echo ""

# Exécuter avec pg_prove si disponible, sinon psql
if command -v pg_prove &>/dev/null; then
  pg_prove --dbname "$DB_URL" --verbose "${TEST_FILES[@]}"
else
  echo "⚠️  pg_prove non trouvé. Exécution via psql (sortie brute TAP)."
  echo ""
  FAILED=0
  for file in "${TEST_FILES[@]}"; do
    echo "── $(basename "$file") ──"
    if ! psql "$DB_URL" -f "$file" --no-psqlrc -q; then
      FAILED=$((FAILED + 1))
    fi
    echo ""
  done

  if [[ $FAILED -gt 0 ]]; then
    echo "❌ $FAILED fichier(s) de test échoué(s)"
    exit 1
  fi
fi

echo ""
echo "✅ Tous les tests pgTAP ont réussi"
