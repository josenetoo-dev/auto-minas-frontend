/**
 * Homologação visual automática em Chromium, nos viewports mais comuns.
 * Lê somente contas fictícias do banco descartável da CI.
 * Não usa AWS, documento real ou hospedagem externa.
 */
const { chromium } = require("playwright");
const AxeBuilder = require("@axe-core/playwright").default;
const fs = require("node:fs");
const path = require("node:path");

const BASE = process.env.STAGING_SMOKE_URL || "http://127.0.0.1:3000";
const CAPTURES = path.resolve(process.cwd(), "mobile-screenshots");

function expect(ok, reason) {
  if (!ok) throw new Error(reason);
}
async function login(context, email, password) {
  const res = await context.request.post(BASE + "/api/auth/login", {
    headers: { origin: BASE },
    data: { email, password },
  });
  expect(res.status() === 200, "Login de homologação: HTTP " + res.status());
}
async function inspect(page, label, width) {
  await page.waitForLoadState("domcontentloaded");
  await page.waitForTimeout(350);
  const result = await page.evaluate(() => {
    const root = document.documentElement;
    return {
      width: window.innerWidth,
      document: root.scrollWidth,
      body: document.body.scrollWidth,
    };
  });
  fs.mkdirSync(CAPTURES, { recursive: true });
  await page.screenshot({
    path: path.join(CAPTURES, label + "-" + width + ".png"),
    fullPage: false,
    animations: "disabled",
  });
  expect(result.document <= result.width + 1,
    label + " " + width + "px: overflow horizontal " + JSON.stringify(result));
  if ([390,1280].includes(width) && ["inicio","modalidades","conta"].includes(label)) {
    const report=await new AxeBuilder({page}).withTags(["wcag2a","wcag2aa","wcag21aa","wcag22aa"]).analyze();
    expect(report.violations.length===0,"Acessibilidade "+label+" "+width+": "+JSON.stringify(report.violations.map(item=>({id:item.id,nodes:item.nodes.map(node=>({target:node.target,reason:node.failureSummary}))}))));
  }
  return result;
}

