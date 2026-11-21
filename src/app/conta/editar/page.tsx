import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { backendFetch, getApiToken } from "@/lib/backend";
import ProfileEditForm from "@/components/profile-edit-form";
import HistoryBackButton from "@/components/history-back-button";
import "@/styles/profile.css";

export const dynamic="force-dynamic";
export const metadata: Metadata = { title: "Editar perfil" };

type PrivateUser={id:number;nome:string;email:string;telefone:string;status:string;role:string};
type SellerData={nomeCompleto:string;cpfMascarado:string|null;identificacaoInformada:boolean};
type PublicProfile={nome:string;temFoto:boolean;nivel:number;veiculos:{id:number;titulo:string}[];temMais:boolean};

export default async function EditProfilePage() {
  const session=await requireUser();
  const token=await getApiToken();

  const [me,seller,profile]=await Promise.all([
    backendFetch<PrivateUser>("/v1/usuario/me",{},token||undefined),
    backendFetch<SellerData>("/v1/usuario/me/dados-vendedor",{},token||undefined).catch(()=>null),
    backendFetch<PublicProfile>(`/v1/perfis/${session.id}?pagina=0`).catch(()=>null),
  ]);

  return (
    <div className="profile-edit-reference-screen">
      <header className="account-reference-topbar">
        <HistoryBackButton fallback="/conta" className="account-reference-back" ariaLabel="Voltar">←</HistoryBackButton>
        <Link href="/" className="account-reference-brand"><span>AM</span><strong>Auto Minas</strong></Link>
      </header>

      <main className="profile-edit-reference-content">
        <section className="profile-edit-heading">
          <div>
            <h1>Editar perfil</h1>
            <p>Atualize suas informações pessoais.</p>
          </div>
          <div className="account-reference-car" aria-hidden="true">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/vehicle-illustration.svg" alt=""/>
          </div>
        </section>

        <ProfileEditForm
          userId={me.id}
          initialName={me.nome}
          email={me.email}
          initialPhone={me.telefone}
          cpfMasked={seller?.cpfMascarado??null}
          hasPhoto={profile?.temFoto??false}
        />
      </main>

      <div className="account-reference-glow" aria-hidden="true"/>
    </div>
  );
}
