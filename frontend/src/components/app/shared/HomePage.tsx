export function HomePage() {
    return (
        <section className="mx-auto flex max-w-3xl flex-col gap-6 py-8 text-center md:py-16">
            <div>
                <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
                    Welcome to Cardex
                </h1>
                <p className="mt-3 text-base text-[var(--muted)] md:text-lg">
                    Your Pokémon card collection, organized in one place.
                </p>
            </div>
            <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 text-left">
                <p className="text-sm leading-relaxed text-[var(--muted)]">
                    This is a placeholder home page. Soon you&apos;ll see featured sets, collection
                    highlights, and quick links to search and browse your cards. Sign in from the
                    top right to start building your collection.
                </p>
            </div>
        </section>
    );
}
