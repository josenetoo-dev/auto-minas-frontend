import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getApiToken } from "@/lib/backend";
import { getSession } from "@/lib/auth";
import { carById } from "@/lib/car";
import SellForm from "@/components/sell-form";
import "@/styles/sell.css";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Editar anúncio" };

export default async function Edit({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ step?: string }> }) {
  const user = await getSession();
  if (!user) redirect("/login");

  const { id } = await params;
  const { step } = await searchParams;
  const initialStep = /^\d+$/.test(step || "") ? Number(step) : 1;
  if (!/^\d+$/.test(id)) notFound();

  const car = await carById(Number(id), (await getApiToken()) || undefined).catch(() => null);
  if (!car) notFound();
  if (car.userId !== user.id) notFound();
  if (["suspenso", "vendido", "arquivado"].includes(car.status)) redirect("/meus-anuncios");

  return (
    <SellForm
      mode="edit"
      carId={car.id}
      initialStep={initialStep}
      initial={{
        brand: car.brand,
        model: car.model,
        version: car.version,
        vehicleHistory: car.vehicleHistory ?? undefined,
        year: String(car.year),
        price: String(car.price),
        mileageKm: String(car.mileageKm),
        fuel: car.fuel,
        transmission: car.transmission,
        color: car.color,
        city: car.city,
        state: car.state,
        description: car.description,
        category: car.category,
        secondHand: car.secondHand,
        documentation: car.documentation,
        warranty: car.warranty,
        inspectionReport: car.inspectionReport,
        images: car.images,
        imageIds: car.imageIds,
      }}
    />
  );
}
