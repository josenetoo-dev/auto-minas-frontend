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
      await page.getByRole("link", { name: /Preparar meu anúncio/ }).click();
      await page.waitForURL("**/login?**");
      expect(new URL(page.url()).searchParams.get("next") === "/vender?modalidade=avulso",
        "A modalidade avulsa deve ser preservada ao entrar ou criar conta");
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
    await signupPage.getByLabel("E-mail", { exact: true }).fill(`cadastro-${Date.now()}@auto-minas.test`);
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
