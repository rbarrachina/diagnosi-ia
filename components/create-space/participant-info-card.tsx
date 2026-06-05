export function ParticipantInfoCard() {
  return (
    <div className="flex h-full flex-col justify-center rounded-md border border-line bg-white p-6 text-center shadow-sm">
      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-action">
          Respondre qüestionari
        </p>
        <h2 className="text-xl font-semibold text-ink">Soc docent</h2>
        <p className="text-sm leading-6 text-slate-700">
          El responsable del centre t&apos;enviarà l&apos;enllaç o URL per accedir a
          l&apos;enquesta.
        </p>
      </div>
    </div>
  );
}
