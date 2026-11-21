"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useListingDocuments } from "@/components/listing-documents";
import { BRANDS, FUEL_OPTIONS, TRANSMISSION_OPTIONS } from "@/lib/constants";
import { formatPrice } from "@/lib/format";
import HistoryBackButton from "@/components/history-back-button";
import { HISTORY_QUESTIONS, HISTORY_OPTIONS, EMPTY_HISTORY, historyDetailKey, completeHistory, normalizeHistory, type VehicleHistory } from "@/lib/vehicle-history";

export type SellFormData = {
  brand: string;
  model: string;
  version: string;
  vehicleHistory: VehicleHistory;
  year: string;
  price: string;
  mileageKm: string;
  fuel: string;
  transmission: string;
  color: string;
  city: string;
  state: string;
  description: string;
  category: string;
  secondHand: boolean;
  documentation: string;
  warranty: string;
  inspectionReport: string;
  images: string[];
  imageIds?: number[];
};

const EMPTY: SellFormData = {
  brand: "",
  model: "",
  version: "",
  vehicleHistory: { ...EMPTY_HISTORY },
  year: String(new Date().getFullYear()),
  price: "",
  mileageKm: "",
  fuel: "",
  transmission: "",
  color: "",
  city: "",
  state: "MG",
  description: "",
  category: "SEMINOVOS",
  secondHand: true,
  documentation: "A verificar",
  warranty: "Não informada",
  inspectionReport: "",
  images: [],
};

const UF_LIST = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"] as const;
const MAX_FILE = 4 * 1024 * 1024;
const YEARS = Array.from(
  { length: new Date().getFullYear() + 2 - 1900 },
  (_, i) => String(new Date().getFullYear() + 1 - i),
);

const STEPS = [
  { number: 1, short: "Dados", title: "Dados do veículo", subtitle: "Informe as informações principais do seu veículo." },
  { number: 2, short: "Características", title: "Características", subtitle: "Detalhes que ajudam compradores a entender o veículo." },
  { number: 3, short: "Fotos", title: "Fotos do veículo", subtitle: "Adicione fotos reais e de boa qualidade." },
  { number: 4, short: "Preço", title: "Preço e anúncio", subtitle: "Defina o valor e descreva o veículo com clareza." },
  { number: 5, short: "Local", title: "Localização e documentos", subtitle: "Informe onde o veículo está e envie os documentos para análise." },
  { number: 6, short: "Revisão", title: "Revisão e publicação", subtitle: "Confira as informações antes de enviar para análise." },
] as const;

function StepIcon({ type }: { type: "car" | "spec" | "photo" | "price" | "location" | "review" }) {
  if (type === "car") return <><path d="M5 13l1.6-4.2A2 2 0 0 1 8.5 7.5h7a2 2 0 0 1 1.9 1.3L19 13"/><path d="M4 13h16v4H4z"/><circle cx="7" cy="17.5" r="1.5"/><circle cx="17" cy="17.5" r="1.5"/></>;
  if (type === "spec") return <><rect x="4" y="5" width="16" height="14" rx="2"/><path d="M8 9h8M8 13h3M14 13h2"/></>;
  if (type === "photo") return <><rect x="4" y="5" width="16" height="14" rx="2"/><circle cx="9" cy="10" r="1.5"/><path d="m6 17 4-4 3 3 2-2 3 3"/></>;
  if (type === "price") return <><path d="M20 12 12 20 4 12V5h7l9 7Z"/><circle cx="8" cy="9" r="1.2"/></>;
  if (type === "location") return <><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></>;
  return <><path d="M6 3h9l3 3v15H6z"/><path d="M9 11h6M9 15h6M9 7h3"/></>;
}

