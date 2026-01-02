#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

log() {
  printf "\n==> %s\n" "$1"
}

warn() {
  printf "\n[warn] %s\n" "$1"
}

run_if_missing_node_modules() {
  local dir="$1"
  if [ ! -d "${dir}/node_modules" ]; then
    log "Installing dependencies in ${dir}"
    pnpm --dir "${dir}" install
  fi
}

log "Starting local Postgres via Docker (if available)"
if command -v docker >/dev/null 2>&1; then
  if docker compose version >/dev/null 2>&1; then
    docker compose -f "${ROOT_DIR}/docker-compose.yml" up -d
  elif command -v docker-compose >/dev/null 2>&1; then
    docker-compose -f "${ROOT_DIR}/docker-compose.yml" up -d
  else
    warn "Docker is installed but docker compose is not available."
  fi
else
  warn "Docker is not installed. Start Postgres manually and ensure backend .env matches."
fi

log "Checking env files"
if [ ! -f "${ROOT_DIR}/apps/backend/.env" ]; then
  warn "Missing apps/backend/.env. Copy from apps/backend/.env.sample and update credentials."
fi
if [ ! -f "${ROOT_DIR}/apps/frontend/.env.local" ]; then
  warn "Missing apps/frontend/.env.local. Copy from apps/frontend/.env.sample and update settings."
fi

log "Installing dependencies (if needed)"
if ! command -v pnpm >/dev/null 2>&1; then
  echo "pnpm is required. Install it first."
  exit 1
fi

run_if_missing_node_modules "${ROOT_DIR}/apps/backend"
run_if_missing_node_modules "${ROOT_DIR}/apps/frontend"

log "Running backend migrations"
pnpm --dir "${ROOT_DIR}/apps/backend" run db:migrate


log "Starting backend and frontend dev servers"
pnpm --dir "${ROOT_DIR}/apps/backend" run dev &
BACKEND_PID=$!
pnpm --dir "${ROOT_DIR}/apps/frontend" run dev &
FRONTEND_PID=$!

cleanup() {
  log "Shutting down dev servers"
  kill "${BACKEND_PID}" "${FRONTEND_PID}" 2>/dev/null || true
}

trap cleanup EXIT INT TERM

log "Backend PID: ${BACKEND_PID} | Frontend PID: ${FRONTEND_PID}"
log "Press Ctrl+C to stop."
wait
