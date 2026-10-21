import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/legal-page";

export const metadata: Metadata = {
  title: "Política de privacitat",
  description: "Com tracta Diagnosi IA les dades dels centres, responsables i docents participants.",
};

export default function PrivacyPage() {
  return (
    <LegalPage title="Política de privacitat">
      <section>
        <h2>1. Servei i contacte</h2>
        <p>Diagnosi IA, disponible a <a href="https://diagnosia.edigital.cat/">diagnosia.edigital.cat</a>,
          facilita una diagnosi de la competència digital docent en intel·ligència artificial.
          Cada centre gestiona el seu espai i consulta resultats de conjunt.</p>
        <p>Contacte del projecte i per a consultes de privacitat: <a href="mailto:rbarrach@xtec.cat">rbarrach@xtec.cat</a>.
          Aquest contacte no pressuposa la condició de responsable del tractament.
          La identitat i el repartiment de responsabilitats entre el prestador del
          servei i els centres, així com la base jurídica de cada finalitat, estan
          pendents de confirmar abans de l’obertura a ús real.</p>
      </section>
      <section>
        <h2>2. Dades i finalitats</h2>
        <ul>
          <li><strong>Centres:</strong> codi, nom oficial, municipi, àrea territorial i servei educatiu,
            obtinguts de fonts institucionals públiques, per identificar l’espai.</li>
          <li><strong>Responsables i administradors:</strong> identificador opac del compte Google,
            correu, nom visible i dades de gestió i d’accés necessàries per administrar
            el servei. Es conserven separats de les respostes docents.</li>
          <li><strong>Professorat:</strong> Google proporciona l’identificador de compte,
            el correu verificat i el domini Workspace per autenticar i validar l’accés.
            No es demana el nom ni el perfil nominal. El correu només es conserva
            temporalment a la sessió docent, durant un màxim de vuit hores;
            no es desa a la base de dades, als logs de l’aplicació ni als informes.</li>
          <li><strong>Participació:</strong> respostes tancades, versió del qüestionari,
            data tècnica i una vinculació separada amb un identificador pseudònim
            derivat del compte Google mitjançant HMAC. Permet evitar duplicats i
            recuperar exclusivament les respostes i els resultats propis.</li>
        </ul>
        <p>La participació és pseudonimitzada, no anònima. No es creen perfils docents
          ni es recullen respostes obertes. El codi de l’aplicació no registra IP,
          informació del dispositiu ni correus de participants als logs.
          Cal validar aquesta mateixa minimització en la configuració de
          l’allotjament i del servidor web abans d’obrir el servei.</p>
      </section>
      <section>
        <h2>3. Qui pot consultar els resultats</h2>
        <p>Només el docent autenticat pot consultar i descarregar el PDF de la seva
          participació pròpia. El centre, els administradors i qui disposi de l’enllaç
          privat de resultats accedeixen exclusivament a resultats de conjunt,
          sense correus, identificadors ni files de respostes individuals.</p>
        <p>Els resultats de centre poden estar disponibles des de la primera resposta.
          Amb poques participacions cal prudència: la pseudonimització i l’agregació
          no eliminen tots els riscos d’inferència. No s’han d’utilitzar per
          identificar ni avaluar individualment el professorat.</p>
      </section>
      <section>
        <h2>4. Google i altres proveïdors</h2>
        <p>L’autenticació es fa amb Google i es demanen només els permisos d’identitat
          necessaris: identificació i correu; també perfil per als responsables.
          No es demana accés al contingut de Gmail, Drive ni altres documents,
          i les respostes del qüestionari no s’envien a Google per autenticar-se.
          Pots consultar la <a href="https://policies.google.com/privacy">política de privacitat de Google</a>.</p>
        <p>La identificació dels proveïdors d’allotjament i còpies, la ubicació de les
          dades i les possibles transferències internacionals amb les seves garanties
          s’han de completar abans de l’ús real. No es pot afirmar que totes les dades
          es tractin exclusivament a la Unió Europea sense aquesta comprovació.</p>
      </section>
      <section>
        <h2>5. Conservació i supressió</h2>
        <p>La sessió docent caduca en un màxim de vuit hores. Les respostes no enviades
          només es mantenen a la memòria de la pàgina oberta i es perden en tancar-la
          o recarregar-la.</p>
        <p>Les participacions es conserven mentre existeix l’espai; s’eliminen de la
          base activa quan es reinicien les respostes o s’elimina l’espai o la versió
          associada. No hi ha caducitat automàtica ni un botó de supressió individual.
          El registre mínim d’actuacions administratives es conserva separat i no
          conté respostes ni identitat docent.</p>
        <p>Els terminis de retenció i purga de les còpies de seguretat estan pendents
          de definir. Eliminar dades de la base activa no garanteix la seva
          desaparició immediata de les còpies ni dels PDF ja descarregats.</p>
      </section>
      <section>
        <h2>6. Drets i consultes</h2>
        <p>Pots contactar a <a href="mailto:rbarrach@xtec.cat">rbarrach@xtec.cat</a> per
          consultes i sol·licituds d’accés, rectificació, supressió, oposició,
          limitació o portabilitat, quan siguin aplicables. La tramitació ha de
          verificar la titularitat de manera segura, sense comunicar les respostes
          individuals al centre. No enviïs respostes, tokens ni contrasenyes per correu.</p>
        <p>Pots presentar una reclamació davant l’autoritat de protecció de dades
          competent. L’<a href="https://apdcat.gencat.cat/">APDCAT</a> i
          l’<a href="https://www.aepd.es/">AEPD</a> ofereixen informació sobre drets
          i àmbits de competència.</p>
      </section>
      <section>
        <h2>7. Cookies i preferències</h2>
        <p>L’aplicació utilitza cookies funcionals per a les sessions separades de
          responsables i docents, l’estat temporal d’OAuth i l’idioma escollit.
          La cookie docent és HttpOnly, signada però no xifrada, i en producció
          s’envia per HTTPS. El tema visual es conserva localment al navegador.</p>
        <p>No s’incorporen eines d’analítica, publicitat ni seguiment del professorat.
          Les cookies pròpies del procés d’autenticació de Google es regeixen per
          la seva política.</p>
      </section>
    </LegalPage>
  );
}
