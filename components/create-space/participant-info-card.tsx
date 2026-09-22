"use client";

import { useTranslations } from "@/components/i18n/language-settings-provider";

export function ParticipantInfoCard() {
  const copy = useTranslations().centre;
  return (
    <div className="flex h-full flex-col justify-start rounded-md border border-line bg-surface p-6 text-center shadow-sm">
      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-action">
          {copy.answerQuestionnaire}
        </p>
        <h2 className="text-xl font-semibold text-ink">{copy.iAmTeacher}</h2>
        <p className="text-sm leading-6 text-muted">
          {copy.teacherLinkHelp}
        </p>
      </div>
    </div>
  );
}
