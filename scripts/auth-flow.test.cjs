const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const ts = require("typescript");

function loadRoute(filename, dependencies) {
  const source = fs.readFileSync(filename, "utf8");
  const code = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const context = {
    module: { exports: {} },
    require(name) {
      if (!(name in dependencies)) throw new Error(`Unexpected dependency: ${name}`);
      return dependencies[name];
    },
    process: { env: {} },
    Response,
  };
  context.exports = context.module.exports;
  vm.runInNewContext(code, context, { filename });
  return context.module.exports;
}

test("signup logs in the newly registered account and establishes its session", async () => {
  const calls = [];
  const cookieValues = new Map();
  let writtenCookie;
  const cookieStore = {
    get: (name) => cookieValues.has(name) ? { value: cookieValues.get(name) } : undefined,
    set: (name, value, options) => {
      cookieValues.set(name, value);
      writtenCookie = { name, value, options };
    },
    delete: (name) => cookieValues.delete(name),
  };
  const backend = {
    backendFetch: async (path, options) => {
      calls.push({ path, body: options.body ? JSON.parse(options.body) : undefined });
      if (path === "/auth/login") return { token: "issued-jwt" };
      if (path === "/v1/usuario/me") return {
        id: 54, email: "teste@example.com", nome: "Teste", role: "USER", status: "PENDING_CONTACT_VERIFICATION",
      };
      return {};
    },
    clientError: (error) => Response.json({ error: error.message }, { status: 500 }),
    sameOrigin: () => true,
  };
  const auth = loadRoute("src/lib/auth.ts", {
    "next/headers": { cookies: async () => cookieStore },
    "next/navigation": { redirect: (path) => { throw new Error(`redirect ${path}`); } },
    "@/lib/backend": { ...backend, SESSION_COOKIE: "auto_minas_access" },
  });
  const { POST } = loadRoute("src/app/api/auth/signup/route.ts", {
    "next/server": { NextResponse: { json: (body, init) => Response.json(body, init) } },
    "@/lib/backend": backend,
    "@/lib/auth": auth,
    "@/lib/redirect": { safeNextPath: (value, fallback) => value || fallback },
  });

  const response = await POST(new Request("http://localhost/api/auth/signup", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ name: "Teste", email: "teste@example.com", phone: "31999999999", password: "senhaTeste123" }),
  }));
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.deepEqual(calls.map(({ path }) => path), ["/auth/register", "/auth/login", "/v1/usuario/me"]);
  assert.deepEqual(JSON.parse(JSON.stringify(writtenCookie)), {
    name: "auto_minas_access",
    value: "issued-jwt",
    options: { httpOnly: true, sameSite: "lax", secure: false, path: "/", maxAge: 1800 },
  });
  assert.equal(body.redirect, "/conta");
});

test("email confirmation replaces the revoked JWT without logging the user out", () => {
  const source = fs.readFileSync("src/components/email-activation.tsx", "utf8");
  assert.match(source, /\/api\/auth\/contact-email\/confirm/);
  assert.match(source, /router\.replace\(json\.redirect\)/);
  assert.doesNotMatch(source, /\/api\/auth\/logout|router\.(?:push|replace)\(["']\/login/);
});

test("confirmation BFF requires the current session and replaces it with the backend-issued JWT", async () => {
  let currentToken = "pending-session-jwt";
  const upstreamCalls = [];
  const cookieValues = new Map([["auto_minas_access", currentToken]]);
  let writtenCookie;
  const cookieStore = {
    get: (name) => cookieValues.has(name) ? { value: cookieValues.get(name) } : undefined,
    set: (name, value, options) => {
      cookieValues.set(name, value);
      writtenCookie = { name, value, options };
    },
    delete: (name) => cookieValues.delete(name),
  };
  const backend = {
    backendFetch: async (path, options, token) => {
      upstreamCalls.push({ path, body: options.body ? JSON.parse(options.body) : undefined, token });
      if (path === "/v1/usuario/me/contato/email/confirmar") return { token: "active-session-jwt" };
      if (path === "/v1/usuario/me") return {
        id: 54, email: "teste@example.com", nome: "Teste", role: "USER", status: "ACTIVE",
      };
      throw new Error(`Unexpected API path ${path}`);
    },
    clientError: (error) => Response.json({ error: error.message }, { status: 500 }),
    getApiToken: async () => currentToken,
    sameOrigin: () => true,
  };
  const auth = loadRoute("src/lib/auth.ts", {
    "next/headers": { cookies: async () => cookieStore },
    "next/navigation": { redirect: (path) => { throw new Error(`redirect ${path}`); } },
    "@/lib/backend": { ...backend, SESSION_COOKIE: "auto_minas_access" },
  });
  const { POST } = loadRoute("src/app/api/auth/contact-email/confirm/route.ts", {
    "next/server": { NextResponse: { json: (body, init) => Response.json(body, init) } },
    "@/lib/auth": auth,
    "@/lib/backend": backend,
  });
  const request = () => new Request("http://localhost/api/auth/contact-email/confirm", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ token: "valid-code" }),
  });

  const response = await POST(request());
  assert.equal(response.status, 200);
  assert.deepEqual(upstreamCalls.map(({ path }) => path), [
    "/v1/usuario/me/contato/email/confirmar", "/v1/usuario/me",
  ]);
  assert.equal(upstreamCalls[0].token, "pending-session-jwt");
  assert.deepEqual(JSON.parse(JSON.stringify(writtenCookie)), {
    name: "auto_minas_access",
    value: "active-session-jwt",
    options: { httpOnly: true, sameSite: "lax", secure: false, path: "/", maxAge: 1800 },
  });
  assert.deepEqual(await response.json(), { ok: true, redirect: "/conta" });

  currentToken = null;
  const anonymousResponse = await POST(request());
  assert.equal(anonymousResponse.status, 401);
  assert.equal(upstreamCalls.length, 2);
});
