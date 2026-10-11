const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const ts = require("typescript");

let source = fs.readFileSync("src/lib/redirect.ts", "utf8");
source = source.replace(/^export /gm, "");
source += "\nmodule.exports={safeNextPath};";
const code = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const context = { module: { exports: {} }, URL };
vm.runInNewContext(code, context);
const { safeNextPath } = context.module.exports;

test("redirects to internal routes remain unchanged", () => {
  assert.equal(safeNextPath("/conta"), "/conta");
  assert.equal(safeNextPath("/vender?from=login"), "/vender?from=login");
  assert.equal(safeNextPath("/carros/55#detalhes"), "/carros/55#detalhes");
});

test("external and ambiguous redirects are rejected", () => {
  for (const value of [
    "https://evil.example", "//evil.example", "/\\evil.example", "/\\/evil.example",
    "javascript:alert(1)", "\n/conta", "/conta\r\nevil", "",
    null, undefined, 42,
  ]) assert.equal(safeNextPath(value, "/conta"), "/conta");
});
