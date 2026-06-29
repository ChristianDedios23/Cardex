import type { ChangelogEntry } from '@/components/changelog/ChangelogTimeline';

/** Newest first. Add entries here when shipping updates — no emojis. */
export const CHANGELOG_ENTRIES: ChangelogEntry[] = [
    {
        id: '2026-06-28-2125',
        title: 'Pokédex tracking and collection progress',
        date: 'Jun 28, 2026',
        tag: 'beta',
        paragraphs: [
            'A brand new Pokédex section has been added to Cardex, allowing you to browse all 1,025 Pokémon organized by generation. Each Pokémon is displayed in a dedicated collection view designed specifically for tracking species ownership.',
            'Pokémon sprites now visually reflect your collection progress. Species with matching cards in your collection appear fully visible, while unowned species remain faded to help you quickly identify what is still missing.',
            'The Pokédex includes progress tracking similar to set completion pages, making it easy to monitor your overall collection goals and see how close you are to completing the entire Pokédex.',
        ],
    },
    {
        id: '2026-06-28-1936',
        title: 'Shareable pages and contact tools',
        date: 'Jun 28, 2026',
        tag: 'beta',
        paragraphs: [
            'Cardex now uses dedicated URLs throughout the site, allowing sections such as Search, Series, Collection, Wishlist, About, Contact, and Changelog to be bookmarked, refreshed, and shared directly.',
            'Series and set pages can now be linked individually, making it easier to share specific collections with other users and return directly to your favorite sets later.',
            'The Contact page has been expanded into a feedback and bug reporting hub, providing a dedicated place to submit reports and track community feedback. Additional updates were made to the About page and homepage to provide more information about the project and its creators.',
        ],
    },
    {
        id: '2026-06-22-2316',
        title: 'Expanded search and loading experience',
        date: 'Jun 22, 2026',
        tag: 'beta',
        paragraphs: [
            'Searching has been reworked to load significantly larger result groups at once, making sorting and browsing much more effective across large collections of cards.',
            'A dedicated loading screen has been added with new animations and transitions to create a smoother experience while content is loading.',
            'Additional fixes improve search stability, card navigation, hover effects, mobile layouts, and overall usability throughout the site.',
        ],
    },
    {
        id: '2026-06-20-1735',
        title: 'Homepage, navigation, and quality upgrades',
        date: 'Jun 20, 2026',
        tag: 'beta',
        paragraphs: [
            'Cardex now opens directly to a dedicated homepage. Clicking the Cardex logo anywhere in the application will return you to the homepage, making navigation more intuitive.',
            'Signed-out visitors can now explore the homepage without immediately being forced into an authentication screen. Login and account creation controls have been moved into a more accessible location while maintaining access restrictions for protected features.',
            'Card details have been improved with previous and next navigation controls, allowing users to browse cards directly from the details view using buttons or keyboard arrow keys. Sorting by rarity has also been improved for more accurate results.',
            'New About and Contact pages have been introduced to provide project information, creator profiles, and a future home for feedback and bug reporting. Mobile layouts and bulk collection actions have also received quality-of-life improvements.',
        ],
    },
    {
        id: '2026-06-19-1847',
        title: 'Series browser and set completion tools',
        date: 'Jun 19, 2026',
        tag: 'beta',
        paragraphs: [
            'The new Series section allows you to browse Pokémon TCG eras and explore individual sets through a dedicated collection experience. Series organization, set ordering, and visual presentation have been refined to make browsing easier and more enjoyable.',
            'Set pages now include summaries, search tools, sorting controls, and collection filters that let you view all cards, only cards you own, or cards you still need. Animated controls help make switching between these views feel more responsive.',
            'Track progress with animated completion bars, milestone checkpoints, and enhanced celebration effects when a set reaches full completion. Bulk add and remove actions are available for managing entire sets more efficiently.',
            'Card details continue to expand with improved rarity information and additional visual enhancements throughout the set browsing experience.',
        ],
    },
    {
        id: '2026-06-18-1951',
        title: 'Series tab and account improvements',
        date: 'Jun 18, 2026',
        tag: 'beta',
        paragraphs: [
            'A new Series section has been introduced as the foundation for exploring Pokémon TCG releases beyond standard search results. This area will continue expanding as additional collection features are added.',
            'Account management has been redesigned with separate sign-in and account creation dialogs. The new layout provides a cleaner experience and makes authentication workflows easier to understand.',
            'Creating an account now includes password confirmation for added safety, while optional password visibility controls make entering credentials more convenient. Form interactions have also been improved, including support for pressing Enter to submit sign-in forms.',
            'Additional quality-of-life improvements make navigation and page management feel more consistent throughout the application.',
        ],
    },
    {
        id: '2026-06-18-1820',
        title: 'Visual refresh and interface polish',
        date: 'Jun 18, 2026',
        tag: 'beta',
        paragraphs: [
            'Card details have received a visual refresh with improved animations, smoother transitions, and a cleaner presentation of card information.',
            'Pricing information is now displayed more consistently, helping users quickly identify card values without confusion.',
            'The overall site appearance has been updated with a refreshed background design and new typography, creating a more modern and polished experience throughout Cardex.',
        ],
    },
    {
        id: '2026-06-16-1404',
        title: 'Expanded card details and information',
        date: 'Jun 16, 2026',
        tag: 'beta',
        paragraphs: [
            'The card details window has been redesigned to provide significantly more information about every card. Important details such as weaknesses, retreat costs, evolution information, illustrator credits, and additional card attributes are now easier to view.',
            'Type icons have been added throughout the details view, including support for move costs and Pokémon typing information.',
            'The details window is now larger, easier to read, and displays cards at a larger size, making artwork and card text much more accessible while browsing.',
        ],
    },
    {
        id: '2026-06-16-1323',
        title: 'Faster card detail loading',
        date: 'Jun 16, 2026',
        tag: 'beta',
        paragraphs: [
            'Opening card details is now significantly faster, especially when browsing multiple cards from the same search results.',
            'Card information loads more smoothly while navigating between cards, reducing delays and creating a more responsive browsing experience.',
            'These improvements make exploring large collections feel noticeably faster and more fluid.',
        ],
    },
    {
        id: '2026-06-15-1631',
        title: 'Card interactions and online launch',
        date: 'Jun 15, 2026',
        tag: 'beta',
        paragraphs: [
            'Cards now provide richer interactions with improved hover states, cursor feedback, and a dedicated details view when selected.',
            'Visual improvements throughout the card browsing experience make cards feel more responsive and easier to interact with.',
            'Cardex is now available through a hosted online deployment, allowing users to access the application without needing to run it locally.',
        ],
    },
    {
        id: '2026-06-15-1512',
        title: 'Enhanced card visuals and effects',
        date: 'Jun 15, 2026',
        tag: 'beta',
        paragraphs: [
            'Card visuals have been refined with updated colors, improved presentation, and new interactive effects throughout the interface.',
            'Cards now feature highlight and shine effects while hovering, creating a more dynamic browsing experience.',
            'Additional adjustments improve card framing and visual consistency across search results and collection views.',
        ],
    },
    {
        id: '2026-06-15-1315',
        title: 'Faster collection and wishlist actions',
        date: 'Jun 15, 2026',
        tag: 'beta',
        paragraphs: [
            'Adding cards to your collection or wishlist is now noticeably faster and more responsive.',
            'Collection and wishlist updates appear more quickly after interacting with cards, helping ownership and wishlist status stay in sync while browsing.',
            'These changes make managing your collection feel smoother, especially when adding multiple cards during a search session.',
        ],
    },
    {
        id: '2026-06-15-1250',
        title: 'Redesigned layout and navigation',
        date: 'Jun 15, 2026',
        tag: 'beta',
        paragraphs: [
            'Cardex now features a completely redesigned application layout with a dedicated sidebar, improved navigation, and a cleaner overall structure.',
            'Search, Collection, and Wishlist are now easier to access through a persistent navigation experience designed for faster movement throughout the site.',
            'A new top bar provides account controls and profile information, while loading indicators help communicate when content is being retrieved.',
        ],
    },
    {
        id: '2026-06-14-1953',
        title: 'Faster browsing and smarter caching',
        date: 'Jun 14, 2026',
        tag: 'beta',
        paragraphs: [
            'Switching between Search, Collection, and Wishlist now feels much faster and more responsive.',
            'Collection and wishlist changes appear immediately after adding or removing cards, reducing interruptions while managing your collection.',
            'The overall browsing experience has been streamlined to minimize unnecessary waiting while moving throughout the application.',
        ],
    },
    {
        id: '2026-06-14-1924',
        title: 'Collection tracking and card search',
        date: 'Jun 14, 2026',
        tag: 'beta',
        paragraphs: [
            'Search results have been redesigned into a compact card grid, making it easier to browse large numbers of cards at once. Pagination controls allow users to move through search results more efficiently.',
            'Collection and wishlist tracking have been integrated directly into search results. Cards can be added or removed with a single click, and ownership status is clearly displayed while browsing.',
            'Wishlist and collection data now persist throughout searches and page reloads, ensuring that saved cards remain accurately represented across the application.',
            'Loading states, empty result messaging, and overall visual styling have been improved to create a cleaner and more polished search experience.',
        ],
    },
    {
        id: '2026-06-11',
        title: 'Cardex project begins',
        date: 'Jun 11, 2026',
        tag: 'beta',
        paragraphs: [
            'Work on Cardex officially started, laying the groundwork for a Pokémon TCG collection tracker built around search, ownership, and wishlists.',
            'The backend and database were set up with Supabase so signed-in users could save cards and return to their collection across sessions.',
        ],
    },
];
