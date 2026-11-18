import LegalPage from "@/components/legal-page";
import {CookieSettingsButton} from "@/components/cookie-preferences";
import "@/styles/legal-info.css";
export const metadata={title:"Política de cookies"};
export default function Cookies(){return <LegalPage title="Política de cookies">
<section><h2>Necessários</h2><p>auto_minas_access mantém a sessão por até 30 minutos, com HttpOnly, Secure em HTTPS e SameSite=Lax. O logout remove o cookie e revoga a sessão no backend. A preferência de cookies fica no armazenamento local deste navegador por até 180 dias, com versão e data da escolha.</p></section>
<section><h2>Opcionais</h2><p>Google Analytics e pixels de publicidade não estão configurados. Nenhum script opcional de análise ou publicidade é carregado nesta versão. Se forem adicionados, cada finalidade será apresentada desligada por padrão, com opção de aceitar, rejeitar e revogar.</p></section>
<section><h2>Gerenciamento</h2><p>As preferências estão disponíveis pelo rodapé. Rejeitar opcionais não impede o uso do site. Não há consentimento para publicidade ou biometria embutido no cadastro. A escolha é específica do navegador e deve ser informada novamente após limpar seus dados ou usar outro dispositivo.</p><CookieSettingsButton /></section>
<section><h2>Bloqueio pelo navegador</h2><p>Bloquear cookies necessários pode impedir login e áreas privadas. A preferência local não equivale à exclusão dos dados da conta. Utilize o fluxo de solicitações de privacidade para exercer seus direitos sobre esses dados.</p></section>
</LegalPage>}
