export function PanelCard({ title, eyebrow, description, actions, className = "", children }) {
  return (
    <section
      className={`rounded-[1.9rem] border border-[#243448] bg-[#0d1828] p-5 shadow-[0_30px_80px_rgba(4,10,20,0.32)] ${className}`}
    >
      {(title || eyebrow || description || actions) && (
        <div className="mb-4 flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0 flex-1 space-y-1">
            {eyebrow && (
              <p className="font-mono text-xs uppercase tracking-[0.25em] text-slate-500">
                {eyebrow}
              </p>
            )}
            {title && <h2 className="text-[1.35rem] font-semibold tracking-tight text-white">{title}</h2>}
            {description && <p className="max-w-2xl text-sm leading-6 text-slate-400">{description}</p>}
          </div>
          {actions ? (
            <div className="flex w-full flex-wrap gap-2 xl:w-auto xl:max-w-[55%] xl:justify-end">
              {actions}
            </div>
          ) : null}
        </div>
      )}
      {children}
    </section>
  );
}
