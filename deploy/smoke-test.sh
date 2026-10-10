#!/usr/bin/env bash
# Teste de fumaça em stack de HOMOLOGAÇÃO. Requer apenas curl, node e Docker Compose.
set -euo pipefail
cd "$(dirname "$0")/.."
set -a
# Somente arquivo local para CI: nunca usar segredos reais nos logs.
source deploy/.env.staging.example
set +a
URL="${STAGING_TEST_URL:-http://127.0.0.1:3000}"
echo "Aguardando a API e o frontend responderem via Next.js..."
ready=0
for i in $(seq 1 90); do
  if curl -fsS --connect-timeout 2 --max-time 5 "$URL/api/health" \
    | grep -q '"api":"ok"'; then
    ready=1
    break
  fi
  sleep 3
done
if [ "$ready" -ne 1 ]; then
  echo "Falha: frontend e API não ficaram saudáveis em até 270 segundos."
  exit 1
fi

echo "Saúde frontend + API: OK"
# O seed e o SSR podem concluir após a primeira resposta de health.
vitrine_ok=0
for i in $(seq 1 30); do
  curl -fsS --max-time 15 "$URL/carros" -o /tmp/auto-minas-carros.html || true
  if grep -q 'DEMO' /tmp/auto-minas-carros.html; then
    vitrine_ok=1
    break
  fi
  sleep 2
done
if [ "$vitrine_ok" -ne 1 ]; then
  echo "Falha: vitrine não mostrou anúncios fictícios após 60 segundos."
  echo "Quantidade de anúncios no MySQL (sem dados pessoais):"
  docker compose --env-file deploy/.env.staging.example -f deploy/compose.staging.yml exec -T database sh -c \
    'MYSQL_PWD="$MYSQL_PASSWORD" mysql -N -u"$MYSQL_USER" auto_minas_staging -e "SELECT COUNT(*) FROM anuncio;"' || true
  echo "Resposta da API interna (primeiros 500 caracteres):"
  docker compose --env-file deploy/.env.staging.example -f deploy/compose.staging.yml exec -T frontend node -e \
    'fetch("http://api:8080/v1/anuncio?size=5").then(r=>r.text()).then(t=>console.log(t.slice(0,500))).catch(e=>console.error(e.message))' || true
  exit 1
fi
echo "Vitrine: anúncios fictícios retornados da API e renderizados via Next.js."

STAGING_SMOKE_URL="$URL" node - <<'NODE'
const url=process.env.STAGING_SMOKE_URL;
const password=process.env.STAGING_DEMO_BUYER_PASSWORD;
(async()=>{
  const resp=await fetch(url+"/api/auth/login",{
    method:"POST",
    headers:{"content-type":"application/json","origin":url},
    body:JSON.stringify({email:"comprador-demo@auto-minas.test",password})
  });
  if(resp.status!==200) {
    throw new Error("Login de comprador de teste falhou com HTTP "+resp.status);
  }
  const content=await resp.json();
  if(!content.ok)throw new Error("Resposta de login de teste inesperada");
  const cookie=resp.headers.get("set-cookie");
  if(!cookie?.includes("auto_minas_access="))throw new Error("Cookie HttpOnly ausente no login");
  console.log("Login com API Spring + sessão Next.js: OK.");
})().catch(e=>{console.error(e.message);process.exit(1)});
NODE
echo "Homologação CI OK: MySQL -> Spring -> Next -> login, sem dados pessoais reais."
