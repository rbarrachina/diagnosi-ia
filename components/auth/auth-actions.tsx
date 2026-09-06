import type { ResponsibleAccessMode } from "@/lib/auth/responsible-access";

type LoginButtonProps = {
  label?: string;
  next?: string;
};

export function LoginButton({
  label = "Accedeix amb el compte XTEC",
  next = "/crear",
}: LoginButtonProps) {
  return (
    <a
      className="inline-flex rounded-md bg-action px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#1f5d68]"
      href={`/auth/login?next=${encodeURIComponent(next)}`}
    >
      {label}
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
  label = "Tanca sessió",
  next = "/",
}: LogoutButtonProps) {
  return (
    <form action={`/auth/logout?next=${encodeURIComponent(next)}`} method="post">
      <button
        className={className}
        type="submit"
      >
        {label}
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
  const isCentreOnly = responsibleAccessMode === "centre_xtec";

  return (
    <div className="flex h-full flex-col justify-center rounded-md border border-line bg-white p-6 text-center shadow-sm">
      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-action">
          Crear qüestionari
        </p>
        <h2 className="text-xl font-semibold text-ink">Soc responsable</h2>
        <p className="mx-auto max-w-md text-sm leading-6 text-slate-700">
          {isCentreOnly ? (
            <strong className="font-semibold text-ink">
              Només poden accedir amb un correu electrònic de centre
              @xtec.cat amb codi de centre, per exemple a0123456@xtec.cat.
            </strong>
          ) : (
            "Per crear i gestionar qüestionaris cal accedir amb un compte XTEC."
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
      <h2 className="text-xl font-semibold">Accés no autoritzat</h2>
      <p className="mt-3 text-sm leading-6">
        Només es permet l’accés amb un compte XTEC.
      </p>
      <div className="mt-5 flex justify-center">
        <LogoutButton next="/" />
      </div>
    </div>
  );
}

type ResponsibleForbiddenNoticeProps = {
  reason?: "not_xtec" | "not_centre_xtec" | "suspended";
};

export function ResponsibleForbiddenNotice({
  reason = "not_xtec",
}: ResponsibleForbiddenNoticeProps) {
  return (
    <div className="rounded-md border border-red-200 bg-red-50 p-6 text-center text-red-900 shadow-sm">
      <h2 className="text-xl font-semibold">Accés no autoritzat</h2>
      <p className="mt-3 text-sm leading-6">
        {reason === "suspended"
          ? "L’accés d’aquest centre està suspès. Contacta amb l’administració de l’aplicació."
          : reason === "not_centre_xtec"
          ? "Cal accedir amb un correu electrònic de centre @xtec.cat amb codi de centre, o amb un compte administrador actiu."
          : "Només es permet l'accés amb un compte XTEC."}
      </p>
      <div className="mt-5 flex justify-center">
        <LogoutButton next="/" />
      </div>
    </div>
  );
}
