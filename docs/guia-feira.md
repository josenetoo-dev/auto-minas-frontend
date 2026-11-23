# Auto Minas — guia honesto para a feira

## Em uma frase

Marketplace de veículos com anúncios sujeitos a revisão humana, negociação por propostas e recomendações. O ambiente da feira usa catálogo DEMO; esses carros não estão à venda.

## Como o sistema funciona

1. **Navegador → Next.js (Vercel).** A interface exibe catálogo, conta, anúncios, mensagens e painel da equipe. Rotas internas do frontend encaminham operações autenticadas à API; o token de sessão fica em cookie HttpOnly.
2. **Next.js → API Java (Railway).** Spring Security valida a sessão e permissões. As regras de titularidade, moderação e elegibilidade comercial são aplicadas no backend.
3. **API → MySQL.** Spring Data e consultas específicas guardam contas, anúncios, fotos, verificações, conversas e sinais de recomendação. Flyway versiona mudanças de estrutura sem apagar dados existentes.
4. **Documentos privados.** Evidências de verificação têm acesso restrito à equipe autorizada. A revisão humana pode aprovar, pedir correção ou rejeitar; anúncio pendente não vira oferta pública por autodeclaração.

## Roteiro curto

1. Abrir `/feira`, depois `/carros`. Mostrar o rótulo DEMO e filtrar o catálogo.
2. Abrir um detalhe, ver semelhantes DEMO e comparar dois carros. Explicar que comparação de DEMO não gera proposta.
3. Mostrar `/planos`: publicação gratuita e oferta PRO sem preço nem cobrança ativa. Pagamento jamais concede confiança.
4. Com contas **de teste** da equipe, demonstrar anúncio pendente, moderação, correção documental e conversa preexistente. Não usar identidade ou documentos reais de visitantes.
5. Explicar denúncia e checklist de encontro seguro. Não prometer ausência de golpes.

## Permissões e limites

- Comprador consulta o catálogo e negocia anúncios reais elegíveis; vendedor administra os próprios anúncios; moderador/admin revê evidências e denúncias conforme o papel.
- A Home usa ranking e fallback para quem não tem histórico. Destaque pago exige assinatura vigente e pagamento confirmado; sem preço aprovado, novas contratações ficam indisponíveis.
- O limitador inicial usa janelas no MySQL e responde 429 com `Retry-After`; a proteção antiabuso ainda é parcial.
- Níveis 1 a 4, métricas PRO, alertas de preço, detecção de imagens e preços suspeitos **não estão completos**. Nunca apresentar essas funções como prontas.
- O catálogo DEMO é ilustrativo. Uma publicação comercial só pode usar veículo e documentos verdadeiros, com revisão apropriada.
