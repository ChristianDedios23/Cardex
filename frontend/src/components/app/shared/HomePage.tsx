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
        title: 'Pokédex',
        description:
            'Browse all Pokémon by generation and see which species you have caught through your card collection.',
        tab: 'pokedex' as const,
        Icon: PokeballIcon,
        iconClassName: 'h-10 w-10',
    },
    {
        title: 'Track',
        description:
            'Build a wishlist, follow market prices, and keep tabs on the cards you want most.',
        tab: 'wishlist' as const,
        Icon: HiMiniSparkles,
    },
] as const;

function PokeballIcon({ className }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 76 76" aria-hidden="true">
            <path
                fill="currentColor"
                d="M 38,19C 48.4934,19 57,27.5066 57,38C 57,48.4934 48.4934,57 38,57C 27.5066,57 19,48.4934 19,38C 19,27.5066 27.5066,19 38,19 Z M 38,22.9583C 30.2275,22.9583 23.8319,28.8536 23.0407,36.4167L 30.2417,36.4167C 30.9752,32.8031 34.17,30.0833 38,30.0833C 41.83,30.0833 45.0248,32.8031 45.7583,36.4167L 52.9593,36.4167C 52.1681,28.8536 45.7725,22.9583 38,22.9583 Z M 23.0407,39.5833C 23.8319,47.1464 30.2275,53.0417 38,53.0417C 45.7725,53.0417 52.1681,47.1464 52.9593,39.5833L 45.7583,39.5834C 45.0248,43.1969 41.83,45.9167 38,45.9167C 34.17,45.9167 30.9752,43.1969 30.2417,39.5834L 23.0407,39.5833 Z M 38,33.25C 35.3766,33.25 33.25,35.3767 33.25,38C 33.25,40.6234 35.3766,42.75 38,42.75C 40.6233,42.75 42.75,40.6234 42.75,38C 42.75,35.3767 40.6233,33.25 38,33.25 Z M 38,35.625C 39.3117,35.625 40.375,36.6883 40.375,38C 40.375,39.3117 39.3117,40.375 38,40.375C 36.6883,40.375 35.625,39.3117 35.625,38C 35.625,36.6883 36.6883,35.625 38,35.625 Z"
            />
        </svg>
    );
}

function FeatureIcon({
    Icon,
    iconClassName = 'h-5 w-5',
}: {
    Icon: ComponentType<{ className?: string; 'aria-hidden'?: boolean }>;
    iconClassName?: string;
}) {
    return (
        <span
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--accent)]"
            aria-hidden="true"
        >
            <Icon className={iconClassName} />
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

            <div className="mx-auto grid w-full max-w-5xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {FEATURE_CARDS.map(({ title, description, tab, Icon, ...card }) => (
                    <Link
                        key={title}
                        href={getPathForTab(tab)}
                        className="home-feature-card block h-full"
                    >
                        <FeatureIcon
                            Icon={Icon}
                            iconClassName={'iconClassName' in card ? card.iconClassName : undefined}
                        />
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
