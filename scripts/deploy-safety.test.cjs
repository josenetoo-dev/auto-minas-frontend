const test = require("node:test");
const assert = require("node:assert/strict");
const { spawnSync } = require("node:child_process");

function run(command, args) {
  return spawnSync(command, args, { encoding: "utf8", timeout: 10000 });
}

test("deploy scripts have valid bash syntax", () => {
  const result = run("bash", ["-n", "deploy/manage.sh", "deploy/setup-env.sh", "deploy/smoke-test.sh"]);
  assert.equal(result.status, 0, result.stderr);
});

test("operations script offers offline help without credentials", () => {
  const result = run("bash", ["deploy/manage.sh", "--help"]);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /start-public/);
  assert.match(result.stdout, /stop/);
});

test("state-changing smoke is blocked unless explicitly marked as ephemeral CI", () => {
  const result = run("bash", ["deploy/smoke-test.sh"]);
  assert.equal(result.status, 2, result.stderr);
  assert.match(result.stderr, /Bloqueado/);
});

test("marketplace smoke refuses to change persistent data by default", () => {
  const result = run("node", ["deploy/smoke-marketplace.mjs"]);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /CI efêmera/);
});
