#!/usr/bin/env bash
# Operação segura da HOMOLOGAÇÃO Auto Minas. Não usa banco de produção.
set -euo pipefail
cd "$(dirname "$0")/.."
umask 077

ENV_FILE="deploy/.env.staging"
COMPOSE_FILE="deploy/compose.staging.yml"
usage() {
  cat <<'HELP'
Auto Minas — comandos de homologação:
  bash deploy/manage.sh prepare localhost               # gerar segredos locais
  bash deploy/manage.sh prepare 203-0-113-10.sslip.io   # gerar segredos para HTTPS
  bash deploy/manage.sh check                            # verificar pré-requisitos
  bash deploy/manage.sh start-local                      # localhost:3000, sem Caddy público
  bash deploy/manage.sh start-public                     # HTTPS/Caddy com senha de avaliador
  bash deploy/manage.sh status
  bash deploy/manage.sh health
  bash deploy/manage.sh logs
  bash deploy/manage.sh stop                             # preserva volumes e banco
Nunca use 'docker compose down -v' se deseja manter os dados.
HELP
}
fail() { printf 'ERRO: %s\n' "$*" >&2; exit 1; }
require_host() {
  command -v docker >/dev/null || fail "Docker não encontrado."
  docker compose version >/dev/null 2>&1 || fail "Instale o plugin Docker Compose."
  [ -f ../veiculos-api/pom.xml ] || fail "Clone veiculos-api (branch main) na pasta irmã."
  [ -f "$ENV_FILE" ] || fail "Credenciais ausentes. Execute: bash deploy/manage.sh prepare DOMINIO"
  local perms
  perms="$(stat -c %a "$ENV_FILE" 2>/dev/null || true)"
  if [ -n "$perms" ] && [ "$perms" != 600 ]; then
    fail "$ENV_FILE deve ter permissão 600 (execute chmod 600 $ENV_FILE)."
  fi
  docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" config --quiet ||
    fail "Configuração Docker inválida."
}
compose() { docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" "$@"; }
command_name="${1:-help}"
case "$command_name" in
  help|-h|--help) usage ;;
  prepare)
    [ "$#" -eq 2 ] || fail "Informe o domínio: prepare localhost ou prepare IP.sslip.io"
    [ ! -e "$ENV_FILE" ] || fail "$ENV_FILE já existe. Não sobrescreva segredos de uma base existente."
    bash deploy/setup-env.sh "$2"
    ;;
  check)
    require_host
    printf 'Configuração válida. API e MySQL não possuem portas públicas.\n'
    printf 'Confirme que os diretórios persistentes e dados são EXCLUSIVOS da homologação.\n'
    ;;
  start-local)
    require_host
    compose up --build -d database api frontend
    printf 'Homologação local: http://127.0.0.1:3000\n'
    printf 'Verifique: bash deploy/manage.sh health\n'
    ;;
  start-public)
    require_host
    [ "$(printenv STAGING_PUBLIC_CONFIRM || true)" = "HOMOLOGACAO_SEM_DADOS_REAIS" ] ||
      fail "Para abrir HTTPS público confirme: STAGING_PUBLIC_CONFIRM=HOMOLOGACAO_SEM_DADOS_REAIS bash deploy/manage.sh start-public"
    domain="$(sed -n 's/^STAGING_DOMAIN=//p' "$ENV_FILE" | head -n 1)"
    [[ "$domain" =~ ^[a-zA-Z0-9.-]+$ ]] ||
      fail "Domínio inválido. Recrie segredos em um ambiente novo com DNS real."
    [ "$domain" != localhost ] && [ "$domain" != 127.0.0.1 ] ||
      fail "Hospedagem pública exige domínio apontando para a máquina."
    compose --profile public up --build -d
    printf 'Homologação com senha: https://%s\n' "$domain"
    printf 'Confirme DNS, firewall e HTTPS e NÃO use documentos reais.\n'
    ;;
  status)
    require_host
    compose --profile public ps
    ;;
  health)
    require_host
    command -v curl >/dev/null || fail "curl não encontrado."
    curl --fail --silent --show-error --max-time 12 \
      http://127.0.0.1:3000/api/health | grep -q '"api":"ok"' ||
      fail "API e frontend não estão saudáveis; confira: bash deploy/manage.sh logs"
    printf 'Saúde API + frontend: OK\n'
    ;;
  logs)
    require_host
    compose --profile public logs --tail=80 api frontend database edge
    ;;
  stop)
    require_host
    compose --profile public down
    printf 'Containers parados. Volumes preservados; NÃO foi usado down -v.\n'
    ;;
  *) usage; fail "Comando desconhecido: $command_name" ;;
esac
