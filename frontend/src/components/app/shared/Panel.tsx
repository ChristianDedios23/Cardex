import type { ReactNode } from 'react';

export function Panel({
    title,
    header,
    children,
}: {
    title?: string;
    header?: ReactNode;
    children: ReactNode;
}) {
    return (
        <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
            {header ?? (title ? <h2 className="mb-4 text-lg font-medium">{title}</h2> : null)}
            {children}
        </section>
    );
}
