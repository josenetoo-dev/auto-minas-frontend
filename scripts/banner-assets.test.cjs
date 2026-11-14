const test=require("node:test");const assert=require("node:assert/strict");const fs=require("node:fs");
test("home and fair page no longer render AI banners",()=>{for(const path of ["src/app/page.tsx","src/app/feira/page.tsx","src/app/globals.css"]){assert.doesNotMatch(fs.readFileSync(path,"utf8"),/auto-minas-home-horizontal|auto-minas-feira-vertical/);}});
