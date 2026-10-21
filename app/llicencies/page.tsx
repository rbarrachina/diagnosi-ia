import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/legal-page";

export const metadata: Metadata = { title: "Llicències" };

export default function LicensesPage() {
  return (
    <LegalPage title="Llicències" draft={false}>
      <section>
        <h2>Codi de Diagnosi IA</h2>
        <p>El projecte es distribueix sota la llicència Apache 2.0.</p>
        <p><a href="https://www.apache.org/licenses/LICENSE-2.0">Consulta el text complet d’Apache 2.0</a>.</p>
      </section>
      <section>
        <h2>Components de tercers</h2>
        <p>Les biblioteques i els recursos de tercers mantenen les seves llicències
          i avisos d’autoria.</p>
        <p><a href="/THIRD_PARTY_NOTICES.txt">Consulta els textos i avisos de les llicències de tercers</a>.</p>
      </section>
    </LegalPage>
  );
}
