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
curl -fsS --max-time 15 "$URL/carros" -o /tmp/auto-minas-carros.html
if ! grep -q '\[DEMO\]' /tmp/auto-minas-carros.html; then
  echo "Falha: vitrine não mostrou os anúncios de exemplo vindos do MySQL."
  exit 1
fi
echo "Vitrine: dados fictícios retornados da API e renderizados via Next.js."

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
