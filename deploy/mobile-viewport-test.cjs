/**
 * Homologação visual automática em Chromium, nos viewports mais comuns.
 * Lê somente contas fictícias do banco descartável da CI.
 * Não usa AWS, documento real ou hospedagem externa.
 */
const { chromium } = require("playwright");
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
  return result;
}

async function main() {
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
      await page.goto(BASE + "/", { waitUntil: "domcontentloaded" });
      await inspect(page, "inicio", width);
      if (width <= 768) {
        const menu = page.getByRole("button", { name: "Abrir menu" });
        expect(await menu.isVisible(), "Menu ausente em " + width + "px");
        await menu.click();
        const nav = page.locator("#auto-minas-mobile-menu");
        expect(await nav.isVisible(), "Menu não abriu em " + width + "px");
        expect(await menu.getAttribute("aria-expanded") === "true",
          "Menu não anunciou aria-expanded em " + width + "px");
        await page.keyboard.press("Escape");
        expect(!(await nav.isVisible()), "Escape não fechou o menu");
      }
      await page.goto(BASE + "/carros", { waitUntil: "domcontentloaded" });
      await inspect(page, "carros", width);
      if (width <= 390) {
        await page.getByRole("button", { name: /Filtros/ }).click();
        expect(await page.getByLabel("Cidade").isVisible(), "Campo cidade indisponível no celular");
        await inspect(page, "filtros-abertos", width);
      }
      await login(context, "comprador-demo@auto-minas.test",
        process.env.STAGING_DEMO_BUYER_PASSWORD);
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
          await inspect(page, "conversa", width);
        }
      }
      await context.close();
    }
    console.log("Responsividade: telas de 320, 360, 390, 768, 1024 e 1280px sem overflow; menu, filtros, formulário e chat verificados.");
  } finally {
    await browser.close();
  }
}
main().catch(err => {
  console.error("Falha de responsividade:", err.message);
  process.exitCode = 1;
});
