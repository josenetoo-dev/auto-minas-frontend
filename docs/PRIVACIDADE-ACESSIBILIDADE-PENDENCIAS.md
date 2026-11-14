# Privacidade e acessibilidade — revisão técnica de 14/11/2026

O ambiente permanece demonstrativo. As páginas têm versão `2026-11-14-demo-v1`. Este levantamento técnico não certifica conformidade jurídica integral nem acessibilidade em todos os dispositivos e tecnologias assistivas.

## Implementação

- Cadastro cria sessão e abre a página inicial por navegação completa. Login mantém o destino interno solicitado.
- Checkbox de termos e ciência de privacidade separados de cookies opcionais. Backend exige aceite e registra versões e data. Contas antigas não recebem aceite retroativo.
- Apenas cookie de sessão necessário e preferência local por até 180 dias. Sem Analytics ou pixels configurados. Opcionais permanecem desligados e não existe botão de aceitar rastreamento inexistente. Futuras categorias exigirão nova versão, escolhas por finalidade e revogação.
- Fontes externas Google removidas. Banners de IA e assets removidos.
- Páginas de privacidade, termos, cookies, cancelamento/reembolso e identificação. `LEGAL_ENTITY_NAME`, `LEGAL_REGISTRATION`, `LEGAL_ADDRESS`, `LEGAL_CONTACT_EMAIL` exibem os dados quando fornecidos, sem inventar empresa ou contato.
- Pedido autenticado de exclusão com protocolo, idempotência e listagem privada. ADMIN ativo consulta a fila. Eliminação material e resposta permanecem manuais.
- CTA mobile, reserva de espaço e afastamento do aviso de cookies. Cards compactos no catálogo mobile.
- Link de salto, foco visível, diálogo nativo de cookies, Escape com retorno de foco no menu, labels, alt e contraste revistos. CI usa axe nas páginas selecionadas e testa teclado, largura e cadastro.
- Chat aceita JPEG/PNG até 4 MiB no BFF para respeitar o limite de requisição da Vercel. Trata 413/resposta não JSON. Backend valida assinatura, dimensões e remove metadados.
- Logs Railway comprovaram `AccessDeniedException` ao criar o diretório privado no volume. Novo entrypoint inicializa os diretórios e ajusta seus donos, depois executa o Java com UID/GID 10001. O processo da aplicação não permanece como root.

## Pendências do responsável

1. Identificar fornecedor/controlador, documento cadastral, endereço e canal oficial de privacidade/atendimento. Não publicar CPF pessoal por suposição.
2. Revisão jurídica das páginas e das relações de consumo, termos comerciais e contestação.
3. Matriz de retenção, preservação de provas, anonimização/descarte e backups. Procedimento de execução e resposta aos pedidos, inclusive titulares sem acesso à conta.
4. Contratos com operadores e mecanismos válidos de transferência internacional. Vercel/Railway podem processar fora do Brasil.
5. Responsável por privacidade, avaliação do encarregado e eventual enquadramento de pequeno porte conforme o caso.
6. Preço, duração e limites do avulso e mensal; renovação, cancelamento, gateway e estorno homologado antes de cobrar.
7. SMTP. Conta AWS, credenciais temporárias, base legal e homologação da captura antes de ativar biometria.
8. Se desejar Analytics, fornecer Measurement ID e definir finalidade, retenção e transferência; implementar categorias/consentimento antes de carregar o novo script.
9. Testes manuais de teclado, leitor de tela, zoom, reflow e conteúdo real. Automação cobre somente os fluxos e páginas verificados.
10. Monitoramento e procedimento de incidentes, incluindo comunicação aplicável.

## Fontes primárias e normas consideradas

- LGPD, Lei 13.709/2018, especialmente arts. 6–11, 16, 18–19, 33 e 46. Aceite de termos não é base genérica para todos os tratamentos; biometria exige tratamento próprio de dado sensível.
  https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm
- ANPD, Guia Orientativo Cookies e Proteção de Dados Pessoais. Escolhas reais, rejeição acessível e revogação simples.
  https://www.gov.br/anpd/pt-br/centrais-de-conteudo/materiais-educativos-e-publicacoes/guia_orientativo_cookies_e_protecao_de_dados_pessoais
- CDC, Lei 8.078/1990, arts. 6, 30–31, 46, 49 e 51. Arrependimento de sete dias nas hipóteses aplicáveis, sem inventar exceção por consumo digital.
  https://www.planalto.gov.br/ccivil_03/leis/l8078compilado.htm
- Decreto 7.962/2013. Identificação do fornecedor, oferta clara, atendimento e arrependimento no comércio eletrônico.
  https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2013/decreto/d7962.htm
- LBI, Lei 13.146/2015, art. 63. WCAG é referência técnica para implementação e testes.
  https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2015/lei/l13146.htm
- Marco Civil, Lei 12.965/2014. Avaliar obrigações de registros conforme atividade e enquadramento; não aplicar retenção indiscriminada.
  https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2014/lei/l12965.htm
- ANPD, Resolução 19/2024, transferências internacionais.
  https://www.gov.br/anpd/pt-br/assuntos/assuntos-internacionais/transferencia-internacional-de-dados
