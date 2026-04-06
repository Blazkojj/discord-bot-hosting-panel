export function SectionTabs({ items = [] }) {
  return (
    <nav className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
      {items.map((item) => (
        <a
          key={item.id}
          href={`#${item.id}`}
          className="group rounded-[1.4rem] border border-[#243448] bg-[#0b1320] px-4 py-4 transition hover:border-sky-500/40 hover:bg-sky-500/[0.07]"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
            {item.eyebrow}
          </p>
          <p className="mt-2 text-base font-semibold text-white transition group-hover:text-sky-300">
            {item.label}
          </p>
          <p className="mt-1 text-sm text-slate-400">{item.description}</p>
        </a>
      ))}
    </nav>
  );
}
