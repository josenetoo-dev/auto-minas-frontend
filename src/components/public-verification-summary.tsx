import { backendFetch } from "@/lib/backend";
import { formatDate } from "@/lib/format";

type Summary={vendedor:{analisadaManualmente:boolean;analisadaEm:string|null};veiculo:{analisadaManualmente:boolean;analisadaEm:string|null};aviso:string};

export default async function PublicVerificationSummary({adId,token}:{adId:number;token?:string}) {
 const summary=await backendFetch<Summary>(`/v1/anuncio/${adId}/verificacoes`,{},token).catch(()=>null);
 if(!summary)return <p className="text-sm text-[#b7b3a9]">Informações de análise temporariamente indisponíveis.</p>;
 return <section className="rounded-xl border border-white/10 p-4" aria-label="Análises do vendedor e do veículo">
  <h2 className="font-semibold">O que foi analisado</h2>
  <dl className="mt-3 space-y-3 text-sm">
   {([["Vendedor",summary.vendedor],["Veículo",summary.veiculo]] as const).map(([label,review])=><div key={label}>
    <dt className="font-semibold">{label}</dt>
    <dd className="mt-1 text-[#b7b3a9]">{review.analisadaManualmente?"Análise documental manual concluída":"Sem análise documental concluída informada"}
     {review.analisadaManualmente&&review.analisadaEm&&<span className="block text-xs">Revisão em {formatDate(review.analisadaEm)}</span>}
    </dd>
   </div>)}
  </dl>
  <details className="mt-4 text-xs leading-5 text-[#b7b3a9]"><summary className="min-h-11 cursor-pointer py-3 text-[#e4ca91]">O que essa análise significa?</summary><p>{summary.aviso}</p></details>
 </section>;
}
