"use client";

import { useTranslations } from "@/components/i18n/language-settings-provider";

export function QuestionPreview() {
  const messages = useTranslations();
  const copy = messages.home;
  return (
    <section
      aria-labelledby="question-preview-title"
      className="home-question-showcase relative flex min-h-[100svh] items-center overflow-hidden border-t border-line px-5 py-20 sm:px-8 sm:py-24 lg:py-8"
      id="mostra-questionari"
    >
      <div aria-hidden="true" className="home-question-grid absolute inset-0" />
      <div aria-hidden="true" className="home-question-orb" />

      <div className="relative mx-auto w-full max-w-6xl">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-action">
            {copy.previewEyebrow}
          </p>
          <h2
            className="mt-4 text-balance text-3xl font-semibold tracking-[-0.035em] sm:text-4xl lg:mt-2"
            id="question-preview-title"
          >
            {copy.previewTitle}
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-muted lg:mt-3 lg:text-base lg:leading-7">
            {copy.previewIntro}
          </p>
        </div>

        <div className="home-question-frame relative mx-auto mt-14 max-w-5xl rounded-[2rem] border border-line p-2.5 sm:p-4 lg:mt-6 lg:p-3">
          <div
            aria-label={copy.previewGroup}
            className="home-question-paper rounded-[1.45rem] border border-line p-6 sm:p-9 lg:p-6"
            role="group"
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex rounded-full bg-accent-soft px-3 py-1 text-xs font-semibold uppercase tracking-[0.13em] text-action">
                  {copy.example}
                </span>
              </div>
              <span className="text-sm font-semibold text-muted">
                {copy.questionProgress}
              </span>
            </div>

            <div
              aria-label={copy.progressLabel}
              className="mt-5 h-2 overflow-hidden rounded-full bg-accent-soft lg:mt-3 lg:h-1.5"
              role="img"
            >
              <div className="home-question-progress h-full w-[5%] rounded-full" />
            </div>

            <div className="mt-9 lg:mt-5">
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-action">
                {copy.block}
              </p>
              <h3 className="mt-4 max-w-4xl text-balance text-2xl font-semibold leading-tight tracking-[-0.025em] sm:text-3xl lg:mt-2 lg:text-2xl">
                <span className="mr-2 text-action">1.1.</span>
                {copy.question}
              </h3>
            </div>

            <ul
              aria-label={copy.answerOptionsLabel}
              className="mt-8 grid gap-3 sm:grid-cols-2 lg:mt-5 lg:gap-2"
            >
              {copy.options.map((label, value) => (
                <li
                  className={`home-scale-option home-scale-option-${value} flex min-h-20 items-center gap-4 rounded-2xl border px-4 py-4 sm:px-5 lg:min-h-14 lg:py-2.5`}
                  key={value}
                >
                  <span
                    aria-hidden="true"
                    className="home-scale-number inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold lg:h-8 lg:w-8"
                  >
                    {value}
                  </span>
                  <span className="font-medium leading-6 text-ink">
                    {label}
                  </span>
                </li>
              ))}
            </ul>

            <div className="mt-7 flex items-start gap-3 rounded-2xl bg-accent-soft px-4 py-3.5 text-sm leading-6 text-muted sm:items-center lg:mt-4 lg:py-2.5">
              <PreviewIcon />
              <p>
                {copy.previewNotice}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-5 flex justify-center">
          <a
            aria-label={copy.teacherButton}
            className="home-scroll-cue flex h-9 w-6 justify-center rounded-full border border-line pt-2 transition hover:border-action focus:outline-none focus:ring-2 focus:ring-focus focus:ring-offset-2 focus:ring-offset-paper"
            href="#acces-docent"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-action" />
          </a>
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
