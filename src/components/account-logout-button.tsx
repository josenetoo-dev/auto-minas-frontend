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
    <span aria-hidden="true">↪</span>
    {busy?"Saindo…":"Sair da conta"}
  </button>;
}
