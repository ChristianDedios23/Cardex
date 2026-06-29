import type { ReactNode } from 'react';

export function SetInfoField({
    label,
    value,
    valueClassName,
    className,
    allowWrap = false,
}: {
    label: string;
    value: ReactNode;
    valueClassName?: string;
    className?: string;
    allowWrap?: boolean;
}) {
    return (
        <div className={`min-w-0 ${className ?? ''}`}>
            <p className="text-[10px] font-medium uppercase tracking-wide text-[var(--muted)]">
                {label}
            </p>
            <p
                className={`mt-1 text-sm font-medium ${valueClassName ?? 'text-[var(--foreground)]'} ${
                    allowWrap ? 'line-clamp-2' : 'truncate'
                }`}
            >
                {value}
            </p>
        </div>
    );
}