async function main() {
  if (process.env.GITHUB_ACTIONS !== "true") {
    throw new Error("O cadastro fictício de teste só pode executar na CI descartável.");
  }
  const browser = await chromium.launch({ headless: true });
  try {
    for (const width of [320, 360, 390, 768, 1024, 1280]) {
      const context = await browser.newContext({
        viewport: { width, height: 790 },
        deviceScaleFactor: 1,
        isMobile: width <= 390,
        hasTouch: width <= 390,
      });
      const page = await context.newPage();
      console.log("Validando responsividade: " + width + "px");
      await page.goto(BASE + "/", { waitUntil: "domcontentloaded" });
      if (width === 390) {
        await page.keyboard.press("Tab");
        expect(await page.evaluate(() => document.activeElement?.getAttribute("href")) === "#conteudo-principal", "O primeiro Tab deve oferecer salto ao conteúdo");
        await page.keyboard.press("Enter");
        expect(await page.evaluate(() => document.activeElement?.id) === "conteudo-principal", "O salto deve mover o foco para o conteúdo");
        await page.getByRole("button", { name: "Personalizar", exact:true }).click();
        await page.getByRole("dialog", { name:"Preferências de cookies" }).waitFor();
        await page.keyboard.press("Escape");
        await page.getByRole("dialog", { name:"Preferências de cookies" }).waitFor({state:"hidden"});
      }
      await page.getByRole("button", { name: "Somente necessários", exact:true }).click();
      await inspect(page, "inicio", width);
      if (width <= 768) {
        // O nome acessível muda de "Abrir menu" para "Fechar menu" após o clique.
        // Um seletor pelo nome antigo deixa de localizar o mesmo botão.
        const menu = page.locator('button[aria-controls="auto-minas-mobile-menu"]');
        await menu.waitFor({ state: "visible", timeout: 10000 });
        expect(await menu.getAttribute("aria-expanded") === "false",
          "Menu deveria iniciar fechado em " + width + "px");
        await menu.click();
        const nav = page.locator("#auto-minas-mobile-menu");
        await nav.waitFor({ state: "visible", timeout: 10000 });
        expect(await menu.getAttribute("aria-expanded") === "true",
          "Menu não anunciou aria-expanded em " + width + "px");
        await page.keyboard.press("Escape");
        await nav.waitFor({ state: "hidden", timeout: 10000 });
        expect(await menu.getAttribute("aria-expanded") === "false",
          "Escape não atualizou aria-expanded em " + width + "px");
      }
      await page.goto(BASE + "/planos", { waitUntil: "domcontentloaded" });
      await page.getByRole("heading", { name: "Anúncio avulso", exact: true }).waitFor();
      await page.getByRole("heading", { name: "Assinatura mensal", exact: true }).waitFor();
      await inspect(page, "modalidades", width);
      await page.goto(BASE + "/feira", { waitUntil: "domcontentloaded" });
      await page.getByRole("heading", { name: /Conheça o Auto Minas/ }).waitFor({ state: "visible" });
      await inspect(page, "roteiro-feira", width);
      await page.goto(BASE + "/carros", { waitUntil: "domcontentloaded" });
      await inspect(page, "carros", width);
      if (width <= 390) {
        await page.getByRole("button", { name: /Filtros/ }).click();
        expect(await page.getByLabel("Cidade").isVisible(), "Campo cidade indisponível no celular");
        await inspect(page, "filtros-abertos", width);
      }
      await login(context, "comprador-demo@auto-minas.test",
        process.env.STAGING_DEMO_BUYER_PASSWORD);
      await page.goto(BASE + "/conta", { waitUntil: "domcontentloaded" });
      await page.getByRole("heading", { name: /Olá,/ }).waitFor();
      await inspect(page, "conta", width);
      await page.goto(BASE + "/vender", { waitUntil: "domcontentloaded" });
      await inspect(page, "vender", width);
      await page.goto(BASE + "/meus-anuncios", { waitUntil: "domcontentloaded" });
      await inspect(page, "meus-anuncios", width);
      await page.goto(BASE + "/chat", { waitUntil: "domcontentloaded" });
      await inspect(page, "chat", width);
      if (width <= 390) {
        const conversation = page.locator("aside button").first();
        if (await conversation.count()) {
          await conversation.click();
          const composer = page.getByRole("textbox", { name: "Mensagem para negociação" });
          await composer.waitFor({ state: "visible", timeout: 10000 });
          expect(await composer.isVisible(), "Compositor do chat inacessível no celular");
          await page.waitForFunction(() => {
            const box = document.querySelector('[aria-label="Mensagem para negociação"]')?.getBoundingClientRect();
            return box && box.top >= 0 && box.bottom <= window.innerHeight;
          }, {timeout:10000});
          await inspect(page, "conversa", width);
        }
      }
      if (width === 390) {
        await page.goto(BASE + "/vender");
        await page.getByLabel("Marca *", {exact:true}).selectOption("Fiat");
        await page.getByLabel("Modelo *", {exact:true}).fill("Argo");
        await page.getByLabel("Ano *", {exact:true}).fill("2024");
        await page.getByLabel("Quilometragem *", {exact:true}).fill("12000");
        await page.getByLabel("Cor *", {exact:true}).fill("Branco");
        await page.getByLabel("Cidade onde está o veículo *", {exact:true}).fill("Pirapora");
        await page.getByLabel("Combustível *", {exact:true}).selectOption("flex");
        await page.getByLabel("Câmbio *", {exact:true}).selectOption("automatico");
        await page.getByLabel("Preço em reais (R$) *", {exact:true}).fill("65000");
        await page.getByLabel("Descrição * (até 255 caracteres)", {exact:true}).fill("Veículo fictício para testar formulário e documentos juntos.");
        const file={name:"documento-ficticio.png",mimeType:"image/png",buffer:Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAIAAABLbSncAAAAFElEQVR4nGO8st6cARtgwio6aCUAXZAByo07EaIAAAAASUVORK5CYII=","base64")};
        await page.getByLabel("Selecionar fotos JPG/PNG", {exact:true}).setInputFiles(file);
        await page.getByLabel("Documento do veículo (CRLV)", {exact:true}).setInputFiles(file);
        await page.getByRole("button",{name:"Enviar anúncio e documentos",exact:true}).click();
        await page.waitForURL(/\/meus-anuncios\?salvo=/);
        const saved=new URL(page.url()).searchParams.get("salvo");
        await page.goto(BASE + "/verificacoes?anuncio="+saved);
        await page.getByLabel("Escolha seu veículo",{exact:true}).waitFor();
        await page.getByText("Documento em análise",{exact:true}).waitFor();
        expect(await page.getByLabel(/ID do veículo/).count() === 0,"Documento não deve pedir chave do banco");
        await inspect(page,"documentos",width);
        await login(context,"admin-demo@auto-minas.test",process.env.STAGING_DEMO_ADMIN_PASSWORD);
        await page.goto(BASE + "/moderacao");
        const card=page.getByRole("heading",{name:"Fiat Argo 2024",exact:true}).locator("..");
        await card.getByRole("button",{name:"Analisar documentos deste anúncio",exact:true}).click();
        await card.getByRole("button",{name:"Abrir documento do veículo",exact:true}).click();
        await page.getByRole("dialog",{name:"Documento privado para análise"}).waitFor();
        await inspect(page,"moderacao-documentos",width);
        await page.getByRole("button",{name:"Fechar documento",exact:true}).click();
        const vehicleReview=card.getByRole("heading",{name:"Documento do veículo",exact:true}).locator("..");
        await vehicleReview.getByLabel("Justificativa para correção ou reavaliação").fill("Documento ilegível: envie uma nova foto do CRLV.");
        await vehicleReview.getByRole("button",{name:"Solicitar correção",exact:true}).click();
        await card.getByText("Correção necessária",{exact:true}).first().waitFor();
        await vehicleReview.getByRole("button",{name:"Consultar histórico de decisões",exact:true}).click();
        await vehicleReview.getByRole("list",{name:"Histórico de decisões"}).waitFor();
        await inspect(page,"moderacao-correcao",width);
        await login(context,"comprador-demo@auto-minas.test",process.env.STAGING_DEMO_BUYER_PASSWORD);
        await page.goto(BASE+"/verificacoes?anuncio="+saved);
        await page.getByText("Documento ilegível: envie uma nova foto do CRLV.",{exact:true}).waitFor();
        await page.getByLabel("Documento do veículo (CRLV)",{exact:true}).setInputFiles(file);
        await page.getByRole("button",{name:"Enviar documentos para análise",exact:true}).click();
        await page.getByText("Documentos enviados para análise.",{exact:true}).waitFor();
        await page.getByText("Documento em análise",{exact:true}).waitFor();
        await login(context,"admin-demo@auto-minas.test",process.env.STAGING_DEMO_ADMIN_PASSWORD);
        await page.goto(BASE+"/moderacao");
        const correctedCard=page.getByRole("heading",{name:"Fiat Argo 2024",exact:true}).locator("..");
        await correctedCard.getByRole("button",{name:"Analisar documentos deste anúncio",exact:true}).click();
        await correctedCard.getByRole("button",{name:"Aprovar documento do veículo após conferir",exact:true}).click();
        await correctedCard.getByRole("checkbox").check();
        await correctedCard.getByRole("button",{name:"Publicar anúncio",exact:true}).click();
        await page.getByText("Anúncio publicado.",{exact:true}).waitFor();
        await page.goto(BASE+"/carros/"+saved);
        const summary=page.getByRole("region",{name:"Análises do vendedor e do veículo"});
        await summary.getByRole("heading",{name:"O que foi analisado",exact:true}).waitFor();
        const reviewTexts=await summary.locator("dd").allTextContents();
        expect(reviewTexts.length===2&&reviewTexts.every(text=>text.includes("Análise documental manual concluída")),
          "Vendedor e veículo precisam de resultados separados e reais: "+JSON.stringify(reviewTexts));
        await inspect(page,"analises-publicas",width);
        await page.goto(BASE+"/moderacao");
        const toReject=page.getByRole("heading",{name:"Fiat Pulse 2023",exact:true}).locator("..");
        const reason="Corrija a descrição do veículo para uma nova análise.";
        await toReject.getByLabel("Motivo da rejeição enviado ao anunciante").fill(reason);
        await toReject.getByRole("button",{name:"Rejeitar anúncio",exact:true}).click();
        await page.getByText("Decisão registrada e auditada.",{exact:true}).waitFor();
        await login(context,"comprador-demo@auto-minas.test",process.env.STAGING_DEMO_BUYER_PASSWORD);
        await page.goto(BASE+"/meus-anuncios");
        await page.getByText("Motivo da rejeição: "+reason,{exact:true}).waitFor();
        await page.goto(BASE+"/conta");
        await page.getByLabel("Foto pública do perfil").setInputFiles(file);
        await page.getByRole("button",{name:"Salvar foto"}).click();
        await page.getByText("Foto pública atualizada.",{exact:true}).waitFor();
        await page.getByRole("link",{name:"Ver meu perfil"}).click();
        await page.getByText("Nível 1 · Revisão documental concluída",{exact:true}).waitFor();
        const photo=page.getByRole("img",{name:/^Foto de /});
        await photo.waitFor();
        await photo.evaluate(img=>img.decode());

        const summaries=await (await context.request.get(BASE+"/api/conversations")).json();
        const conversation=summaries.conversations.find(item=>item.other.name && item.id);
        expect(!!conversation,"Negociação fictícia ausente");
        const sellerContext=await browser.newContext();
        try {
          await login(sellerContext,"vendedor-demo@auto-minas.test",process.env.STAGING_DEMO_SELLER_PASSWORD);
          const sellerConversations=await (await sellerContext.request.get(BASE+"/api/conversations")).json();
          const shared=sellerConversations.conversations.find(item=>summaries.conversations.some(b=>b.id===item.id));
          expect(!!shared,"Comprador e vendedor precisam negociar o mesmo anúncio");
          const unreadURL="/api/backend/v1/proposta/mensagens-nao-lidas";
          const baseline=await (await context.request.get(BASE+unreadURL)).json();
          const initial=baseline[shared.id]??0;
          const poll=page.waitForResponse(r=>r.url().endsWith(unreadURL)&&r.ok());
          await page.goto(BASE+"/conta");
          await poll;
          const sent=await sellerContext.request.post(BASE+"/api/conversations/"+shared.id+"/messages",{
            data:{content:"Mensagem fictícia para validar o aviso de negociação."}
          });
          expect(sent.ok(),"Envio do vendedor falhou");
          await page.getByText(/Você recebeu uma nova mensagem/).waitFor({timeout:20000});
          await page.goto(BASE+"/chat");
          const counts=await (await context.request.get(BASE+unreadURL)).json();
          expect(counts[shared.id]===initial+1,"Mensagem precisa somar exatamente uma após navegação");
          await page.goto(BASE+"/chat/"+shared.id);
          await page.getByText("Mensagem fictícia para validar o aviso de negociação.",{exact:true}).waitFor();
          await page.waitForFunction(async url=>{
            const counts=await (await fetch(url,{cache:"no-store"})).json();
            return !counts[Number(location.pathname.split("/").pop())];
          },unreadURL,{timeout:20000});
          await page.reload();
          const persisted=await (await context.request.get(BASE+unreadURL)).json();
          expect(!persisted[shared.id],"Mensagem já visualizada voltou a contar");
        } finally {await sellerContext.close();}
      }
      if (width === 1280) {
        for (const path of ["/privacidade","/termos","/cookies","/reembolsos","/legal"]) {
          await page.goto(BASE + path);
          await page.getByRole("heading", {level:1}).waitFor();
          const report=await new AxeBuilder({page}).withTags(["wcag2a","wcag2aa","wcag21aa","wcag22aa"]).analyze();
          expect(report.violations.length===0,"Acessibilidade "+path+": "+JSON.stringify(report.violations.map(item=>({id:item.id,nodes:item.nodes.map(node=>node.target)}))));
        }
      }
      await context.close();
    }
    const signupContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const signupPage = await signupContext.newPage();
    await signupPage.goto(BASE + "/vender?modalidade=avulso");
    await signupPage.getByRole("button", { name: "Somente necessários", exact:true }).click();
    await signupPage.getByRole("button", { name: "Criar conta", exact: true }).click();
    await signupPage.getByLabel("Nome completo", { exact: true }).fill("Pessoa fictícia de teste");
    await signupPage.getByLabel(/Telefone com DDD/).fill("38000000000");
    const signupEmail = `cadastro-${Date.now()}@auto-minas.test`;
    await signupPage.getByLabel("E-mail", { exact: true }).fill(signupEmail);
    await signupPage.getByLabel("Senha", { exact: true }).fill("Senha-ficticia-CI-2026!");
    await signupPage.getByRole("checkbox", { name: /Li e concordo/ }).check();
    await signupPage.getByRole("button", { name: "Criar conta e entrar", exact: true }).click();
    await signupPage.waitForURL(BASE + "/");
    await signupPage.getByRole("button", { name: "Abrir menu da conta", exact:true }).waitFor();
    const sessionCookie = (await signupContext.cookies()).find(cookie => cookie.name === "auto_minas_access");
    expect(sessionCookie?.httpOnly && sessionCookie?.secure, "Cadastro deve criar sessão Secure e HttpOnly");
    await signupPage.goto(BASE + "/conta");
    await signupPage.getByRole("heading", { name: "Olá, Pessoa." }).waitFor();
    await signupPage.getByText("E-mail pendente de confirmação", { exact: true }).waitFor();
    await inspect(signupPage, "cadastro-conectado", 390);
    const logout = await signupContext.request.post(BASE + "/api/auth/logout");
    expect(logout.ok(), "Logout falhou");
    await signupPage.goto(BASE + "/conta");
    await signupPage.waitForURL(/\/login/);
    await signupPage.getByLabel("E-mail", {exact:true}).fill(signupEmail);
    await signupPage.getByLabel("Senha", {exact:true}).fill("senha-incorreta123");
    await signupPage.getByRole("button", {name:"Entrar na minha conta",exact:true}).click();
    await signupPage.getByText("Credenciais inválidas", {exact:true}).waitFor();
    expect(new URL(signupPage.url()).pathname === "/login", "Credenciais inválidas devem manter o login");
    await signupPage.getByLabel("Senha", {exact:true}).fill("Senha-ficticia-CI-2026!");
    await signupPage.getByRole("button", {name:"Entrar na minha conta",exact:true}).click();
    await signupPage.waitForURL(BASE + "/");
    await signupPage.getByRole("button", {name:"Abrir menu da conta",exact:true}).waitFor();
    await signupPage.goto(BASE + "/login");
    await signupPage.waitForURL(BASE + "/");
    expect(await signupPage.getByRole("region", {name:"Aviso de cookies"}).count() === 0, "Preferência de cookies não persistiu");
    await signupContext.close();
    console.log("Cadastro pela interface abriu a home autenticada; painel confirmou e-mail pendente.");
    console.log("Responsividade: telas de 320, 360, 390, 768, 1024 e 1280px sem overflow; menu, filtros, formulário e chat verificados.");
  } finally {
    await browser.close();
  }
}
main().catch(err => {
  console.error("Falha de responsividade:", err.message);
  process.exitCode = 1;
});
