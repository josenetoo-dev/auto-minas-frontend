/* Unit smoke tests for the exact Spring Boot DTO adapter, no network access. */
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const ts=require('typescript');
const filename='src/lib/car.ts';
let src=fs.readFileSync(filename,'utf8');
// Inject inert adapter dependencies; only pure DTO mapping functions are under test.
src=src.replace(/^import .*?from .*?;\n/gm,'');
src=src.replace(/^export /gm,'');
src+='\nmodule.exports={fromBackendAd,apiAdPayload};';
const code=ts.transpileModule(src,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const context={module:{exports:{}},console};vm.runInNewContext(code,context);
const {fromBackendAd,apiAdPayload}=context.module.exports;
const ad={id:55,codigo:'AM-055',titulo:'Chevrolet Onix',descricao:'Carro de uso pessoal',preco:64900,
 marca:'Chevrolet',modelo:'Onix',versao:'LT',ano:2022,quilometragem:58000,combustivel:'FLEX',cambio:'MANUAL',cor:'Branco',
 status:'PENDENTE',segundaMao:true,categoria:'SEMINOVOS',fotoCapaUrl:null,usuarioId:3,usuarioNome:'Vendedor',criadoEm:'2026-10-10T08:00:00',veiculoId:9,motivoRejeicao:null};

test('Spring response maps private moderation state without fabricating location',()=>{
 const c=fromBackendAd(ad);
 assert.equal(c.status,'pendente');assert.equal(c.userId,3);assert.equal(c.vehicleId,9);
 assert.equal(c.city,'');assert.equal(c.state,'');assert.equal(c.price,64900);
});
test('valid image URLs are proxied to same origin and arbitrary domains are never displayed',()=>{
 const c=fromBackendAd({...ad,fotoCapaUrl:'https://example.com/e.jpg'},[
  {id:12,url:'http://localhost:8080/uploads/fotos/00000000-0000-4000-8000-000000000001.png',ordem:0,tipoFoto:'OUTRO',anuncioId:55},
  {id:13,url:'https://evil.example/image.jpg',ordem:1,tipoFoto:'OUTRO',anuncioId:55}
 ]);
 assert.deepEqual(c.images,['/api/media/00000000-0000-4000-8000-000000000001.png']);assert.deepEqual(Array.from(c.imageIds),[12,13]);
});
test('ad creation payload uses names and enums of AnuncioRequest exactly',()=>{
 const p=apiAdPayload({brand:'Chevrolet',model:'Onix',version:'LT',year:2022,price:64900,mileageKm:58000,fuel:'flex',transmission:'manual',color:'Branco',city:'Várzea da Palma',state:'MG',description:'Carro revisado e em boas condições.'});
 assert.equal(p.combustivel,'FLEX');assert.equal(p.cambio,'MANUAL');assert.equal(p.quilometragem,58000);
 assert.equal(p.preco,64900);assert.equal(p.categoria,'SEMINOVOS');assert.equal(p.titulo,'Chevrolet Onix 2022');
 assert.equal(p.documentacao,'A verificar');assert.equal(p.cidade,'Várzea da Palma');assert.equal(p.uf,'MG');
});
test('unsupported CVT is rejected (no fake backend enum)',()=>{
 assert.throws(()=>apiAdPayload({brand:'Chevrolet',model:'Onix',version:'LT',year:2022,price:64900,mileageKm:58000,fuel:'flex',transmission:'cvt',color:'Branco',city:'Várzea da Palma',state:'MG',description:'Carro revisado e em boas condições.'}),/não suportado/);
});
test('real listing location is mapped, legacy remains unknown',()=>{
 const c=fromBackendAd({...ad,cidade:'Várzea da Palma',uf:'MG'});
 assert.equal(c.city,'Várzea da Palma');assert.equal(c.state,'MG');
});

test('UF must be real and city cannot be missing',()=>{
 const base={brand:'Chevrolet',model:'Onix',year:2022,price:64900,mileageKm:58000,
  fuel:'flex',transmission:'manual',color:'Branco',
  description:'Anúncio de veículo somente para testes de integração',state:'MG'};
 assert.throws(()=>apiAdPayload({...base,city:''}),/cidade e UF/);
 assert.throws(()=>apiAdPayload({...base,city:'Pirapora',state:'ZZ'}),/cidade e UF/);
 assert.equal(apiAdPayload({...base,city:'Pirapora',state:'MG'}).cidade,'Pirapora');
});

test('the frontend does not contain the original PostgreSQL Drizzle schema',()=>{
 assert.equal(fs.existsSync('src/db/schema.ts'),false);
});
