"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function AccountLogoutButton() {
  const router=useRouter();
  const [busy,setBusy]=useState(false);

  async function logout() {
    setBusy(true);
    try {
      await fetch("/api/auth/logout",{method:"POST"});
      router.push("/");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return <button type="button" className="account-reference-logout" disabled={busy} onClick={logout}>
    <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M10 17l5-5-5-5m5 5H3m12-8h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4" /></svg>
    {busy?"Saindo…":"Sair da conta"}
  </button>;
}
