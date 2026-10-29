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
              <p className="text-2xl font-bold tracking-[-0.03em] text-action-hover sm:text-3xl">
                {ca.home.block}
              </p>
              <p className="mt-2 text-lg font-semibold text-action sm:text-xl">{ca.home.criterion}</p>
              <h3 className="mt-4 w-full text-base font-semibold leading-7 text-ink sm:text-lg">
                <span className="mr-1">1.1.1.</span>
                {ca.home.question}
              </h3>
            </div>

            <ul
              aria-label={copy.answerOptionsLabel}
              lang="ca"
              className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:mt-5 lg:gap-2"
            >
              {ca.home.options.map((label, value) => (
                <li
                  className={`questionnaire-scale-option questionnaire-scale-option-${value} flex min-h-20 items-center gap-4 rounded-2xl border px-4 py-4 sm:px-5 lg:min-h-14 lg:py-2.5`}
                  key={value}
                >
                  <span className="font-medium leading-6 text-ink">
                    {label}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>


      </div>
    </section>
  );
}
