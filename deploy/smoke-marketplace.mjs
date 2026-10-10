/**
 * Smoke de negócio sobre banco DESCARTÁVEL da CI: contas e anúncios [DEMO].
 * Não processa pessoas ou documentos reais, nem usa AWS/SMTP.
 * Node 22 nativo, sem dependências de teste extras.
 */
const base=process.env.STAGING_SMOKE_URL || "http://127.0.0.1:3000";
const buyerPassword=process.env.STAGING_DEMO_BUYER_PASSWORD;
const adminPassword=process.env.STAGING_DEMO_ADMIN_PASSWORD;
const sellerPassword=process.env.STAGING_DEMO_SELLER_PASSWORD;
if (!buyerPassword || !adminPassword || !sellerPassword) throw new Error("Contas de teste ausentes");

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
  const seller=await login("vendedor-demo@auto-minas.test",sellerPassword);

  const dashboard=await request("/moderacao",{cookie:admin});
  expectCode(dashboard,200,"Painel de moderação");

  const page=await request("/carros");
  expectCode(page,200,"Vitrine");
  const matches=[...page.raw.matchAll(/href="\/carros\/(\d+)"/g)];
  if(matches.length<1) throw new Error("Nenhum carro de demonstração clicável");
  const carId=Number(matches[0][1]);
  const demoCars=[...new Set(matches.map(m=>Number(m[1])))];
  if(demoCars.length<2)throw new Error("Precisamos de dois anúncios DEMO para testar venda separadamente");

  const newAd=await request("/api/cars",{
    method:"POST",cookie:buyer,body:{
      brand:"Fiat",model:"Pulse",version:"Audace 1.0",
      year:2023,price:79000,mileageKm:25000,
      fuel:"FLEX",transmission:"AUTOMATICO",color:"Branco",
      city:"Pirapora",state:"MG",
      description:"Anúncio fictício para testar cadastro e moderação do Auto Minas.",
      category:"SEMINOVOS",secondHand:true
    }
  });
  expectCode(newAd,201,"Cadastro de anúncio via Next/Spring");
  if(newAd.json?.status!=="PENDENTE" || !newAd.json?.id)
    throw new Error("Anúncio não permaneceu pendente de análise");
  const myAds=await request("/meus-anuncios",{cookie:buyer});
  expectCode(myAds,200,"Meus anúncios após cadastro");
  if(!myAds.raw.includes("Pirapora/MG"))
    throw new Error("Localização enviada ao Spring não retornou corretamente para a interface");

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


  // Vendedor altera status pelo mesmo BFF da interface, sem acesso ao banco.
  const pause=await request("/api/cars/"+carId,{
    method:"PATCH",cookie:seller,body:{status:"pausado"}
  });
  expectCode(pause,200,"Pausar anúncio");
  if(pause.json?.status!=="PAUSADO")throw new Error("Status de pausa não persistido");

  const deniedPause=await request("/api/cars/"+carId,{
    method:"PATCH",cookie:buyer,body:{status:"pendente"}
  });
  expectCode(deniedPause,403,"Bloqueio de outro usuário reativando anúncio");

  const reactivate=await request("/api/cars/"+carId,{
    method:"PATCH",cookie:seller,body:{status:"pendente"}
  });
  expectCode(reactivate,200,"Solicitar reativação para análise");
  if(reactivate.json?.status!=="PENDENTE")
    throw new Error("Reativação publicou anúncio sem passar pela moderação");

  const sold=await request("/api/cars/"+demoCars[1],{
    method:"PATCH",cookie:seller,body:{status:"vendido"}
  });
  expectCode(sold,200,"Marcar anúncio como vendido");
  if(sold.json?.status!=="VENDIDO")throw new Error("Status vendido não persistido");

  const reactivationAfterSold=await request("/api/cars/"+demoCars[1],{
    method:"PATCH",cookie:seller,body:{status:"pendente"}
  });
  expectCode(reactivationAfterSold,409,"Não reativar anúncio vendido");

  console.log("E2E de homologação aprovado: cidade/UF, conta comprador/vendedor/admin, cadastro pendente, proposta, chat, pausa, moderação de reativação e venda.");
} catch(error) {
  console.error(error.message);
  process.exitCode=1;
}
