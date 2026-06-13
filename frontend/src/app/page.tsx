import { TestApp } from '@/components/TestApp';

export default function Home() {
    return (
        <main className="min-h-screen px-4 py-8">
            <div className="mx-auto max-w-4xl">
                <header className="mb-8">
                    <p className="text-sm font-medium uppercase tracking-wider text-blue-400">
                        Cardex
                    </p>
                    <h1 className="mt-1 text-3xl font-semibold">Backend Test UI</h1>
                    <p className="mt-2 max-w-2xl text-[var(--muted)]">
                        Sign in with Supabase, search Pokémon cards, and manage your collection
                        through the Cardex API.
                    </p>
                </header>
                <TestApp />
            </div>
        </main>
    );
}
