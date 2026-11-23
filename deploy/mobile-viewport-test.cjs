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
async function browserJson(page, url, data) {
  const result=await page.evaluate(async ({url,data})=>{
    const resp=await fetch(url,data===undefined?{cache:"no-store"}:{
      method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(data)
    });
    return {status:resp.status,body:await resp.json().catch(()=>null)};
  },{url,data});
  expect(result.status>=200&&result.status<300,"HTTP "+result.status+" em "+url);
  return result.body;
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
        await page.getByRole("button", { name: "Preferências", exact:true }).click();
        await page.getByRole("dialog", { name:"Preferências de cookies" }).waitFor();
        await page.keyboard.press("Escape");
        await page.getByRole("dialog", { name:"Preferências de cookies" }).waitFor({state:"hidden"});
      }
      await page.getByRole("button", { name: "Aceitar cookies necessários", exact:true }).click();
      await inspect(page, "inicio", width);
      if (width <= 768) {
        // O nome acessível muda de "Abrir menu" para "Fechar menu" após o clique.
        // Um seletor pelo nome antigo deixa de localizar o mesmo botão.
        const menu = page.locator('button[aria-controls="home-mobile-menu"]');
        await menu.waitFor({ state: "visible", timeout: 10000 });
        expect(await menu.getAttribute("aria-expanded") === "false",
          "Menu deveria iniciar fechado em " + width + "px");
        await menu.click();
        const nav = page.locator("#home-mobile-menu");
        await nav.waitFor({ state: "visible", timeout: 10000 });
        expect(await menu.getAttribute("aria-expanded") === "true",
          "Menu não anunciou aria-expanded em " + width + "px");
        await page.keyboard.press("Escape");
        await nav.waitFor({ state: "hidden", timeout: 10000 });
        expect(await menu.getAttribute("aria-expanded") === "false",
          "Escape não atualizou aria-expanded em " + width + "px");
      }
      await page.goto(BASE + "/planos", { waitUntil: "domcontentloaded" });
      await page.getByRole("heading", { name: "Auto Minas PRO", exact: true }).waitFor();
      expect(await page.getByRole("heading", { name: "Anúncio avulso", exact: true }).count() === 0,
        "A oferta antiga não deve aparecer para novas contratações");
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
      await page.getByRole("heading", { name: "Meu Perfil" }).waitFor();
      await inspect(page, "conta", width);
      await page.goto(BASE + "/vender", { waitUntil: "domcontentloaded" });
      await inspect(page, "vender", width);
      await page.goto(BASE + "/meus-anuncios", { waitUntil: "domcontentloaded" });
      await inspect(page, "meus-anuncios", width);
      await page.goto(BASE + "/chat", { waitUntil: "domcontentloaded" });
      await inspect(page, "chat", width);
      const conversation = page.locator(".chat-reference-conversation").first();
      await conversation.click();
      const composer = page.getByRole("textbox", { name: "Mensagem", exact:true });
      await composer.waitFor();
      const composerAboveHotbar = () => page.waitForFunction(() => {
        const input = document.querySelector(".chat-thread-composer textarea");
        const send = document.querySelector(".chat-thread-send");
        const hotbar = document.querySelector(".site-global-hotbar");
        if (!input || !send || !hotbar) return false;
        const navbar = hotbar.getBoundingClientRect();
        if (navbar.height <= 0 || navbar.bottom > window.innerHeight + 1) return false;
        return [input, send].every(element => {
          const box = element.getBoundingClientRect();
          const hit = document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2);
          return box.top >= 0 && box.bottom <= navbar.top + 1 && element.contains(hit);
        });
      }, undefined, { timeout:10000 });
      await composerAboveHotbar();
      const scrollsIndependently = await page.locator(".chat-thread-messages").evaluate(messages => {
        const composer = document.querySelector(".chat-thread-composer");
        const previousTop = composer.getBoundingClientRect().top;
        const filler = document.createElement("div");
        filler.style.height = "1500px";
        messages.append(filler);
        messages.scrollTop = messages.scrollHeight;
        const result = messages.scrollTop > 0 && window.scrollY === 0 &&
          composer.getBoundingClientRect().top === previousTop;
        filler.remove();
        return result;
      });
      expect(scrollsIndependently, "O histórico deve rolar sem mover a caixa de mensagem");
      if (width === 390 || width === 1280) {
        await page.setViewportSize({ width, height: width === 390 ? 360 : 580 });
        await composerAboveHotbar();
        await composer.fill("Mensagem de teste visual");
        expect(await page.getByRole("button", {name:"Enviar mensagem",exact:true}).isEnabled(),
          "O botão de envio deve funcionar sem rolar a tela");
        await composer.fill("");
        await page.setViewportSize({ width, height:790 });
      }
      await inspect(page, "conversa", width);
      if (width === 390) {
        await page.goto(BASE + "/vender");
        const next = page.getByRole("button", {name:"Próxima etapa"});
        await next.click();
        expect(await page.getByLabel(/^Marca \*/).getAttribute("aria-invalid") === "true",
          "Campos obrigatórios pendentes devem ser destacados");
        await page.getByLabel(/^Marca \*/).selectOption("Fiat");
        await page.getByLabel(/^Modelo\s*\*/).fill("Argo");
        await page.getByLabel(/^Ano \*/).selectOption("2024");
        await page.getByLabel(/^Quilometragem\s*\*/).fill("12000");
        await next.click();
        await page.getByLabel(/^Combustível \*/).selectOption("flex");
        await page.getByLabel(/^Câmbio \*/).selectOption("automatico");
        await page.getByLabel(/^Cor\s*\*/).fill("Branco");
        await next.click();
        const file={name:"documento-ficticio.png",mimeType:"image/png",buffer:Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAIAAABLbSncAAAAFElEQVR4nGO8st6cARtgwio6aCUAXZAByo07EaIAAAAASUVORK5CYII=","base64")};
        await page.locator('.sell-photo-step input[type="file"]').setInputFiles({...file,name:"externa.png"});
        await next.click();
        await page.getByRole("alert").filter({hasText:"Adicione pelo menos 2 fotos"}).waitFor();
        await page.locator('.sell-photo-step input[type="file"]').setInputFiles({...file,name:"interna.png"});
        await next.click();
        const price = page.getByLabel("Preço do veículo *", {exact:true});
        await price.fill("6500000");
        expect(/R\$[\s\u00a0]*65\.000,00/.test(await price.inputValue()),"Preço deve usar a máscara de Real");
        await page.getByLabel(/Descrição \*/).fill("Muito curto");
        const history = page.getByRole("group", {name:"Histórico e condições do veículo"});
        for (const answer of await history.getByRole("combobox").all()) await answer.selectOption("NAO");
        await next.click();
        expect(await page.getByLabel(/Descrição \*/).getAttribute("aria-invalid") === "true",
          "A descrição curta precisa ser identificada na etapa 4");
        await page.getByLabel(/Descrição \*/).fill("Veículo fictício para testar formulário e documentos juntos.");
        await next.click();
        await page.getByLabel(/^Estado \*/).selectOption("MG");
        await page.getByLabel(/^Cidade\s*\*/).fill("Pirapora");
        await page.getByLabel("Documento do veículo (CRLV)", {exact:true}).setInputFiles(file);
        await next.click();
        const save = page.waitForResponse(response => response.url().endsWith("/api/cars") &&
          response.request().method() === "POST" && response.status() === 201);
        await page.getByRole("button",{name:"Enviar para análise",exact:true}).click();
        const saved = (await (await save).json()).id;
        await page.getByRole("heading",{name:"Anúncio enviado para verificação!"}).waitFor();
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
        const vehicleReview=card.getByRole("heading",{name:"Documento do veículo (CRLV)",exact:true}).locator("..");
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
        await page.getByText("Veículo verificado",{exact:true}).waitFor();
        await page.getByText("Vendedor analisado · Nível 1",{exact:true}).waitFor();
        await inspect(page,"analises-publicas",width);
        await page.getByRole("button",{name:"Adicionar à comparação"}).click();
        await page.goto(BASE+"/carros");
        const other=await page.locator('a[href^="/carros/"]').evaluateAll((links,savedId)=>
          links.map(link=>link.getAttribute("href")).find(href=>href && href!==`/carros/${savedId}`),saved);
        expect(!!other,"Catálogo de homologação precisa de outro veículo para comparar");
        await page.goto(BASE+other);
        await page.getByRole("button",{name:"Adicionar à comparação"}).click();
        await page.getByRole("link",{name:"Comparar dois veículos"}).click();
        await page.getByRole("heading",{name:"Comparar dois veículos"}).waitFor();
        await page.getByRole("region",{name:"Comparação de dois veículos"}).waitFor();
        await page.getByText("Fiat Argo 2024",{exact:true}).waitFor();
        await inspect(page,"comparador",width);
        await page.goto(BASE+"/carros/"+saved);
        await login(context,"comprador-demo@auto-minas.test",process.env.STAGING_DEMO_BUYER_PASSWORD);
        await page.goto(BASE+"/conta");
        await page.goto(BASE+"/conta/editar");
        await page.locator('.profile-edit-reference-form input[type="file"]').setInputFiles(file);
        await page.getByRole("button",{name:/Salvar alterações/}).click();
        await page.getByText("Perfil atualizado.",{exact:true}).waitFor();
        const photo=page.getByRole("img",{name:"Foto do perfil"});
        await photo.waitFor();
        await photo.evaluate(img=>img.decode());

        const sellerContext=await browser.newContext();
        try {
          await login(sellerContext,"vendedor-demo@auto-minas.test",process.env.STAGING_DEMO_SELLER_PASSWORD);
          const sellerPage=await sellerContext.newPage();
          await sellerPage.goto(BASE+"/conta");
          const shared=await browserJson(sellerPage,"/api/conversations",{
            carId:saved, price:65000,
            message:"Proposta fictícia para o anúncio publicado neste teste.",
            requestId:require("node:crypto").randomUUID(),
          });
          expect(!!shared.id,"A negociação deve apontar para o anúncio real deste teste");
          const unreadURL="/api/backend/v1/proposta/mensagens-nao-lidas";
          await page.bringToFront();
          const baseline=await browserJson(page,unreadURL);
          const initial=baseline[shared.id]??0;
          const poll=page.waitForResponse(r=>r.url().endsWith(unreadURL)&&r.ok());
          await page.goto(BASE+"/");
          await poll;
          await browserJson(sellerPage,"/api/conversations/"+shared.id+"/messages",{
            content:"Mensagem fictícia para validar o aviso de negociação."
          });
          const total = Object.values(baseline).reduce((sum,count) => sum + count, 0) + 1;
          await page.waitForFunction(expected => document.querySelector(".home-notification-dot")?.textContent === expected,
            total > 9 ? "9+" : String(total));
          await page.goto(BASE+"/chat");
          const counts=await browserJson(page,unreadURL);
          expect(counts[shared.id]===initial+1,"Mensagem precisa somar exatamente uma após navegação");
          await page.goto(BASE+"/chat/"+shared.id);
          await page.getByText("Mensagem fictícia para validar o aviso de negociação.",{exact:true}).waitFor();
          await page.waitForFunction(async url=>{
            const counts=await (await fetch(url,{cache:"no-store"})).json();
            return !counts[Number(location.pathname.split("/").pop())];
          },unreadURL,{timeout:20000});
          await page.reload();
          const persisted=await browserJson(page,unreadURL);
          expect(!persisted[shared.id],"Mensagem já visualizada voltou a contar");
        } finally {await sellerContext.close();}
        await login(context,"admin-demo@auto-minas.test",process.env.STAGING_DEMO_ADMIN_PASSWORD);
        await page.goto(BASE+"/moderacao/privacidade");
        const privacyCard=page.getByRole("heading",{name:/AM-DADOS-/}).first().locator("..");
        await privacyCard.getByLabel("Etapa do atendimento").selectOption("AGUARDANDO_TITULAR");
        const publicReply="Informe pela conta os detalhes necessários para atender este pedido fictício.";
        await privacyCard.getByLabel("Resposta visível ao titular").fill(publicReply);
        await privacyCard.getByRole("button",{name:"Registrar atendimento",exact:true}).click();
        await page.getByText("Atendimento registrado. A resposta está disponível na conta do titular.",{exact:true}).waitFor();
        await privacyCard.getByRole("button",{name:"Ver histórico do atendimento",exact:true}).click();
        await privacyCard.locator("pre").waitFor();
        expect((await privacyCard.locator("pre").textContent()).includes("AGUARDANDO_TITULAR"),"Histórico administrativo ausente");
        await inspect(page,"privacidade-administracao",width);
        await login(context,"comprador-demo@auto-minas.test",process.env.STAGING_DEMO_BUYER_PASSWORD);
        await page.goto(BASE+"/privacidade/solicitacoes");
        await page.getByText(publicReply,{exact:true}).waitFor();
        await page.getByText("Aguardando suas informações",{exact:true}).waitFor();
        expect(await page.getByText(/AM-DADOS-/).count() === 0,"O protocolo interno deve ficar fora da tela do titular");
        await inspect(page,"privacidade-titular",width);
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
    await signupPage.goto(BASE + "/vender");
    await signupPage.getByRole("button", { name: "Aceitar cookies necessários", exact:true }).click();
    await signupPage.getByRole("button", { name: "Criar conta", exact: true }).click();
    await signupPage.getByLabel("Nome completo", { exact: true }).fill("Pessoa fictícia de teste");
    await signupPage.getByLabel("Telefone", {exact:true}).fill("38000000000");
    const signupEmail = `cadastro-${Date.now()}@auto-minas.test`;
    await signupPage.getByLabel("E-mail", { exact: true }).fill(signupEmail);
    await signupPage.locator("#password").fill("Senha-ficticia-CI-2026!");
    await signupPage.locator("#confirmPassword").fill("Senha-ficticia-CI-2026!");
    await signupPage.getByRole("checkbox", { name: /Li e concordo/ }).check();
    await signupPage.getByRole("button", { name: "Criar conta", exact: true }).click();
    await signupPage.waitForURL(BASE + "/");
    await signupPage.getByRole("link", { name: "Negociações", exact:true }).waitFor();
    const sessionCookie = (await signupContext.cookies()).find(cookie => cookie.name === "auto_minas_access");
    expect(sessionCookie?.httpOnly && sessionCookie?.secure, "Cadastro deve criar sessão Secure e HttpOnly");
    await signupPage.goto(BASE + "/conta");
    await signupPage.getByRole("heading", { name: "Pessoa fictícia de teste" }).waitFor();
    await signupPage.getByText("E-mail pendente de verificação", { exact: true }).waitFor();
    await inspect(signupPage, "cadastro-conectado", 390);
    const logout = await signupContext.request.post(BASE + "/api/auth/logout");
    expect(logout.ok(), "Logout falhou");
    await signupPage.goto(BASE + "/conta");
    await signupPage.waitForURL(/\/login/);
    await signupPage.getByLabel("E-mail", {exact:true}).fill(signupEmail);
    await signupPage.getByLabel("Senha", {exact:true}).fill("senha-incorreta123");
    await signupPage.getByRole("button", {name:"Entrar",exact:true}).click();
    await signupPage.getByRole("alert").filter({hasText:/credenciais inválidas/i}).waitFor();
    expect(new URL(signupPage.url()).pathname === "/login", "Credenciais inválidas devem manter o login");
    await signupPage.getByLabel("Senha", {exact:true}).fill("Senha-ficticia-CI-2026!");
    await signupPage.getByRole("button", {name:"Entrar",exact:true}).click();
    await signupPage.waitForURL(BASE + "/");
    await signupPage.getByRole("link", {name:"Negociações",exact:true}).waitFor();
    await signupPage.goto(BASE + "/login");
    await signupPage.waitForURL(BASE + "/");
    await signupPage.getByRole("region", {name:"Aviso de cookies"}).waitFor({state:"hidden"});
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
