import { getServerInterfaceTranslator } from "@/lib/i18n/server-interface-messages";

import { InterfaceText } from "@/components/i18n/interface-text";
import Link from "next/link";

type AuthErrorPageProps = {
  searchParams: Promise<{
    reason?: string;
  }>;
};

export default async function AuthErrorPage({ searchParams }: AuthErrorPageProps) {
  const t = await getServerInterfaceTranslator();
  const { reason } = await searchParams;
  const serviceClosed = reason === "service-closed";
  const message =
    serviceClosed
      ? t("elServeiEncaraNoEstaDisponibleTornaHoAProvarQuan")
      : reason === "centre-access-closed"
      ? t("lAccesDelsCentresEncaraNoEstaDisponibleTornaHoA")
      : reason === "centre-suspended"
        ? t("lAccesDAquestCentreEstaSuspesContactaAmbLAdministracio")
      : reason === "centre-account-required"
        ? t("calAccedirAmbUnCompteOficialDeCentreXtecOAmb")
      : reason === "xtec"
      ? t("nomesEsPermetLAccesAmbUnCompteXtec")
      : reason === "participant-domain" || reason === "participant-access"
        ? t("noSHaPogutValidarLAccesDocentRevisaElCodi")
      : t("noSHaPogutCompletarLAutenticacio");

  return (
    <main className="min-h-screen bg-paper">
      <section className="mx-auto flex min-h-screen w-full max-w-xl flex-col items-center justify-center px-6 text-center">
        <div className="rounded-md border border-red-200 bg-red-50 p-6 text-red-900 shadow-sm">
          <h1 className="text-2xl font-semibold">
            {serviceClosed ? t("serveiEnPrellancament") : t("accesNoAutoritzat")}
          </h1>
          <p className="mt-3 text-sm leading-6">{message}</p>
          <Link
            className="mt-6 inline-flex rounded-md bg-action px-5 py-3 text-sm font-semibold text-action-contrast transition hover:bg-action-hover"
            href="/"
          ><InterfaceText messageKey="tornaALInici2" /></Link>
        </div>
      </section>
    </main>
  );
}
