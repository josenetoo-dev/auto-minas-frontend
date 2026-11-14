const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");

const page = fs.readFileSync("src/app/vender/planos/page.tsx", "utf8");
const flow = fs.readFileSync("src/components/seller-plan-flow.tsx", "utf8");
const login = fs.readFileSync("src/app/login/page.tsx", "utf8");
const authForm = fs.readFileSync("src/components/auth-form.tsx", "utf8");
const intentRoute = fs.readFileSync("src/app/api/commercial/intents/route.ts", "utf8");

test("a missing current contract falls back to the clearly labeled local demo minuta", () => {
  assert.match(page, /currentCommercialContract\(\)\.catch\(\(\) => null\)/);
  assert.match(page, /versao: "1\.0-DEMO"/);
  assert.match(page, /PENDENTE DE REVISÃO JURÍDICA/);
  assert.match(page, /<SellerPlanFlow plan=\{plan\} contract=\{demoContract\} \/>/);
});

test("anonymous users retain the selected plan through login and registration", () => {
  assert.match(page, /\/login\?next=\$\{encodeURIComponent\(`\/vender\/planos\?plano=\$\{plan\.codigo\}`\)\}/);
  assert.match(login, /safeNextPath\(next\)/);
  assert.match(authForm, /\? \{ email, password, next \}/);
  assert.match(authForm, /: \{ name, email, phone, password, next, termsAccepted \}/);
});

test("demonstrative acceptance is local and never calls the backend acceptance route", () => {
  assert.match(flow, /function simulateAcceptance\(\) \{ if \(acknowledged\) setAccepted\(true\); \}/);
  assert.doesNotMatch(flow, /contracts\/\$\{contract\.id\}\/accept/);
  assert.match(flow, /disabled=\{!acknowledged \|\| accepted\}/);
  assert.match(flow, /disabled=\{busy \|\| !!intent \|\| !accepted\}/);
  assert.match(flow, /Nenhum aceite foi persistido e nenhuma assinatura foi ativada/);
});

test("only the existing authenticated intent API is used, with server-side plan validation", () => {
  assert.match(flow, /fetch\("\/api\/commercial\/intents", \{ method: "POST"/);
  assert.match(intentRoute, /\/v1\/assinaturas\/intencoes/);
  assert.match(intentRoute, /\["BASIC", "PROFESSIONAL", "PREMIUM"\]/);
  assert.match(flow, /response\.json\(\)\.catch\(\(\) => \(\{\}\)\)/);
});
