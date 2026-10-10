# Auto Minas — Frontend Next.js

Interface para o marketplace Auto Minas. Projeto derivado do ZIP enviado pelo usuário, **agora conectado ao backend Spring Boot** como única fonte de dados. Não usa PostgreSQL/Drizzle próprio, tokens de sessão paralelos, logins demo nem uploads fora da API.

**Este projeto NÃO está pronto para lançar publicamente sem homologação.** A API precisa integrar os PRs dependentes #1–#12 do repositório [`josenetoo-dev/veiculos-api`](https://github.com/josenetoo-dev/veiculos-api). Os PRs ainda não foram integrados na `main` e as migrations V1–V12 precisam ser testadas com cópia restaurada do banco original antes da implantação.

## Executar no computador

Requisitos: Node.js >= 22 e backend Java com as migrations aplicadas em ambiente de desenvolvimento isolado.

```bash
cp .env.example .env.local
# Ajuste AUTO_MINAS_API_URL para a URL REAL da API local.
npm install
npm run dev
```

Abra `http://localhost:3000`. **Sem API, o frontend não inventa anúncios nem autenticações**: apresenta indisponibilidade ou erros relevantes.

Validação (depende de instalar dependências):

```bash
npm test
npm run typecheck
npm run lint
npm run build
```

**CI GitHub Actions aprovada:** `npm test`, `npm run typecheck`, `npm run lint` e `npm run build` passaram em Node.js 22 no PR #1. [Execução registrada](https://github.com/josenetoo-dev/auto-minas-frontend/actions/runs/38064247715). **Testes E2E contra o backend real ainda não foram executados.**

## Arquitetura

- Next.js 16 / React 19 / TypeScript, com componentes responsivos e identidade visual escura/dourada derivada do ZIP original.
- `src/lib/backend.ts`: client HTTP server-side contra `AUTO_MINAS_API_URL`, com status e erros explícitos, sem fake API.
- Cookie HttpOnly / Secure (HTTPS em produção) armazena o JWT emitido pelo **Spring**; `getSession()` consulta `/v1/usuario/me`, verificando revogação de token e status da conta. Não usa JWT assinado por segredo default do Next.
- `src/app/api/backend/[...path]`: BFF same-origin para rotas permitidas do Spring, com defesa de origem em métodos mutáveis. Spring Security é autoridade final da autorização.
- `src/lib/car.ts`: conversor `AnuncioResponse` para dados de UI. Mapeia status reais `ATIVO`, `PENDENTE`, `REJEITADO`, `PAUSADO`, `VENDIDO`, `SUSPENSO`, `ARQUIVADO`, enum combustível e câmbio. Não inventa cidade/UF nem endereço; backend não os informa.
- `/api/cars`: cria anúncio pendente no Spring. Uploads **após** criar anúncio via `/v1/anuncio/{id}/fotos` (limite real de 10/lote, 20 total), sem pasta `.uploads` local.
- `/api/media/{uuid}`: proxy de imagens mesmo-origem autorizado pelo status do anúncio, sem expor JWT no navegador.
- `src/lib/chat.ts`: vincula negociação real a **Propostas**. A conversa antiga livre não existe no Spring; iniciar diálogo envia uma proposta com preço/mensagem explicitamente confirmados pelo usuário.

## Fluxos já disponíveis na interface

| Área | Rota Next.js | Spring Boot |
|---|---|---|
| Cadastro/login | `/login` | `POST /auth/register`, `/auth/login`; `GET /v1/usuario/me` |
| Contato por e-mail | `/conta` | `/v1/usuario/me/contato/email/*` |
| Recuperação de senha | `/recuperar-senha` | `/auth/password-reset/*` |
| Listagem pública e detalhes | `/`, `/carros`, `/carros/{id}` | `GET /v1/anuncio`, `GET /v1/anuncio/{id}`, fotos |
| Gerenciar anúncios | `/meus-anuncios`, `/vender`, `/vender/editar/{id}` | `/v1/anuncio/meus`, `POST/PUT/DELETE /v1/anuncio` |
| Documentos de identidade e veículo | `/verificacoes` | `/v1/verificacoes/*` |
| Chat vinculado a proposta | `/chat`, `/chat/{id}` | `/v1/proposta/minhas`, `/v1/proposta/{id}`, `/v1/proposta/{id}/mensagens` |
| Denúncia de anúncio | `/carros/{id}` | `POST /v1/denuncias` |
| Painel administrativo | `/moderacao` | `/v1/moderacao/anuncios`, `/v1/verificacoes/revisao/*`, `/v1/denuncias/revisao/*` |
| Biometria | `/verificacoes` | Sessão backend disponível, **captura facial ainda não integrada** |

