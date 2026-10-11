# Auto Minas — Homologação com URL pública e custo-alvo R$ 0

**Objetivo:** usar a MESMA aplicação Next.js + Spring Boot + MySQL em uma vitrine pública de **testes restritos**, com HTTPS e contas fictícias. Não representa lançamento comercial. Não utilizar dados reais de clientes, documentos, imagens de rostos, pagamentos nem credenciais de produção.

## Arquitetura

```text
Navegador (HTTPS) → Caddy (login de avaliador) → Next.js 16 (BFF) → Spring Boot 4.1 → MySQL 8.4
                                                   ↓
                                      volumes privados e criptografados
```

- Somente o Caddy publica 80/443 em `--profile public`. Next.js oferece porta 3000 **somente em 127.0.0.1** para testes locais/túnel. API e MySQL não publicam portas.
- Next.js usa build de produção em modo `standalone` com Node 22; Java 21 é compilado por Maven num contêiner. Imagens multiarch para `amd64` e `arm64`.
- MySQL usa **volume separado**, criado vazio e migrado pela API com Flyway V1–V12. **NUNCA** apontar o compose para o banco real nem transportar dados reais para ele.
- App usa `SPRING_PROFILES_ACTIVE=staging` (não `local`) e `ddl-auto=validate`, com `STAGING_DEMO_ENABLED=true`.
- Cinco anúncios `[DEMO]` e três contas sintéticas (admin, comprador e vendedor) são inseridos **apenas** com o perfil `staging & !prod`; senha aleatória gerada em `.env.staging`. Os anúncios de exemplo são marcados como ativos para testar a vitrine e **não comprovam revisão documental oficial**.
- Proteção extra: senha Caddy com hash bcrypt, `X-Robots-Tag: noindex`, tag de homologação no topo e bloqueio de indexação. HTTPS automático via Caddy.
- `BIOMETRIC_ENABLED=false`, `CONTACT_EMAIL_ENABLED=false`, `EMAIL_CHANGE_ENABLED=false` e `PASSWORD_RESET_ENABLED=false` impedem custo e operações que exigem serviços externos. Pode testar propostas, chat, cadastro de anúncio e revisão documental com imagens **fictícias**. Cadastro novo permanece pendente enquanto SMTP estiver desativado; a conta de comprador sintética já inicia ativa para ensaiar fluxos.
- O hash da senha do Caddy, a chave AES privada, o JWT, as senhas de banco/admin/comprador são produzidos **localmente** e ficam apenas em `deploy/.env.staging` (ignorado pelo Git).

## 1. Colocar para rodar num computador (primeiro teste)

Requisitos: Git, Docker com plugin `docker compose`, OpenSSL, pelo menos **8–12 GB livres em disco** para imagens e banco, acesso à internet no primeiro build. Não é necessário configurar AWS, e-mail ou comprar domínio.

```bash
mkdir auto-minas-lab && cd auto-minas-lab
git clone --branch main https://github.com/josenetoo-dev/auto-minas-frontend.git
git clone --branch main https://github.com/josenetoo-dev/veiculos-api.git
cd auto-minas-frontend
bash deploy/setup-env.sh localhost
docker compose --env-file deploy/.env.staging -f deploy/compose.staging.yml config --quiet
docker compose --env-file deploy/.env.staging -f deploy/compose.staging.yml up --build -d database api frontend
docker compose --env-file deploy/.env.staging -f deploy/compose.staging.yml ps
curl -fsS http://127.0.0.1:3000/api/health
```

Abra **http://localhost:3000** no computador. O script imprime quatro pares de credenciais: acesso de homologação (quando habilitar HTTPS), admin, comprador e vendedor. Guarde em local privado.

Pode levar vários minutos no primeiro build. A API só inicia **depois do MySQL**, aplica Flyway no banco descartável da stack e o Next.js conversa com a API pelo nome de rede interna `api`.

## 2. URL pública provisória, sem máquina Oracle

Se o Auto Minas está rodando localmente e você quiser mostrar a interface por HTTPS sem abrir portas do roteador, use **Cloudflare Quick Tunnel** com restrição de e-mail, a partir da máquina local. **Atualize o `cloudflared`**: a opção `--allowed-mail` foi introduzida em outubro de 2026.

```bash
cloudflared tunnel --url http://localhost:3000 --allowed-mail 'seu-email@exemplo.com'
```

