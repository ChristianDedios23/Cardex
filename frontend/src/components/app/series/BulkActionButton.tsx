export function BulkActionButton({
    label,
    disabled,
    showCooldownBar,
    cooldownProgress,
    onClick,
    hoverClassName,
}: {
    label: string;
    disabled: boolean;
    showCooldownBar: boolean;
    cooldownProgress: number;
    onClick: () => void;
    hoverClassName: string;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            className={`relative overflow-hidden rounded-md border border-[var(--border)] px-3 py-2 text-[10px] font-medium uppercase tracking-wide text-[var(--muted)] transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${hoverClassName}`}
        >
            {showCooldownBar && (
                <span
                    className="absolute inset-y-0 left-0 bg-[var(--accent)]/25"
                    style={{ width: `${Math.max(0, Math.min(1, cooldownProgress)) * 100}%` }}
                    aria-hidden="true"
                />
            )}
            <span className="relative z-10">{label}</span>
        </button>
    );
}