## O que ainda precisa ser construído ou validado

1. **Biometria no navegador:** não há câmera funcional; exige integração segura AWS Amplify, credenciais temporárias Cognito/IAM federadas ao JWT do Auto Minas, política LGPD, alternativa acessível e testes reais com orçamento e limites definidos. Tela atual informa indisponibilidade em vez de criar sessões pagas que não podem ser concluídas.
2. **Estado dos anúncios do vendedor:** implementado na Fase 7. Pausar retira da vitrine; reativação volta para análise, nunca publicação automática; vender impede novas propostas. Resta validar UX e conflitos com moderação em homologação ampliada.
3. **Localização declarada:** a Fase 7 adicionou cidade/UF aos DTOs e à migração V12, com filtros e preenchimento no frontend. Localização não comprova residência e anúncios legados sem preenchimento continuam sem cidade/UF.
4. **Leitura de mensagens:** Spring não guarda `readAt`. A interface não finge notificações de não lidas ou marcação de leitura; próxima fase necessita endpoint real.
5. **Google OAuth:** as rotas antigas do ZIP autenticavam no banco PostgreSQL paralelo; foram desativadas para não criar um segundo sistema de identidade. Somente reativar com integração oficialmente suportada pelo backend.
6. **SMTP/Storage:** ativação de contato e recuperação de senha exigem SMTP configurado. Upload de documentos depende de storage privado cifrado e chave segura; quando desativados a API responde 503.
7. **Privacidade:** texto em `/privacidade` é aviso técnico preliminar, **não** política LGPD juridicamente validada. Antes de coletar documentos reais, definir controlador, base legal, canais de titulares e descarte de dados.
8. **Homologação:** a compilação Next já passou na CI. Restam testes com MySQL restaurado, testes E2E desktop/mobile contra a API real, revisão de segurança independente, cache/CDN e configuração de deploy HTTPS/headers.
9. **Paginação**: vitrine consulta até dez páginas de cem registros; para produção em grande escala será necessário implementar busca/filtragem e paginação no servidor Java.

## Evolução da Fase 7 — revisão sem cloud paga

O backend (PR #12) inclui endpoints que permitem ao proprietário pausar, solicitar reativação **pendente de moderação** e marcar anúncio como vendido, com auditoria e preservação de histórico. A migration V12 adiciona cidade/UF sem apagar registros antigos. O frontend (PR #4) conecta essas operações e atualiza filtros, formulários, cards e detalhes.

A stack Docker permanece disponível em `deploy/compose.staging.yml`; para testar a Fase 7, use as branches `feature/fase-7-anuncios-localizacao-status` **em ambos os repositórios**. A CI também executa um teste E2E do vendedor no banco descartável.

## GitHub

O projeto está versionado em [josenetoo-dev/auto-minas-frontend](https://github.com/josenetoo-dev/auto-minas-frontend).

- Branch com os 67 arquivos: [`integracao/frontend-spring`](https://github.com/josenetoo-dev/auto-minas-frontend/tree/integracao/frontend-spring).
- Revisão proposta: [PR #1](https://github.com/josenetoo-dev/auto-minas-frontend/pull/1).
- GitHub Actions: `npm test`, `npm run typecheck`, `npm run lint` e `npm run build` passaram.

**Ainda não foi feito merge na main**, deploy ou integração ponta a ponta com uma versão implantada do backend. O backend Spring Boot também mantém PRs dependentes pendentes de integração. A Fase 7 usa branches `feature/fase-7-anuncios-localizacao-status` nos dois repositórios.

Nunca versionar `.env.local`, tokens JWT, segredos AWS, dados faciais ou documentos pessoais.

## Segurança de dados e expectativas

- Aprovação documental é **revisão humana**, não consulta oficial ao RENAVAM/SERPRO/SENATRAN.
- A aplicação não intermedeia pagamento nem transferência de propriedade.
- Não existe homologação de produção, deploy ou migração executada neste pacote.
