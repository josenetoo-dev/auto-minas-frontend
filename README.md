# Auto Minas — Frontend

Frontend **Next.js 16 + React 19 + TypeScript** do marketplace Auto Minas (interface preta e dourada), integrado ao [backend Java/Spring Boot](https://github.com/josenetoo-dev/veiculos-api). A única fonte de dados de negócio é a API Spring + MySQL; não há autenticação ou banco paralelo no Next.js.

## Estado atualizado — 11/10/2026

- **Integrado na `main`:** [frontend PR #6](https://github.com/josenetoo-dev/auto-minas-frontend/pull/6) e [backend PR #13](https://github.com/josenetoo-dev/veiculos-api/pull/13).
- **CIs aprovadas nas branches consolidadas:** Node 22 (contratos, lint, TypeScript, build); backend Maven/MySQL; Docker de homologação (MySQL 8.4, Spring Boot, Next.js); Chromium em 320, 360, 390, 768, 1024 e 1280px. Evidência: [homologação Docker](https://github.com/josenetoo-dev/auto-minas-frontend/actions/runs/38179856085).
- As imagens de anúncios arquivados são preservadas, mas não servidas a visitantes; sessão usa cookie HttpOnly e token do Spring; redirecionamentos pós-login aceitam só caminhos internos.
- **Ainda não há hospedagem pública permanente, nem liberação para cadastro com dados reais.** Os testes de CI usam banco e identidades fictícias.

## Executar localmente

Requisitos: Node.js >=22, Java 21 e MySQL 8.4 para a API; ou Docker com Compose para a stack integrada.

```bash
git clone https://github.com/josenetoo-dev/auto-minas-frontend.git
cd auto-minas-frontend
cp .env.example .env.local
# Configure AUTO_MINAS_API_URL com a URL do backend local.
npm install
npm run dev
```

Abra `http://localhost:3000`. A interface depende da API real: sem backend funcional não inventa anúncios ou sessões.

## Homologação completa e gratuita quando existir um host

Leia **[deploy/README.md](deploy/README.md)** para preparar Next.js, Spring, MySQL e Caddy em Docker, com dados `[DEMO]`, senha de avaliador, HTTPS e volumes privados.

Clone as **branches `main`** de ambos os repositórios em pastas irmãs (`auto-minas-frontend` e `veiculos-api`), gere segredos com `bash deploy/setup-env.sh <DOMINIO>` e execute o Compose documentado. Não utilize base de produção nesse compose.

Os workflows em `.github/workflows/` verificam contratos, build, integração, transições de anúncio, proposta/chat e responsividade; **não realizam deploy externo**.

## Fluxos do produto

| Área | Rotas |
|---|---|
| Cadastro e login | `/login` |
| Compra, busca por cidade/UF e detalhes | `/`, `/carros`, `/carros/[id]` |
| Cadastro/edição e status dos anúncios | `/vender`, `/vender/editar/[id]`, `/meus-anuncios` |
| Propostas e mensagens | `/chat`, `/chat/[id]` |
| Conta, e-mail e recuperação | `/conta`, `/recuperar-senha` |
| Verificação documental e revisão humana | `/verificacoes`, `/moderacao` |
| Privacidade (texto preliminar) | `/privacidade` |

## Limites antes de produção com usuários reais

- Confirmar migrações Flyway V1–V12 em **cópia restaurada** do banco legado, com backup e plano de restauração. Não aplicar baseline automático em base preexistente.
- Definir política de privacidade/retensão e exclusão de fotos/documentos; não coletar dados pessoais reais sem adequação à LGPD.
- Habilitar SMTP de forma segura para confirmação/recuperação de conta; revisar proteção antiabuso e autenticação na borda.
- Documentação de veículo/identidade é analisada **manualmente**. Não existe consulta oficial automática RENAVAM/SENATRAN/SERPRO. A biometria AWS e captura facial ficam **desabilitadas** na homologação gratuita.
- Google OAuth não está integrado; leitura de mensagens não tem confirmação `readAt`; paginação de grandes catálogos ainda requer otimização no backend.
- Validar manualmente acesso mobile real, autorizações por papel, experiência dos avaliadores e HTTPS após hospedar.

**Regra:** não subir dados ou credenciais reais para CI, não ativar recursos pagos sem autorização e não confundir a homologação `[DEMO]` com serviço comercial.
