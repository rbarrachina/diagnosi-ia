type LoginButtonProps = {
  next?: string;
};

export function LoginButton({ next = "/crear" }: LoginButtonProps) {
  return (
    <a
      className="inline-flex rounded-md bg-action px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#1f5d68]"
      href={`/auth/login?next=${encodeURIComponent(next)}`}
    >
      Accedeix amb el compte XTEC
    </a>
  );
}

type LogoutButtonProps = {
  next?: string;
};

export function LogoutButton({ next = "/" }: LogoutButtonProps) {
  return (
    <form action={`/auth/logout?next=${encodeURIComponent(next)}`} method="post">
      <button
        className="inline-flex h-10 items-center rounded-md border border-line bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-action hover:text-action"
        type="submit"
      >
        Tanca sessió
      </button>
    </form>
  );
}

type XtecAccessNoticeProps = {
  next?: string;
};

export function XtecAccessNotice({ next = "/crear" }: XtecAccessNoticeProps) {
  return (
    <div className="rounded-md border border-line bg-white p-6 text-center shadow-sm">
      <h2 className="text-xl font-semibold text-ink">Accés per a responsables</h2>
      <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-700">
        Per crear i gestionar qüestionaris cal accedir amb un compte XTEC.
      </p>
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
        <LogoutButton next="/crear" />
      </div>
    </div>
  );
}
