/**
 * Smoke de negócio sobre banco DESCARTÁVEL da CI: contas e anúncios [DEMO].
 * Não processa pessoas ou documentos reais, nem usa AWS/SMTP.
 * Node 22 nativo, sem dependências de teste extras.
 */
const base=process.env.STAGING_SMOKE_URL || "http://127.0.0.1:3000";
if (process.env.GITHUB_ACTIONS !== "true" ||
    process.env.STAGING_SMOKE_ALLOW_MUTATIONS !== "CI_EPHEMERAL_ONLY" ||
    base !== "http://127.0.0.1:3000") {
  throw new Error("Smoke de negócio altera dados: permitido somente na CI efêmera (loopback).");
}
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
  for(const kind of ["IDENTIDADE_FRENTE","IDENTIDADE_VERSO","DOCUMENTO_VEICULO"]) {
    const form=new FormData();
    form.set("tipo",kind);
    form.set("arquivo",new Blob([Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAIAAABLbSncAAAAFElEQVR4nGO8st6cARtgwio6aCUAXZAByo07EaIAAAAASUVORK5CYII=","base64")],{type:"image/png"}),"documento-ficticio.png");
    const response=await fetch(base+"/api/cars/"+newAd.json.id+"/documents",{method:"POST",headers:{Origin:base,Cookie:buyer},body:form});
    if(response.status!==201) throw new Error("Envio conjunto de documento retornou HTTP "+response.status);
  }
  const submit=await request("/api/cars/"+newAd.json.id+"/documents",{method:"POST",cookie:buyer,body:{submit:true}});
  expectCode(submit,200,"Enviar identidade e veículo juntos");
  const forbiddenDocs=await request("/api/cars/"+newAd.json.id+"/documents",{cookie:seller});
  expectCode(forbiddenDocs,404,"Anúncio pendente oculto de outro anunciante");
  const packet=await request("/api/backend/v1/moderacao/anuncios/"+newAd.json.id+"/documentos",{cookie:admin});
  expectCode(packet,200,"Revisor consulta documentos associados ao anúncio");
  for(const kind of ["IDENTIDADE","VEICULO"]) {
    const item=packet.json.find(c=>c.tipo===kind);
    if(!item)throw new Error("Documento ausente no painel de revisão");
    if(kind==="VEICULO") {
      const correction=await request("/api/backend/v1/verificacoes/revisao/"+item.id+"/corrigir",{method:"POST",cookie:admin,
        body:{motivo:"Documento fictício precisa de uma correção de teste.",categoria:"DOCUMENTO_ILEGIVEL"}});
      expectCode(correction,200,"Administração solicita correção específica");
      const history=await request("/api/backend/v1/verificacoes/revisao/"+item.id+"/historico",{cookie:admin});
      expectCode(history,200,"Administração consulta histórico");
      if(history.json.content[0].resultado!=="CORRECAO_NECESSARIA")throw new Error("Correção não foi auditada");
      const deniedHistory=await request("/api/backend/v1/verificacoes/revisao/"+item.id+"/historico",{cookie:buyer});
      expectCode(deniedHistory,403,"Histórico administrativo não é exposto ao titular");
      const manual=await request("/api/cars/"+newAd.json.id+"/documents",{method:"POST",cookie:buyer,body:{submit:true,manual:true}});
      expectCode(manual,200,"Retomar o mesmo caso em análise manual");
    }
    const review=await request("/api/backend/v1/verificacoes/revisao/"+item.id+"/aprovar",{method:"POST",cookie:admin});
    expectCode(review,200,"Revisão humana explícita do documento fictício");
  }
  const photo=new FormData();
  photo.set("arquivo",new Blob([Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAIAAABLbSncAAAAFElEQVR4nGO8st6cARtgwio6aCUAXZAByo07EaIAAAAASUVORK5CYII=","base64")],{type:"image/png"}),"perfil.png");
  const upload=await fetch(base+"/api/backend/v1/usuario/me/foto-perfil",{method:"POST",headers:{Origin:base,Cookie:buyer},body:photo});
  if(upload.status!==204)throw new Error("Falha ao salvar foto de perfil: "+upload.status);
  const publish=await request("/api/backend/v1/moderacao/anuncios/"+newAd.json.id+"/aprovar",{method:"POST",cookie:admin,body:{requisitosConferidos:true}});
  expectCode(publish,200,"Publicar gratuitamente após revisão");
  if(publish.json.status!=="ATIVO") throw new Error("Publicação gratuita não foi confirmada");
  const publicProfile=await request("/perfil/"+publish.json.usuarioId);
  expectCode(publicProfile,200,"Perfil público");
  if(!publicProfile.raw.includes("Nível 1 · Revisão documental concluída"))throw new Error("Nível 1 não reconhecido");
  const forbiddenPublicDocs=await request("/api/cars/"+newAd.json.id+"/documents",{cookie:seller});
  expectCode(forbiddenPublicDocs,403,"Documentos privados mesmo após publicação");
  const details=await request("/carros/"+newAd.json.id);
  expectCode(details,200,"Resumo público de vendedor e veículo");
  if(!details.raw.includes("O que foi analisado"))throw new Error("Resumo documental público ausente");
  const vehicleCase=packet.json.find(item=>item.tipo==="VEICULO");
  const expire=await request("/api/backend/v1/verificacoes/revisao/"+vehicleCase.id+"/expirar",{method:"POST",cookie:admin,
    body:{motivo:"Revalidação administrativa fictícia para testar privacidade.",categoria:"REVALIDACAO_NECESSARIA"}});
  expectCode(expire,200,"Exigir revalidação após publicação");
  const hiddenExpired=await request("/carros/"+newAd.json.id);
  expectCode(hiddenExpired,404,"Revalidação retira anúncio da vitrine");
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

  const attachmentForm=new FormData();
  attachmentForm.set("file",new Blob([Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAIAAABLbSncAAAAFElEQVR4nGO8st6cARtgwio6aCUAXZAByo07EaIAAAAASUVORK5CYII=","base64")],{type:"image/png"}),"teste.png");
  const imageResponse=await fetch(base+"/api/conversations/"+proposal.json.id+"/attachments",{method:"POST",headers:{Origin:base,Cookie:buyer},body:attachmentForm});
  if(imageResponse.status!==200)throw new Error("Envio de imagem privada falhou com HTTP "+imageResponse.status);
  const imageResult=await imageResponse.json();
  const unreadPath="/api/backend/v1/proposta/mensagens-nao-lidas";
  const readPath="/api/backend/v1/proposta/"+proposal.json.id+"/mensagens/leitura";
  const before=(await request(unreadPath,{cookie:seller})).json[proposal.json.id];
  if(!(before>=2))throw new Error("O destinatário precisa ver as duas mensagens novas");
  const selection={ids:[imageResult.message.id]};
  expectCode(await request(readPath,{method:"POST",body:selection,cookie:admin}),403,"Leitura restrita aos participantes");
  for(let attempt=0;attempt<2;attempt++)expectCode(await request(readPath,{method:"POST",body:selection,cookie:seller}),204,"Leitura idempotente");
  if((await request(unreadPath,{cookie:seller})).json[proposal.json.id]!==before-1)throw new Error("Confirmação repetida descontou valor incorreto");
  const download=await request(imageResult.message.attachment.url,{cookie:buyer});
  expectCode(download,200,"Participante pode baixar imagem privada");
  const outsiderDownload=await request(imageResult.message.attachment.url,{cookie:admin});
  expectCode(outsiderDownload,403,"Não participante não pode baixar imagem privada");
  const privacy=await request("/api/privacy/requests",{method:"POST",cookie:buyer});
  expectCode(privacy,202,"Registrar pedido de exclusão");
  const repeatedPrivacy=await request("/api/privacy/requests",{method:"POST",cookie:buyer});
  expectCode(repeatedPrivacy,202,"Repetir pedido pendente");
  if(repeatedPrivacy.json.id!==privacy.json.id)throw new Error("Pedido repetido não foi idempotente");
  const attendancePath="/api/backend/v1/privacidade/solicitacoes/admin/"+privacy.json.id;
  const attendance={status:"EM_ANALISE",resposta:"Pedido fictício em análise pela administração da demonstração."};
  expectCode(await request(attendancePath,{method:"PUT",cookie:seller,body:attendance}),403,"Atendimento restrito à administração");
  expectCode(await request(attendancePath,{method:"PUT",cookie:admin,body:attendance}),200,"Administração registra atendimento");
  const tracked=await request("/api/privacy/requests",{cookie:buyer});
  if(tracked.json.content.find(item=>item.id===privacy.json.id)?.resposta!==attendance.resposta)throw new Error("Titular não recebeu a resposta administrativa");
  expectCode(await request(attendancePath+"/historico",{cookie:buyer}),403,"Histórico interno privado");
  expectCode(await request(attendancePath+"/historico",{cookie:admin}),200,"Histórico administrativo disponível");
  const otherPrivacy=await request("/api/privacy/requests",{cookie:seller});
  expectCode(otherPrivacy,200,"Consultar privacidade de outra conta");
  if(otherPrivacy.json.content.some(item=>item.id===privacy.json.id))throw new Error("Vazamento de protocolo privado");

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
    method:"PATCH",cookie:seller,body:{
      status:"vendido",valorFinal:60000,dataVenda:new Date().toISOString().slice(0,10)
    }
  });
  expectCode(sold,200,"Declarar venda sem exigir assinatura");

  console.log("E2E de homologação aprovado: cidade/UF, conta comprador/vendedor/admin, cadastro pendente, proposta, chat, pausa, moderação de reativação e venda gratuita.");
} catch(error) {
  console.error(error.message);
  process.exitCode=1;
}
