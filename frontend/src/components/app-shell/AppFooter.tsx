'use client';

import Link from 'next/link';
import Image from 'next/image';
import { UI_ASSETS } from '@/lib/ui-assets';
import { getPathForTab } from '@/lib/routes';

const FOOTER_LINKS = [
    { label: 'About', tab: 'about' as const },
    { label: 'Privacy Policy', href: '#' },
    { label: 'Terms of Services', href: '#' },
    { label: 'Contact', tab: 'contact' as const },
] as const;

export function AppFooter() {
    const year = new Date().getFullYear();

    function footerLinkClassName() {
        return 'hover:text-[var(--foreground)]';
    }

    return (
        <footer className="shrink-0 border-t border-[var(--border)] bg-[var(--card)] px-4 py-4 text-center md:px-6">
            <div className="mx-auto flex max-w-6xl flex-col items-center gap-2">
                <Image
                    src={UI_ASSETS.brand.title}
                    alt="Cardex"
                    width={800}
                    height={300}
                    quality={100}
                    unoptimized
                    className="h-11 w-auto max-w-full object-contain"
                />
                <p className="text-xs text-[var(--muted)]">© {year} Cardex, All rights reserved.</p>

                <p className="text-xs text-[var(--muted)]">
                    Cardex is not produced, endorsed, supported, or affiliated with The Pokémon
                    Company, Nintendo, Game Freak, or Creatures Inc.
                </p>

                <nav aria-label="Footer">
                    <ul className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-[var(--muted)]">
                        {FOOTER_LINKS.map((link) => (
                            <li key={link.label}>
                                {'tab' in link ? (
                                    <Link
                                        href={getPathForTab(link.tab)}
                                        onClick={() =>
                                            window.scrollTo({ top: 0, behavior: 'smooth' })
                                        }
                                        className={footerLinkClassName()}
                                    >
                                        {link.label}
                                    </Link>
                                ) : (
                                    <a href={link.href} className={footerLinkClassName()}>
                                        {link.label}
                                    </a>
                                )}
                            </li>
                        ))}
                    </ul>
                </nav>
            </div>
        </footer>
    );
}
