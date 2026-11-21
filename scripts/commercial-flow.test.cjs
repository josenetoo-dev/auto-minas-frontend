const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");

const page = fs.readFileSync("src/app/vender/planos/page.tsx", "utf8");
const flow = fs.readFileSync("src/components/seller-plan-flow.tsx", "utf8");
const login = fs.readFileSync("src/app/login/page.tsx", "utf8");
const authForm = fs.readFileSync("src/components/auth-form.tsx", "utf8");
const intentRoute = fs.readFileSync("src/app/api/commercial/intents/route.ts", "utf8");

test("requesting a plan never displays a sample contract", () => {
  assert.doesNotMatch(page + flow, /1\.0-DEMO|minuta demonstrativa|hashSha256/i);
  assert.match(page, /<SellerPlanFlow plan=\{plan\} \/>/);
});

test("anonymous users retain the selected plan through login and registration", () => {
  assert.match(page, /\/login\?next=\$\{encodeURIComponent\(`\/vender\/planos\?plano=\$\{plan\.codigo\}`\)\}/);
  assert.match(login, /safeNextPath\(next\)/);
  assert.match(authForm, /\? \{ email, password, next \}/);
  assert.match(authForm, /: \{ name, email, phone, password, next, termsAccepted \}/);
});

test("the request acknowledgement stays local and does not activate a subscription", () => {
  assert.match(flow, /checked=\{acknowledged\}/);
  assert.match(flow, /setAcknowledged\(event\.target\.checked\)/);
  assert.doesNotMatch(flow, /contracts\/\$\{contract\.id\}\/accept/);
  assert.match(flow, /disabled=\{busy \|\| requested \|\| !acknowledged\}/);
  assert.match(flow, /nenhuma cobrança será feita agora/);
});

test("only the existing authenticated intent API is used, with server-side plan validation", () => {
  assert.match(flow, /fetch\("\/api\/commercial\/intents",\s*\{\s*method: "POST"/);
  assert.match(intentRoute, /\/v1\/assinaturas\/intencoes/);
  assert.match(intentRoute, /\["AVULSO", "RECORRENTE"\]/);
  assert.match(flow, /response\.json\(\)\.catch\(\(\) => \(\{\}\)\)/);
});
