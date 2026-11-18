import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import EmailVerificationFlow from "@/components/email-verification-flow";

export const metadata: Metadata = {
  title: "Verificar e-mail",
  description: "Confirme o e-mail da sua conta Auto Minas.",
};

export default async function VerifyEmailPage() {
  const user = await requireUser();

  return (
    <EmailVerificationFlow
      email={user.email}
      initiallyVerified={user.status === "ACTIVE"}
    />
  );
}
