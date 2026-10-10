#!/usr/bin/env bash
# Gera credenciais aleatórias locais para TESTES, sem versioná-las.
set -euo pipefail
cd "$(dirname "$0")/.."
umask 077
if [ -e deploy/.env.staging ]; then
  echo "deploy/.env.staging já existe; não sobrescrevi segredos."
  exit 1
fi
command -v openssl >/dev/null || { echo "Instale openssl."; exit 1; }
command -v docker >/dev/null || { echo "Instale Docker e Docker Compose."; exit 1; }
DOMAIN="${1:-localhost}"
if ! [[ "$DOMAIN" =~ ^[a-zA-Z0-9.-]+$ ]]; then
  echo "Domínio inválido. Exemplo: 203.0.113.10.sslip.io"
  exit 1
fi
ACCESS_PASSWORD="$(openssl rand -hex 12)"
ACCESS_HASH="$(docker run --rm caddy:2.10.2-alpine caddy hash-password --plaintext "$ACCESS_PASSWORD")"
cat > deploy/.env.staging <<EOF
STAGING_DOMAIN=$DOMAIN
STAGING_DB_PASSWORD=$(openssl rand -hex 24)
STAGING_ROOT_PASSWORD=$(openssl rand -hex 24)
STAGING_JWT_SECRET=$(openssl rand -hex 48)
STAGING_STORAGE_KEY=$(openssl rand -base64 32)
STAGING_DEMO_ADMIN_PASSWORD=$(openssl rand -hex 18)
STAGING_DEMO_BUYER_PASSWORD=$(openssl rand -hex 18)
STAGING_DEMO_SELLER_PASSWORD=$(openssl rand -hex 18)
STAGING_ACCESS_HASH='$ACCESS_HASH'
EOF
chmod 600 deploy/.env.staging
printf '\nArquivo deploy/.env.staging criado com permissões 600.\n'
printf 'USUÁRIO DA HOMOLOGAÇÃO: tester\n'
printf 'SENHA DA HOMOLOGAÇÃO: %s\n' "$ACCESS_PASSWORD"
printf 'LOGIN ADMIN: admin-demo@auto-minas.test\n'
printf 'SENHA ADMIN: %s\n' "$(grep '^STAGING_DEMO_ADMIN_PASSWORD=' deploy/.env.staging | cut -d= -f2)"
printf 'LOGIN COMPRADOR: comprador-demo@auto-minas.test\n'
printf 'SENHA COMPRADOR: %s\n' "$(grep '^STAGING_DEMO_BUYER_PASSWORD=' deploy/.env.staging | cut -d= -f2)"
printf 'LOGIN VENDEDOR: vendedor-demo@auto-minas.test\n'
printf 'SENHA VENDEDOR: %s\n\n' "$(grep '^STAGING_DEMO_SELLER_PASSWORD=' deploy/.env.staging | cut -d= -f2)"
printf 'Guarde essa senha fora do repositório. Não envie em chats públicos.\n'
printf 'Próximo passo: docker compose --env-file deploy/.env.staging -f deploy/compose.staging.yml config --quiet\n'
