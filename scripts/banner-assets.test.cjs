const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");

const ASSETS = [
  ["public/banners/auto-minas-home-horizontal.webp", "src/app/page.tsx"],
  ["public/banners/auto-minas-feira-vertical.webp", "src/app/feira/page.tsx"],
];

test("banners originais estão versionados e são WebP válidos", () => {
  for (const [path] of ASSETS) {
    const bytes = fs.readFileSync(path);
    assert.equal(bytes.toString("ascii", 0, 4), "RIFF", path);
    assert.equal(bytes.toString("ascii", 8, 12), "WEBP", path);
    assert.ok(bytes.length > 10000, path + " inesperadamente pequeno");
    assert.ok(bytes.length < 300000, path + " precisa de otimização");
  }
});

test("banners estão integrados às páginas e não anunciam consulta oficial ativa", () => {
  const home = fs.readFileSync("src/app/page.tsx", "utf8");
  const feira = fs.readFileSync("src/app/feira/page.tsx", "utf8");
  assert.match(home, /auto-minas-home-horizontal\.webp/);
  assert.match(home, /auto-minas-feira-vertical\.webp/);
  assert.match(feira, /auto-minas-feira-vertical\.webp/);
  assert.match(home, /consultas oficiais automáticas/);
  assert.match(feira, /consultas oficiais automáticas/);
});
