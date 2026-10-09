export function Logo({ light = false }: { light?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-2 font-semibold tracking-[-0.02em] ${light ? "text-white" : "text-navy"}`}>
      <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden>
        <rect x="1" y="6" width="12" height="12" rx="3" fill="none" stroke={light ? "#D1FAE5" : "#0F766E"} strokeWidth="2" />
        <rect x="9" y="2" width="12" height="12" rx="3" fill={light ? "#D1FAE5" : "#0F766E"} />
      </svg>
      <span className="text-lg">MedLink</span>
    </span>
  );
}
