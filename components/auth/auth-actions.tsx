"use client";

import { InterfaceText, useInterfaceTranslator } from "@/components/i18n/interface-text";

import type { ResponsibleAccessMode } from "@/lib/auth/responsible-access";
import { useTranslations } from "@/components/i18n/language-settings-provider";

type LoginButtonProps = {
  label?: string;
  next?: string;
};

export function LoginButton({
  label,
  next = "/crear",
}: LoginButtonProps) {
  const t = useInterfaceTranslator();
  return (
    <a
      className="inline-flex rounded-md bg-action px-5 py-3 text-sm font-semibold text-action-contrast transition hover:bg-action-hover"
      href={`/auth/login?next=${encodeURIComponent(next)}`}
    >
      {label ?? t("accedeixAmbElCompteXtec")}
    </a>
  );
}

type LogoutButtonProps = {
  className?: string;
  label?: string;
  next?: string;
};

export function LogoutButton({
  className = "inline-flex h-10 items-center rounded-md border border-line bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-action hover:text-action",
  label,
  next = "/",
}: LogoutButtonProps) {
  const messages = useTranslations();
  return (
    <form action={`/auth/logout?next=${encodeURIComponent(next)}`} method="post">
      <button
        className={className}
        type="submit"
      >
        {label ?? messages.common.logout}
      </button>
    </form>
  );
}

type XtecAccessNoticeProps = {
  responsibleAccessMode?: ResponsibleAccessMode;
  next?: string;
};

export function XtecAccessNotice({
  responsibleAccessMode = "all_xtec",
  next = "/crear",
}: XtecAccessNoticeProps) {
  const t = useInterfaceTranslator();
  const isCentreOnly = responsibleAccessMode === "centre_xtec";

  return (
    <div className="flex h-full flex-col justify-center rounded-md border border-line bg-white p-6 text-center shadow-sm">
      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-action">
          <InterfaceText messageKey="crearQuestionari" />
        </p>
        <h2 className="text-xl font-semibold text-ink"><InterfaceText messageKey="socResponsable" /></h2>
        <p className="mx-auto max-w-md text-sm leading-6 text-slate-700">
          {isCentreOnly ? (
            <strong className="font-semibold text-ink">
              <InterfaceText messageKey="nomesPodenAccedirAmbUnCorreuElectronicDeCentreXtecCat" />
            </strong>
          ) : (
            t("perCrearIGestionarQuestionarisCalAccedirAmbUnCompteXtec")
          )}
        </p>
      </div>
      <div className="mt-5">
        <LoginButton next={next} />
      </div>
    </div>
  );
}

export function XtecForbiddenNotice() {
  return (
    <div className="rounded-md border border-red-200 bg-red-50 p-6 text-center text-red-900 shadow-sm">
      <h2 className="text-xl font-semibold"><InterfaceText messageKey="accesNoAutoritzat" /></h2>
      <p className="mt-3 text-sm leading-6">
        <InterfaceText messageKey="nomesEsPermetLAccesAmbUnCompteXtec" />
      </p>
      <div className="mt-5 flex justify-center">
        <LogoutButton next="/" />
      </div>
    </div>
  );
}

type ResponsibleForbiddenNoticeProps = {
  reason?: "not_xtec" | "not_centre_xtec" | "prelaunch" | "suspended";
};

export function ResponsibleForbiddenNotice({
  reason = "not_xtec",
}: ResponsibleForbiddenNoticeProps) {
  const messages = useTranslations();
  const copy = messages.centre;
  return (
    <div className="rounded-md border border-red-200 bg-red-50 p-6 text-center text-red-900 shadow-sm">
      <h2 className="text-xl font-semibold">{messages.common.unauthorized}</h2>
      <p className="mt-3 text-sm leading-6">
        {reason === "prelaunch"
          ? copy.prelaunchForbidden
          : reason === "suspended"
          ? copy.suspendedForbidden
          : reason === "not_centre_xtec"
          ? copy.centreAccountForbidden
          : copy.xtecForbidden}
      </p>
      <div className="mt-5 flex justify-center">
        <LogoutButton next="/" />
      </div>
    </div>
  );
}