Receberá um endereço temporário `trycloudflare.com`. A máquina, o Docker e o túnel devem ficar ligados. **Não é hospedagem contínua de produção**: o endereço muda, não há garantia de disponibilidade, e o fluxo de autenticação depende do e-mail configurado. Não remova `--allowed-mail` ao expor a stack. Nunca use a opção rápida para documentos pessoais reais.

## 3. HTTPS público persistente em Oracle Always Free (preferencial)

1. Crie uma conta na [Oracle Cloud Free Tier](https://www.oracle.com/cloud/free/). O cadastro pode exigir cartão; **use somente recursos classificados como Always Free**. A capacidade para VM Ampere A1 nem sempre está disponível.
2. Provisione uma VM Linux Ubuntu **Ampere A1, 2 OCPUs e 12 GB RAM** (quando disponível), dentro dos limites gratuitos. O Docker multiarch suporta ARM64. Conceda volume suficiente sem ultrapassar sua cota gratuita.
3. No firewall da **Oracle** (NSG/Security List) e do Linux, permita 80/TCP e 443/TCP+UDP. Limite 22/SSH ao seu IP; NÃO libere portas 3000, 8080 ou 3306.
4. Instale Git, OpenSSL, Docker Engine e plugin Compose seguindo a documentação oficial do Docker. Clone os **dois repositórios e branches** nas pastas irmãs, como na seção 1.
5. Descubra o IP público da VM. Para obter domínio sem pagar, use DNS gratuito `<IP-COM-HÍFENS>.sslip.io`. Ex.: para IP `203.0.113.10`, domínio `203-0-113-10.sslip.io` (exemplo ilustrativo, não é IP do Auto Minas).
6. Execute `bash deploy/setup-env.sh 203-0-113-10.sslip.io` trocando pelo domínio real. O script define a senha externa de avaliador, os logins e segredos; **não execute duas vezes para não sobrescrever o banco com segredos divergentes**.
7. Revise domínio e volumes. Suba a stack com o perfil público:

```bash
docker compose --env-file deploy/.env.staging -f deploy/compose.staging.yml --profile public up --build -d
docker compose --env-file deploy/.env.staging -f deploy/compose.staging.yml ps
curl -I https://SEU-DOMINIO.sslip.io/
```

8. Acesse `https://SEU-DOMINIO.sslip.io` pelo celular; informe **usuário `tester`** e a senha gerada no terminal. Depois, faça login no site com a conta `comprador-demo@auto-minas.test` ou `admin-demo@auto-minas.test` e suas senhas de teste.

O Caddy tenta emitir um certificado HTTPS gratuito para o domínio que aponta à VM. Isso depende de DNS funcionando, portas 80/443 disponíveis, limites da autoridade certificadora e reputação do domínio. **Não há promessa de custo zero universal, capacidade garantida ou uptime.** Monitore consumo e backups; uma máquina gratuita pode estar sujeita a restrições e retomadas.

## 4. Atualização, backup e rollback

Para atualizar um ambiente de testes a partir da `main` já integrada:

```bash
git -C ../veiculos-api pull --ff-only
git pull --ff-only
docker compose --env-file deploy/.env.staging -f deploy/compose.staging.yml --profile public up --build -d
```

`docker compose down` sem `-v` mantém volumes. `docker compose down -v` **APAGA BANCO E DOCUMENTOS DE TESTE**; use só para ambiente descartável e ciente da perda.

Este ambiente deve ser descartável, mas ainda assim faça backup dos dados de homologação se quiser preservá-los. Não copie dados reais/segredos do site de produção. Para ir ao ar comercialmente é obrigatório validar privacidade, SMTP, backup, segurança, dados, permissões e integrações reais.

## 5. O que a CI verifica e o que não verifica

`.github/workflows/staging-stack-ci.yml` compila imagens, sobe MySQL, Spring e Next em runners descartáveis do GitHub, verifica `GET /api/health`, vitrine `[DEMO]`, logins sintéticos, criação pendente de anúncio, propostas, mensagens, pausa, reativação e venda. Também executa Chromium em resoluções mobile e desktop. A CI **não hospeda o site** nem prova disponibilidade externa, funcionamento real da AWS, SMTP, documentos oficiais ou comportamento para usuários reais.

Em 11/10/2026, as implementações dos PRs consolidados [backend #13](https://github.com/josenetoo-dev/veiculos-api/pull/13) e [frontend #6](https://github.com/josenetoo-dev/auto-minas-frontend/pull/6) foram integradas à `main`. Os PRs anteriores são histórico de desenvolvimento, não etapas adicionais de merge. O workflow testa a stack sem realizar deploy externo.
