export type AppTab =
    | 'home'
    | 'about'
    | 'contact'
    | 'changelog'
    | 'search'
    | 'series'
    | 'collection'
    | 'wishlist';

export const TAB_PATHS: Record<AppTab, string> = {
    home: '/',
    search: '/search',
    series: '/series',
    collection: '/collection',
    wishlist: '/wishlist',
    about: '/about',
    contact: '/contact',
    changelog: '/changelog',
};

const PATH_TO_TAB = Object.fromEntries(
    Object.entries(TAB_PATHS).map(([tab, path]) => [path, tab]),
) as Record<string, AppTab>;

export const APP_PATHS = new Set(Object.values(TAB_PATHS));

export function getPathForTab(tab: AppTab): string {
    return TAB_PATHS[tab];
}

export function getTabFromPath(pathname: string): AppTab {
    if (pathname.startsWith('/series')) {
        return 'series';
    }

    return PATH_TO_TAB[pathname] ?? 'home';
}

export function isAppPath(pathname: string): boolean {
    if (pathname.startsWith('/series')) {
        return true;
    }

    return APP_PATHS.has(pathname);
}