export default function SellForm({
  mode,
  carId,
  initial,
  initialStep = 1,
}: {
  mode: "create" | "edit";
  carId?: number;
  initial?: Partial<SellFormData>;
  initialStep?: number;
}) {
  const router = useRouter();
  const [data, setData] = useState<SellFormData>({ ...EMPTY, ...initial, vehicleHistory: normalizeHistory(initial?.vehicleHistory) });
  const [step, setStep] = useState(Math.min(6, Math.max(1, initialStep)));
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [removed, setRemoved] = useState<number[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [createdId, setCreatedId] = useState<number | null>(null);
  const [successId, setSuccessId] = useState<number | null>(null);
  const savedPayload = useRef<string | null>(null);
  const documents = useListingDocuments(createdId ?? carId);

  const currentStep = STEPS[step - 1];

  function update(key: keyof SellFormData, value: string | boolean) {
    setData((old) => ({ ...old, [key]: value }));
  }

  function updateHistory(key: keyof VehicleHistory, value: string) {
    setData((old) => ({
      ...old,
      vehicleHistory: { ...old.vehicleHistory, [key]: value },
    }));
  }

  useEffect(() => {
    const urls = files.map((file) => URL.createObjectURL(file));
    setPreviews(urls);
    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, [files]);

  function addPhotos(selected: FileList | null) {
    if (!selected) return;
    const next = Array.from(selected);
    if (next.some((file) => !["image/jpeg", "image/png"].includes(file.type) || file.size <= 0 || file.size > MAX_FILE)) {
      setError("Envie apenas JPG ou PNG de até 4 MiB por imagem.");
      return;
    }
    if (files.length + next.length + data.images.length - removed.length > 20) {
      setError("O limite é 20 fotos por anúncio.");
      return;
    }
    setFiles((list) => [...list, ...next]);
    setError("");
  }

  const visibleExistingImages = useMemo(
    () => data.images.filter((_, index) => !removed.includes(data.imageIds?.[index] ?? -1)),
    [data.images, data.imageIds, removed],
  );

  const allPreviewImages = [...visibleExistingImages, ...previews];
  const reviewImage = allPreviewImages[0] ?? "/images/car-placeholder.svg";

  function stepValid(target = step) {
    if (target === 1) {
      return Boolean(data.brand.trim() && data.model.trim() && YEARS.includes(data.year) && data.mileageKm !== "");
    }
    if (target === 2) {
      return Boolean(data.fuel && data.transmission && data.color.trim() && data.category);
    }
    if (target === 3) return true;
    if (target === 4) {
      return Boolean(Number(data.price) > 0 && data.description.trim().length >= 20 && completeHistory(data.vehicleHistory));
    }
    if (target === 5) {
      return Boolean(data.city.trim() && data.state);
    }
    return true;
  }

  function nextStep() {
    setError("");
    if (!stepValid()) {
      setError("Preencha os campos obrigatórios desta etapa antes de continuar.");
      return;
    }
    setStep((value) => Math.min(6, value + 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function previousStep() {
    setError("");
    setStep((value) => Math.max(1, value - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function save() {
    if (busy) return;
    setBusy(true);
    setError("");
    let id = createdId || carId;

    try {
      const payloadObject = {
        ...data,
        year: Number(data.year),
        price: Number(data.price),
        mileageKm: Number(data.mileageKm),
        vehicleHistory: data.vehicleHistory,
      };
      const payload = JSON.stringify(payloadObject);

      if (!id) {
        const response = await fetch("/api/cars", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payloadObject),
        });
        const json = await response.json();
        if (!response.ok) throw new Error(json.error || "Não foi possível cadastrar o anúncio.");
        id = json.id;
        setCreatedId(id!);
        savedPayload.current = payload;
      } else if (savedPayload.current !== payload) {
        const response = await fetch(`/api/cars/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payloadObject),
        });
        const json = await response.json();
        if (!response.ok) throw new Error(json.error || "Não foi possível editar o anúncio.");
        savedPayload.current = payload;
      }

      if (!id) throw new Error("Não foi possível identificar o anúncio salvo.");

      for (const photoId of removed) {
        if (photoId < 0) continue;
        const response = await fetch(`/api/cars/${id}/photos?fotoId=${photoId}`, { method: "DELETE" });
        if (!response.ok) throw new Error("Anúncio salvo, mas uma imagem antiga não pôde ser removida.");
      }

      for (const file of files) {
        const form = new FormData();
        form.append("fotos", file);
        const response = await fetch(`/api/cars/${id}/photos`, { method: "POST", body: form });
        if (!response.ok) {
          const json = await response.json().catch(() => ({}));
          throw new Error(json.error || "Anúncio salvo, mas uma foto não pôde ser enviada.");
        }
      }

      if (mode === "create") {
        await documents.submit(id);
        setSuccessId(id);
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        router.push(`/meus-anuncios?salvo=${id}`);
        router.refresh();
      }
    } catch (cause) {
      setError((cause instanceof Error ? cause.message : "Falha de conexão.") + (id ? " Os dados salvos estão em Meus anúncios." : ""));
    } finally {
      setBusy(false);
    }
  }

  const input = (
    label: string,
    key: keyof SellFormData,
    opts?: { type?: string; required?: boolean; min?: number; max?: number; placeholder?: string },
  ) => (
    <label className="sell-field">
      <span>{label}{opts?.required && <em>*</em>}</span>
      <input
        type={opts?.type || "text"}
        required={opts?.required}
        min={opts?.min}
        max={opts?.max}
        placeholder={opts?.placeholder}
        value={String(data[key] || "")}
        onChange={(event) => update(key, event.target.value)}
      />
    </label>
  );

  if (successId) {
    return (
      <div className="sell-wizard-screen sell-success-screen">
        <SellTopBar />
        <main className="sell-success-content">
          <div className="sell-success-icon" aria-hidden="true">✓</div>
          <h1>Anúncio enviado para verificação!</h1>
          <p>Seu veículo foi cadastrado com sucesso e está em análise. Assim que for aprovado, poderá ser publicado no Auto Minas.</p>

          <div className="sell-success-card">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={reviewImage} alt="" />
            <div>
              <strong>{data.brand} {data.model}</strong>
              <span>{formatPrice(Number(data.price || 0))}</span>
            </div>
            <span className="sell-status-pill">Em análise</span>
          </div>

          <Link href="/meus-anuncios" className="sell-primary-action">Ver meus anúncios</Link>
          <button
            type="button"
            className="sell-secondary-action"
            onClick={() => {
              setData(EMPTY);
              setFiles([]);
              setPreviews([]);
              setRemoved([]);
              setCreatedId(null);
              setSuccessId(null);
              setStep(1);
              setError("");
              savedPayload.current = null;
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          >
            + Anunciar outro veículo
          </button>
        </main>
      </div>
    );
  }

  return (
    <div className="sell-wizard-screen">
      <SellTopBar />

      <main className="sell-wizard-content">
        <header className="sell-wizard-heading">
          <div>
            <h1>{mode === "edit" ? "Editar anúncio" : "Anunciar veículo"}</h1>
            <p>{mode === "edit" ? "Atualize as informações do veículo." : "Cadastre as informações do seu veículo."}</p>
          </div>
          <div className="sell-wizard-car-accent" aria-hidden="true">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/demo/hb20.jpg" alt="" />
          </div>
        </header>

        <div className="cult-wizard-progress" role="progressbar" aria-label="Progresso do cadastro de veículo" aria-valuemin={1} aria-valuemax={6} aria-valuenow={step}><span style={{ width: `${(step / 6) * 100}%` }} /></div>
        <ol className="sell-stepper cult-wizard-stepper" aria-label="Etapas do anúncio">
          {STEPS.map((item) => {
            const done = item.number < step;
            const active = item.number === step;
            return (
              <li key={item.number} className={`${done ? "is-done" : ""} ${active ? "is-active" : ""}`}>
                <button
                  type="button"
                  onClick={() => {
                    if (item.number <= step || STEPS.slice(0, item.number - 1).every((_, index) => stepValid(index + 1))) {
                      setStep(item.number);
                      setError("");
                    }
                  }}
                  aria-current={active ? "step" : undefined}
                >
                  <span>{done ? "✓" : item.number}</span>
                  <small>{item.short}</small>
                </button>
              </li>
            );
          })}
        </ol>

        <div className="sell-step-meta cult-wizard-current">Etapa {step} de 6</div>

        <section className="sell-step-card">
          <div className="sell-step-title">
            <span className="sell-step-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <StepIcon type={step === 1 ? "car" : step === 2 ? "spec" : step === 3 ? "photo" : step === 4 ? "price" : step === 5 ? "location" : "review"} />
              </svg>
            </span>
            <div>
              <h2>{currentStep.title}</h2>
              <p>{currentStep.subtitle}</p>
            </div>
          </div>

          {step === 1 && (
            <div className="sell-fields-grid">
              <label className="sell-field">
                <span>Marca <em>*</em></span>
                <select required value={data.brand} onChange={(event) => update("brand", event.target.value)}>
                  <option value="">Selecione</option>
                  {BRANDS.map((brand) => <option key={brand}>{brand}</option>)}
                </select>
              </label>
              {input("Modelo", "model", { required: true, placeholder: "Ex.: Hilux" })}
              <label className="sell-field">
                <span>Ano <em>*</em></span>
                <select required value={data.year} onChange={(event) => update("year",event.target.value)}>
                  <option value="" disabled>Selecione o ano</option>
                  {YEARS.map((year) => <option key={year} value={year}>{year}</option>)}
                </select>
              </label>
              {input("Quilometragem", "mileageKm", { type: "number", min: 0, required: true, placeholder: "56300" })}
            </div>
          )}

          {step === 2 && (
            <div className="sell-fields-grid">
              <label className="sell-field">
                <span>Combustível <em>*</em></span>
                <select required value={data.fuel} onChange={(event) => update("fuel", event.target.value)}>
                  <option value="">Selecione</option>
                  {FUEL_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </label>

              <label className="sell-field">
                <span>Câmbio <em>*</em></span>
                <select required value={data.transmission} onChange={(event) => update("transmission", event.target.value)}>
                  <option value="">Selecione</option>
                  {TRANSMISSION_OPTIONS.filter((option) => option.value !== "cvt").map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </label>

              {input("Cor", "color", { required: true, placeholder: "Ex.: Branco" })}

              <label className="sell-field">
                <span>Categoria <em>*</em></span>
                <select value={data.category} onChange={(event) => update("category", event.target.value)}>
                  <option value="SEMINOVOS">Seminovos</option>
                  <option value="PREMIUM">Premium</option>
                  <option value="BLINDADOS">Blindados</option>
                  <option value="CONSIGNACAO">Consignação</option>
                  {data.category === "MOTOS" && <option value="MOTOS" disabled>Categoria legada: Moto (não disponível)</option>}
                </select>
              </label>

            </div>
          )}

          {step === 3 && (
            <div className="sell-photo-step">
              <label className="sell-photo-drop">
                <input
                  type="file"
                  accept="image/jpeg,image/png"
                  multiple
                  onChange={(event) => {
                    addPhotos(event.target.files);
                    event.target.value = "";
                  }}
                />
                <svg viewBox="0 0 24 24" aria-hidden="true"><StepIcon type="photo" /></svg>
                <strong>Adicionar fotos</strong>
                <span>JPG ou PNG, até 20 imagens</span>
              </label>

              <div className="sell-photo-grid">
                {visibleExistingImages.map((url, index) => (
                  <div key={url} className="sell-photo-thumb">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt={`Foto ${index + 1} do veículo`} />
                    {index === 0 && <span>Principal</span>}
                    <button type="button" aria-label="Remover foto" onClick={() => setRemoved((current) => [...current, data.imageIds?.[index] ?? -1])}>×</button>
                  </div>
                ))}
                {previews.map((url, index) => (
                  <div key={url} className="sell-photo-thumb">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt={`Prévia ${index + 1}`} />
                    {visibleExistingImages.length === 0 && index === 0 && <span>Principal</span>}
                    <button type="button" aria-label="Remover prévia" onClick={() => setFiles((current) => current.filter((_, fileIndex) => fileIndex !== index))}>×</button>
                  </div>
                ))}
              </div>

              <p className="sell-photo-note">{allPreviewImages.length} de 20 fotos adicionadas · máximo de 4 MiB por arquivo.</p>
            </div>
          )}

          {step === 4 && (
            <div className="sell-price-step">
              {input("Preço do veículo", "price", { type: "number", min: 1, required: true, placeholder: "289900" })}


              <label className="sell-field">
                <span>Descrição <em>*</em></span>
                <textarea
                  required
                  minLength={20}
                  maxLength={255}
                  value={data.description}
                  onChange={(event) => update("description", event.target.value)}
                  placeholder="Descreva o estado de conservação, revisões e detalhes do veículo."
                />
                <small>{data.description.length}/255</small>
              </label>


              <fieldset className="sell-history-section">
                <legend>Histórico e condições do veículo</legend>
                <p>Informações declaradas pelo vendedor, não verificadas pelo Auto Minas. Responda às sete perguntas.</p>
                {HISTORY_QUESTIONS.map(({key,label}) => (
                  <div className="sell-history-question" key={key}>
                    <label htmlFor={`history-${key}`}>
                      {label} <em>*</em>
                    </label>
                    <select
                      id={`history-${key}`}
                      required
                      value={data.vehicleHistory[key]}
                      onChange={(event)=>updateHistory(key, event.target.value)}
                    >
                      <option value="" disabled>Selecione uma resposta</option>
                      {HISTORY_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                    {data.vehicleHistory[key] === "SIM" && (
                      <textarea
                        maxLength={500}
                        placeholder="Descreva o ocorrido (opcional)"
                        value={data.vehicleHistory[historyDetailKey(key)]}
                        onChange={(event)=>updateHistory(historyDetailKey(key), event.target.value)}
                      />
                    )}
                  </div>
                ))}
              </fieldset>

              <div className="sell-fields-grid">
                {input("Documentação informada", "documentation", { placeholder: "A verificar" })}
                {input("Garantia declarada", "warranty", { placeholder: "Não informada" })}
                {input("Laudo cautelar", "inspectionReport", { placeholder: "Não informado" })}
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="sell-location-step">
              <div className="sell-fields-grid">
                <label className="sell-field">
                  <span>Estado <em>*</em></span>
                  <select required value={data.state} onChange={(event) => update("state", event.target.value)}>
                    <option value="">Selecione</option>
                    {UF_LIST.map((uf) => <option key={uf} value={uf}>{uf}</option>)}
                  </select>
                </label>
                {input("Cidade", "city", { required: true, placeholder: "Ex.: Belo Horizonte" })}
              </div>

              {mode === "create" && (
                <div className="sell-wizard-documents">
                  {documents.fields}
                </div>
              )}
            </div>
          )}

          {step === 6 && (
            <div className="sell-review-step">
              <div className="sell-review-vehicle">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={reviewImage} alt="" />
                <div>
                  <strong>{data.brand || "Marca"} {data.model || "Modelo"}</strong>
                  <p>{data.year} · {data.fuel || "Combustível"} · {data.transmission || "Câmbio"}</p>
                  <span>{formatPrice(Number(data.price || 0))}</span>
                </div>
              </div>

              {[
                ["Dados do veículo", `${data.brand} · ${data.model} · ${data.year} · ${data.mileageKm || 0} km`, 1],
                ["Características", `${data.fuel || "—"} · ${data.transmission || "—"} · ${data.color || "—"} · ${data.category}`, 2],
                ["Fotos", `${allPreviewImages.length} foto(s) adicionada(s)`, 3],
                ["Preço e anúncio", `${formatPrice(Number(data.price || 0))} · Histórico declarado`, 4],
                ["Localização", `${data.city || "—"} · ${data.state || "—"}`, 5],
              ].map(([title, summary, target]) => (
                <button key={String(title)} type="button" className="sell-review-row" onClick={() => setStep(Number(target))}>
                  <span>
                    <strong>{title}</strong>
                    <small>{summary}</small>
                  </span>
                  <em>Editar</em>
                </button>
              ))}

              <div className="sell-review-warning">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 5 6v5c0 4.5 2.9 8.1 7 10 4.1-1.9 7-5.5 7-10V6l-7-3Z"/><path d="m9 12 2 2 4-4"/></svg>
                <p>Seu anúncio será enviado como pendente e passará pela análise de segurança antes de qualquer publicação.</p>
              </div>
            </div>
          )}

          {error && <p className="sell-wizard-error" role="alert">{error}</p>}
        </section>

        <div className="sell-wizard-actions">
          {step > 1 ? (
            <button type="button" className="sell-back-action" onClick={previousStep}>← Voltar</button>
          ) : (
            <HistoryBackButton fallback="/" className="sell-back-action">← Voltar</HistoryBackButton>
          )}

          {step < 6 ? (
            <button type="button" className="sell-primary-action" onClick={nextStep}>Próxima etapa →</button>
          ) : (
            <button type="button" className="sell-primary-action" disabled={busy} onClick={() => void save()}>
              {busy ? "Enviando…" : mode === "edit" ? "Salvar alterações" : "Enviar para análise"}
            </button>
          )}
        </div>
      </main>
    </div>
  );
}

function SellTopBar() {
  return (
    <header className="sell-wizard-topbar">
      <HistoryBackButton fallback="/" className="sell-wizard-back" ariaLabel="Voltar">←</HistoryBackButton>
      <Link href="/" className="sell-wizard-brand" aria-label="Auto Minas">
        <span>AM</span>
        <strong>Auto Minas</strong>
      </Link>
    </header>
  );
}
