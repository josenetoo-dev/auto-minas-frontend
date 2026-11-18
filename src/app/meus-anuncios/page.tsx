import type { Metadata } from "next";
import { myCars } from "@/lib/car";
import { requireUser } from "@/lib/auth";
import MyAdsDashboard from "@/components/my-ads-dashboard";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Meus anúncios" };

export default async function MyAds() {
  await requireUser();
  const ads = await myCars();
  return <MyAdsDashboard ads={ads} />;
}
