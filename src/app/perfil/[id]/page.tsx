import Link from "next/link";
import {notFound} from "next/navigation";
import {backendFetch,BackendError} from "@/lib/backend";

type Perfil={nome:string;temFoto:boolean;nivel:number;veiculos:{id:number;titulo:string}[];temMais:boolean};
export default async function PerfilPage({params,searchParams}:{params:Promise<{id:string}>;searchParams:Promise<{pagina?:string}>}) {
 const {id}=await params;
 if(!/^\d+$/.test(id))notFound();
 const page=Number((await searchParams).pagina||0);
 if(!Number.isSafeInteger(page)||page<0||page>100000)notFound();
 let perfil:Perfil;
 try {perfil=await backendFetch<Perfil>(`/v1/perfis/${id}?pagina=${page}`);}
 catch(error){if(error instanceof BackendError && error.status===404)notFound();throw error;}
 return <div className="mx-auto max-w-3xl space-y-6 px-5 py-8">
  <header className="card-dark flex items-center gap-4 p-5">
   {perfil.temFoto && <img className="h-16 w-16 rounded-full object-cover" src={`/perfil/${id}/foto`} alt={`Foto de ${perfil.nome}`}/>}
   <div><h1 className="font-display text-2xl">{perfil.nome}</h1>
   <p>{perfil.nivel===1?"Nível 1 · Revisão documental concluída":"Nível inicial"}</p></div>
  </header>
  <h2 className="font-display text-xl">Veículos anunciados</h2>
  <ul className="grid gap-3 sm:grid-cols-2">{perfil.veiculos.map(v=><li key={v.id}><Link className="card-dark block p-4 underline" href={`/carros/${v.id}`}>{v.titulo}</Link></li>)}</ul>
  {!perfil.veiculos.length && <p>Nenhum anúncio ativo nesta página.</p>}
  <nav className="flex gap-4">{page>0&&<Link href={`?pagina=${page-1}`}>Anterior</Link>}{perfil.temMais&&<Link href={`?pagina=${page+1}`}>Próxima</Link>}</nav>
 </div>;
}
