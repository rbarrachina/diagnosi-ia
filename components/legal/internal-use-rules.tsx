export function InternalUseRules() {
  return (
    <div className="space-y-8">
      <section>
        <h3>1. Finalitat del servei</h3>
        <p>Diagnosi IA és una eina de reflexió educativa sobre la competència digital
          docent en intel·ligència artificial. Els resultats orienten la formació i
          la planificació del centre; no constitueixen una certificació ni una
          avaluació laboral individual.</p>
        <p>El servei s’ofereix a <a href="https://diagnosia.edigital.cat/">diagnosia.edigital.cat</a>.
          Contacte: <span>XXXXXX</span>.
          La identificació definitiva del prestador resta pendent de confirmar.
          L’ús de comptes XTEC no implica per si mateix que el servei sigui oficial
          ni que estigui avalat pel Departament d’Educació.</p>
      </section>
      <section>
        <h3>2. Accés dels centres i del professorat</h3>
        <p>Aquest desplegament es destina a ús intern de l’organització Google
          Workspace a què pertany el projecte OAuth. Els responsables i docents
          utilitzen comptes XTEC autoritzats, sempre que pertanyin a aquesta
          organització. No s’hi admeten comptes de centres d’altres organitzacions
          Workspace. El servidor també comprova la política de domini de l’espai
          en accedir i en enviar les respostes.</p>
        <p>Google autentica el compte; això no concedeix automàticament accés a
          qualsevol espai. Cada docent només pot enviar una participació per espai
          amb el mateix compte i recuperar-ne els resultats propis.</p>
      </section>
      <section>
        <h3>3. Ús responsable</h3>
        <ul>
          <li>Utilitza el compte institucional autoritzat i respon amb criteri propi.</li>
          <li>No intentis identificar participants ni reconstruir-ne les respostes.</li>
          <li>No utilitzis els resultats per classificar o sancionar individualment el professorat.</li>
          <li>Protegeix l’enllaç privat de resultats i comparteix-lo només amb les persones previstes.</li>
          <li>No intentis accedir a espais aliens, eludir controls ni interferir en el servei.</li>
        </ul>
      </section>
      <section>
        <h3>4. Resultats i disponibilitat</h3>
        <p>Els resultats es basen en les respostes declarades i en la versió del
          qüestionari. Cal interpretar-los en el seu context, especialment amb
          poques respostes. Els rols institucionals només disposen d’agregats;
          el resultat i el PDF individual són exclusius del docent propietari.</p>
        <p>El servei pot tenir interrupcions de manteniment o incidències. Els
          administradors poden suspendre un centre o eliminar-ne les dades segons
          les funcions de gestió documentades. Reiniciar o eliminar un espai
          pot fer que les participacions deixin d’estar disponibles.</p>
      </section>
      <section>
        <h3>5. Privacitat i llicències</h3>
        <p>El tractament de dades es descriu a la <a href="/privacitat">política de
          privacitat</a>. Iniciar sessió amb Google no substitueix la definició de
          la base jurídica del tractament ni la informació que correspongui facilitar
          als participants.</p>
        <p>El codi del projecte es distribueix sota la llicència Apache 2.0.
          Els components de tercers mantenen les seves llicències, consultables als
          <a href="/THIRD_PARTY_NOTICES.txt"> avisos de tercers</a>.
          La llicència del codi no autoritza l’accés a dades de participants.</p>
      </section>
    </div>
  );
}
