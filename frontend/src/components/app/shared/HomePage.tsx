'use client';

import Link from 'next/link';
import type { ComponentType } from 'react';
import { BsBackpack2 } from 'react-icons/bs';
import { HiMiniSparkles } from 'react-icons/hi2';
import { PiMagnifyingGlass } from 'react-icons/pi';
import { getPathForTab } from '@/lib/routes';

const FEATURE_CARDS = [
    {
        title: 'Browse',
        description:
            'Search by name or explore sets across every series — from Base Set to the latest releases.',
        tab: 'search' as const,
        Icon: PiMagnifyingGlass,
    },
    {
        title: 'Collect',
        description:
            'Mark cards as owned, track quantities, and watch your collection grow in one organized place.',
        tab: 'collection' as const,
        Icon: BsBackpack2,
    },
    {
        title: 'Track',
        description:
            'Build a wishlist, follow market prices, and keep tabs on the cards you want most.',
        tab: 'wishlist' as const,
        Icon: HiMiniSparkles,
    },
] as const;

function FeatureIcon({
    Icon,
}: {
    Icon: ComponentType<{ className?: string; 'aria-hidden'?: boolean }>;
}) {
    return (
        <span
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--accent)]"
            aria-hidden="true"
        >
            <Icon className="h-5 w-5" />
        </span>
    );
}

export function HomePage() {
    return (
        <section className="mx-auto flex max-w-6xl flex-col gap-10 py-8 md:py-12">
            <div className="text-center">
                <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
                    Welcome to Cardex
                </h1>
                <p className="mx-auto mt-3 max-w-2xl text-base text-[var(--muted)] md:text-lg">
                    Your Pokémon card collection, organized in one place. Browse the catalog, build
                    your collection, and track the cards that matter to you.
                </p>
            </div>

            <div className="mx-auto grid w-full max-w-4xl gap-4 sm:grid-cols-3">
                {FEATURE_CARDS.map(({ title, description, tab, Icon }) => (
                    <Link
                        key={title}
                        href={getPathForTab(tab)}
                        className="home-feature-card block h-full"
                    >
                        <FeatureIcon Icon={Icon} />
                        <h2 className="mt-4 text-lg font-semibold text-[var(--foreground)]">
                            {title}
                        </h2>
                        <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
                            {description}
                        </p>
                    </Link>
                ))}
            </div>
        </section>
    );
}
