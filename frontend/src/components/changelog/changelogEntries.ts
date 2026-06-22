import type { ChangelogEntry } from '@/components/changelog/ChangelogTimeline';

/** Newest first. Add entries here when shipping updates — no emojis. */
export const CHANGELOG_ENTRIES: ChangelogEntry[] = [
    {
        id: '0-2-0',
        title: 'Bulk collection actions & set browsing',
        date: 'Mar 14, 2026',
        tag: 'beta',
        paragraphs: [
            'Add or remove an entire set from your collection in one action, with a short cooldown between bulk operations to keep things stable.',
            'Set views now support search, sort, and ownership filters so you can focus on the cards you still need.',
        ],
    },
    {
        id: '0-1-0',
        title: 'Multi-word search & card detail navigation',
        date: 'Mar 10, 2026',
        tag: 'beta',
        paragraphs: [
            'Searching names like “Alakazam ex” now matches both spaced and hyphenated card names.',
            'The card detail modal includes previous and next arrows so you can browse results without closing the popup.',
        ],
    },
    {
        id: '0-0-1',
        title: 'Cardex preview launch',
        date: 'Mar 1, 2026',
        tag: 'beta',
        paragraphs: [
            'Initial preview of Cardex — search Pokémon cards, browse series and sets, track your collection and wishlist, and see TCGPlayer market prices.',
            'Sign in to save cards and pick up where you left off across sessions.',
        ],
    },
];
