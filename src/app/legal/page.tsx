import LegalPage from "@/components/legal-page";
export const dynamic="force-dynamic";
export const metadata={title:"Responsável e contato"};
export default function Legal(){
 const values=[["Nome empresarial / responsável",process.env.LEGAL_ENTITY_NAME],["CPF ou CNPJ do fornecedor",process.env.LEGAL_REGISTRATION],["Endereço físico",process.env.LEGAL_ADDRESS],["Atendimento e privacidade",process.env.LEGAL_CONTACT_EMAIL]];
 return <LegalPage title="Responsável e contato"><section><h2>Identificação do fornecedor</h2><p>Auto Minas é o nome do projeto. A identificação abaixo deve ser completada pelo responsável antes de habilitar contratação comercial e tratamento de documentos reais.</p><dl className="mt-5 space-y-5">{values.map(([label,value])=><div key={label}><dt className="font-semibold text-[#e4ca91]">{label}</dt><dd className="mt-1 break-words">{value||"Pendente de informação pelo responsável"}</dd></div>)}</dl></section><section><h2>Atendimento aos titulares</h2><p>Usuários autenticados podem registrar e acompanhar pedidos de exclusão. O canal externo para quem perdeu acesso e a identificação do controlador precisam ser publicados quando fornecidos.</p></section></LegalPage>;
}
