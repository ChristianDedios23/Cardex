import { ChangelogTimeline } from '@/components/changelog/ChangelogTimeline';
import { CHANGELOG_ENTRIES } from '@/components/changelog/changelogEntries';

export function ChangelogPage() {
    return (
        <section className="mx-auto max-w-3xl py-8 md:py-12">
            <header className="mb-10 md:mb-14">
                <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">Changelog</h1>
                <p className="mt-3 max-w-xl text-sm text-[var(--muted)] md:text-base">
                    Release notes and updates for Cardex.
                </p>
            </header>

            <ChangelogTimeline entries={CHANGELOG_ENTRIES} />
        </section>
    );
}
