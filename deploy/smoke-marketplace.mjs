/**
 * Smoke de negócio sobre banco DESCARTÁVEL da CI: contas e anúncios [DEMO].
 * Não processa pessoas ou documentos reais, nem usa AWS/SMTP.
 * Node 22 nativo, sem dependências de teste extras.
 */
const base=process.env.STAGING_SMOKE_URL || "http://127.0.0.1:3000";
const buyerPassword=process.env.STAGING_DEMO_BUYER_PASSWORD;
const adminPassword=process.env.STAGING_DEMO_ADMIN_PASSWORD;
if (!buyerPassword || !adminPassword) throw new Error("Contas de teste ausentes");

async function request(path,{method="GET",body,cookie}={}) {
  const response=await fetch(base+path,{
    method,headers:{
      ...(body?{"Content-Type":"application/json"}:{}),
      ...(method!=="GET"?{Origin:base}:{}),
      ...(cookie?{Cookie:cookie}:{})
    },body:body?JSON.stringify(body):undefined
  });
  const raw=await response.text();
  let json;try{json=JSON.parse(raw)}catch{json=null}
  return {response,json,raw};
}
function expectCode(out,code,what) {
  if(out.response.status!==code) {
    // Mensagens públicas (não contêm token de login).
    throw new Error(what+" retornou HTTP "+out.response.status+
      ": "+String(out.json?.error||out.json?.message||"sem corpo JSON").slice(0,250));
  }
}
async function login(email,password) {
  const out=await request("/api/auth/login",{
    method:"POST",body:{email,password}
  });
  expectCode(out,200,"Login "+email);
  const cookie=out.response.headers.get("set-cookie")?.split(";")[0];
  if(!cookie?.startsWith("auto_minas_access="))
    throw new Error("Cookie de sessão HttpOnly ausente");
  return cookie;
}

try {
  const buyer=await login("comprador-demo@auto-minas.test",buyerPassword);
  const admin=await login("admin-demo@auto-minas.test",adminPassword);

  const dashboard=await request("/moderacao",{cookie:admin});
  expectCode(dashboard,200,"Painel de moderação");

  const page=await request("/carros");
  expectCode(page,200,"Vitrine");
  const matches=[...page.raw.matchAll(/href="\/carros\/(\d+)"/g)];
  if(matches.length<1) throw new Error("Nenhum carro de demonstração clicável");
  const carId=Number(matches[0][1]);

  const newAd=await request("/api/cars",{
    method:"POST",cookie:buyer,body:{
      brand:"Fiat",model:"Pulse",version:"Audace 1.0",
      year:2023,price:79000,mileageKm:25000,
      fuel:"FLEX",transmission:"AUTOMATICO",color:"Branco",
      description:"Anúncio fictício para testar cadastro e moderação do Auto Minas.",
      category:"SEMINOVOS",secondHand:true
    }
  });
  expectCode(newAd,201,"Cadastro de anúncio via Next/Spring");
  if(newAd.json?.status!=="PENDENTE" || !newAd.json?.id)
    throw new Error("Anúncio não permaneceu pendente de análise");

  const proposal=await request("/api/conversations",{
    method:"POST",cookie:buyer,body:{
      carId,price:60000,
      message:"Proposta fictícia de homologação, não constitui oferta real."
    }
  });
  expectCode(proposal,201,"Proposta a anúncio de demonstração");
  if(!proposal.json?.id) throw new Error("Proposta sem ID retornado");

  const message=await request("/api/conversations/"+proposal.json.id+"/messages",{
    method:"POST",cookie:buyer,body:{
      content:"Mensagem fictícia para validar histórico da negociação."
    }
  });
  expectCode(message,200,"Mensagem vinculada à proposta");
  if(!message.json?.ok)throw new Error("Mensagem não foi confirmada");

  const conversations=await request("/api/conversations",{cookie:buyer});
  expectCode(conversations,200,"Histórico de propostas");
  if(!Array.isArray(conversations.json?.conversations) ||
      conversations.json.conversations.length<1)
    throw new Error("Proposta não apareceu no histórico");

  console.log("E2E de homologação aprovado: conta comprador, admin, cadastro pendente, proposta, mensagem e histórico.");
} catch(error) {
  console.error(error.message);
  process.exitCode=1;
}
