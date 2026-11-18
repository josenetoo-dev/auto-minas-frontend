const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const ts=require('typescript');

const src=fs.readFileSync('src/lib/chat-sync.ts','utf8')
  .replace(/^import .*?from .*?;\n/gm,'')
  .replace(/^export /gm,'')
  +'\nmodule.exports={mergeThread};';
const code=ts.transpileModule(src,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const sandbox={module:{exports:{}},Date,Set};
vm.runInNewContext(code,sandbox);
const {mergeThread}=sandbox.module.exports;

const message=(id,createdAt,pending=false)=>({
 id,createdAt,pending,senderId:10,content:'Texto',readAt:null
});
const conversation={id:42,carId:101,myRole:'buyer'};
const thread=(messages, id=42)=>({conversation:{...conversation,id},messages,car:null,other:{id:99,name:'Vendedor'}});

test('optimistic pending message survives a concurrent server refresh',()=>{
 const previous=thread([message(1,'2026-11-18T12:00:00Z'),message(-5,'2026-11-18T12:00:01Z',true)]);
 const incoming=thread([message(1,'2026-11-18T12:00:00Z')]);
 const merged=mergeThread(previous,incoming);
 assert.deepEqual(Array.from(merged.messages.map(x=>x.id)),[1,-5]);
 assert.equal(merged.messages.at(-1).pending,true);
});

test('confirmed server message replaces local state without duplicates',()=>{
 const previous=thread([message(-5,'2026-11-18T12:00:01Z',true)]);
 const incoming=thread([message(8,'2026-11-18T12:00:01Z')]);
 const reconciled=mergeThread(previous,incoming);
 // Ack reconciliation in the send function removes the temporary ID.
 assert.deepEqual(Array.from(reconciled.messages.map(x=>x.id)),[8]);
});

test('switching between ads never preserves messages from another thread',()=>{
 const previous=thread([message(-7,'2026-11-18T12:00:00Z')],42);
 const incoming=thread([message(15,'2026-11-18T12:00:10Z')],43);
 const result=mergeThread(previous,incoming);
 assert.deepEqual(Array.from(result.messages.map(x=>x.id)),[15]);
});

test('the UI has SSE and a fallback for reconnect and focus changes',()=>{
 const chat=fs.readFileSync('src/components/chat-app.tsx','utf8');
 assert.match(chat,/new EventSource\(/);
 assert.match(chat,/window\.setInterval\(\(\) => void load\(\), 12000\)/);
 assert.match(chat,/addEventListener\("visibilitychange"/);
 assert.match(chat,/source\?\.close\(\)/);
});

test('conversation identity includes the announcement',()=>{
 const chat=fs.readFileSync('src/lib/chat.ts','utf8');
 const route=fs.readFileSync('src/app/api/conversations/route.ts','utf8');
 assert.match(chat,/item\.carId/);
 assert.match(route,/item\.carId===data\.carId/);
 assert.match(chat,/\/v1\/proposta\/\$\{id\}\/relacionadas/);
});

test('mobile chat gestures and zoom do not disable manual zoom',()=>{
 const css=fs.readFileSync('src/styles/chat.css','utf8');
 const global=fs.readFileSync('src/app/globals.css','utf8');
 assert.match(css,/touch-action:pan-y/);
 assert.match(css,/-webkit-overflow-scrolling:touch/);
 assert.match(global,/font-size: 16px !important/);
 assert.doesNotMatch(global.replace(/\/\*[\s\S]*?\*\//g,""),/user-scalable=no/);
});
