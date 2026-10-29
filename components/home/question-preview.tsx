"use client";

import { ca } from "@/lib/i18n/locales/ca";
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
            </div>

            <div className="mt-6 lg:mt-5" lang="ca">
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-action">
                {ca.home.block}
              </p>
              <p className="mt-2 text-sm font-medium text-muted">{ca.home.criterion}</p>
              <h3 className="mt-4 max-w-4xl text-balance text-2xl font-semibold leading-tight tracking-[-0.025em] sm:text-3xl lg:mt-2 lg:text-2xl">
                <span className="mr-2 text-action">1.1.1.</span>
                {ca.home.question}
              </h3>
            </div>

            <ul
              aria-label={copy.answerOptionsLabel}
              lang="ca"
              className="mt-8 grid gap-3 sm:grid-cols-2 lg:mt-5 lg:gap-2"
            >
              {ca.home.options.map((label, value) => (
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
