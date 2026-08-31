const QUESTION_OPTIONS = [
  { label: "Gens / No ho faig", value: 0 },
  { label: "Una mica / Ocasionalment", value: 1 },
  { label: "Bastant / Habitualment", value: 2 },
  { label: "Molt / Soc un referent al centre", value: 3 },
] as const;

export function QuestionPreview() {
  return (
    <section
      aria-labelledby="question-preview-title"
      className="home-question-showcase relative overflow-hidden border-t border-line px-5 py-24 sm:px-8 sm:py-32"
    >
      <div aria-hidden="true" className="home-question-grid absolute inset-0" />
      <div aria-hidden="true" className="home-question-orb" />

      <div className="relative mx-auto max-w-6xl">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-action">
            Una mirada al qüestionari
          </p>
          <h2
            className="mt-4 text-balance text-3xl font-semibold tracking-[-0.035em] sm:text-5xl"
            id="question-preview-title"
          >
            Preguntes clares per obtenir una visió compartida
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-muted">
            El professorat respon 20 afirmacions breus distribuïdes en cinc
            blocs. Cada pregunta ofereix quatre nivells de resposta.
          </p>
        </div>

        <div className="home-question-frame relative mx-auto mt-14 max-w-5xl rounded-[2rem] border border-line p-2.5 sm:p-4">
          <div
            aria-label="Exemple de la primera pregunta del qüestionari"
            className="home-question-paper rounded-[1.45rem] border border-line p-6 sm:p-9 lg:p-11"
            role="group"
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex rounded-full bg-accent-soft px-3 py-1 text-xs font-semibold uppercase tracking-[0.13em] text-action">
                  Exemple
                </span>
              </div>
              <span className="text-sm font-semibold text-muted">
                Pregunta 1 de 20
              </span>
            </div>

            <div
              aria-label="Progrés de l’exemple: 5 %"
              className="mt-5 h-2 overflow-hidden rounded-full bg-accent-soft"
              role="img"
            >
              <div className="home-question-progress h-full w-[5%] rounded-full" />
            </div>

            <div className="mt-9">
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-action">
                Bloc 1 · Alfabetització i ús crític de la IA
              </p>
              <h3 className="mt-4 max-w-4xl text-balance text-2xl font-semibold leading-tight tracking-[-0.025em] sm:text-3xl lg:text-4xl">
                <span className="mr-2 text-action">1.1.</span>
                Identifico oportunitats i limitacions de la IA en contextos
                educatius.
              </h3>
            </div>

            <ul
              aria-label="Opcions de resposta de l’exemple"
              className="mt-8 grid gap-3 sm:grid-cols-2"
            >
              {QUESTION_OPTIONS.map((option) => (
                <li
                  className={`home-scale-option home-scale-option-${option.value} flex min-h-20 items-center gap-4 rounded-2xl border px-4 py-4 sm:px-5`}
                  key={option.value}
                >
                  <span
                    aria-hidden="true"
                    className="home-scale-number inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold"
                  >
                    {option.value}
                  </span>
                  <span className="font-medium leading-6 text-ink">
                    {option.label}
                  </span>
                </li>
              ))}
            </ul>

            <div className="mt-7 flex items-start gap-3 rounded-2xl bg-accent-soft px-4 py-3.5 text-sm leading-6 text-muted sm:items-center">
              <PreviewIcon />
              <p>
                Aquesta mostra és només informativa: no permet seleccionar cap
                resposta ni envia cap dada.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function PreviewIcon() {
  return (
    <svg
      aria-hidden="true"
      className="mt-1 h-5 w-5 shrink-0 text-action sm:mt-0"
      fill="none"
      viewBox="0 0 24 24"
    >
      <path
        d="M12 3 5.5 5.7v5.7c0 4.2 2.6 7.7 6.5 9.6 3.9-1.9 6.5-5.4 6.5-9.6V5.7L12 3Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
      <path
        d="m9.1 12.1 1.9 1.9 4-4"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}
