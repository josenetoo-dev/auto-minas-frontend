# Auto Minas — Backlog do redesign

> Atualizado em 17/11/2026. Esta fase redesenha apenas rotas e funcionalidades já existentes no frontend. As telas abaixo aparecem nas referências visuais mobile, mas **não devem ser implementadas nesta etapa**.

## Fora do escopo atual

| Tela / recurso | Estado atual | Direção futura |
|---|---|---|
| Favoritos | Não existe rota/fluxo dedicado | Criar `/favoritos` quando houver persistência e endpoints definidos |
| Comparador de veículos | Não existe | Criar `/comparar` com seleção persistente e comparação por atributos |
| Configurações | Não existe área dedicada | Criar `/configuracoes` quando houver preferências reais a configurar |
| Notificações | Não existe central própria | Criar `/notificacoes` quando houver fonte de eventos/estado de leitura |
| Pagamentos | Não existe fluxo operacional | Criar `/pagamentos` apenas após integração real com provedor e backend |
| Questionário inteligente | Não existe no frontend atual | Criar após contrato de API e regra de recomendação estarem estáveis |
| Recomendações personalizadas | Não existe rota dedicada no frontend atual | Integrar somente quando o backend de recomendações estiver exposto e validado |
| Central de ajuda | Não existe rota dedicada | Criar conteúdo e fluxo de suporte posteriormente |
| Negociações avançadas | O chat existe; não há tela extra além dele | Evoluir sobre o fluxo atual de `/chat` sem duplicar conversas |

## Regras desta fase

- Manter a identidade visual **preta e dourada** atual.
- Usar as telas mobile de referência para hierarquia, composição e UX, não para copiar a paleta vermelha.
- Projetar **mobile e desktop simultaneamente**.
- Não criar páginas vazias apenas para "bater" com a referência.
- Não alterar contratos de API, autenticação, regras comerciais ou dados de negócio por motivo puramente visual.
- Preferir componentes compartilhados a telas independentes duplicadas.

## Rotas existentes cobertas pelo redesign

- `/`
- `/login`
- `/recuperar-senha`
- `/carros`
- `/carros/[id]`
- `/vender`
- `/vender/editar/[id]`
- `/vender/planos`
- `/meus-anuncios`
- `/chat`
- `/chat/[id]`
- `/conta`
- `/perfil/[id]`
- `/verificacoes`
- `/planos`
- `/assinatura`

Rotas administrativas, legais e de homologação permanecem funcionais, mas não são guiadas pelas referências mobile fornecidas.
