import type { ComponentType } from 'react';
import { FaGithub } from 'react-icons/fa6';
import { SiLeetcode } from 'react-icons/si';

type SocialPlatform = 'github' | 'leetcode';

type CreatorSocial = {
    platform: SocialPlatform;
    href: string;
};

type CreatorProfile = {
    name: string;
    degree: string;
    role: string;
    bio: string;
    initials: string;
    socials: CreatorSocial[];
};

const SOCIAL_CONFIG: Record<
    SocialPlatform,
    { label: string; Icon: ComponentType<{ className?: string; 'aria-hidden'?: boolean }> }
> = {
    github: { label: 'GitHub', Icon: FaGithub },
    leetcode: { label: 'LeetCode', Icon: SiLeetcode },
};

const CREATORS: CreatorProfile[] = [
    {
        name: 'Christian Dedios',
        degree: 'B.S. Computer Science & Systems',
        role: 'Backend',
        bio: 'Built the API layer, database schema, and collection sync logic that powers Cardex behind the scenes.',
        initials: 'CD',
        socials: [
            { platform: 'github', href: 'https://github.com/ChristianDedios23' },
            { platform: 'leetcode', href: 'https://leetcode.com/u/Chris_dedios/' },
        ],
    },
    {
        name: 'Kevin Lam',
        degree: 'B.S. Computer Science & Systems',
        role: 'Frontend',
        bio: 'Designed and built the interface, collection views, and the overall user experience you see.',
        initials: 'KL',
        socials: [
            { platform: 'github', href: 'https://github.com/kevlam1' },
            { platform: 'leetcode', href: 'https://leetcode.com/u/Kaneto/' },
        ],
    },
];

function CreatorSocialBar({ socials }: { socials: CreatorSocial[] }) {
    if (socials.length === 0) {
        return null;
    }

    return (
        <div className="about-creator-socials mt-5 flex w-full items-center justify-evenly rounded-full px-3 py-2">
            {socials.map((social) => {
                const { label, Icon } = SOCIAL_CONFIG[social.platform];

                return (
                    <a
                        key={`${social.platform}-${social.href}`}
                        href={social.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={label}
                        className="about-creator-social-link flex h-9 w-9 items-center justify-center rounded-full text-[var(--foreground)]"
                    >
                        <Icon className="h-[18px] w-[18px]" aria-hidden={true} />
                    </a>
                );
            })}
        </div>
    );
}

function CreatorCard({ creator }: { creator: CreatorProfile }) {
    return (
        <article className="about-creator-card group relative flex flex-col overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
            <div className="mb-5 flex items-start gap-4">
                <div
                    className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--background)] text-sm font-semibold tracking-wide text-[var(--foreground)]"
                    aria-hidden="true"
                >
                    {creator.initials}
                </div>
                <div className="min-w-0 pt-0.5">
                    <h2 className="text-lg font-semibold tracking-tight">{creator.name}</h2>
                    <p className="mt-1 text-sm text-[var(--muted)]">{creator.degree}</p>
                    <span className="about-creator-role mt-2 inline-block rounded-full px-2.5 py-0.5 text-xs font-medium">
                        {creator.role}
                    </span>
                </div>
            </div>
            <p className="text-sm leading-relaxed text-[var(--muted)]">{creator.bio}</p>
            <CreatorSocialBar socials={creator.socials} />
        </article>
    );
}

export function AboutPage() {
    return (
        <section className="mx-auto flex max-w-4xl flex-col gap-8 py-8 md:py-12">
            <header className="text-center">
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-[var(--accent)]">
                    About
                </p>
                <h1 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">
                    Meet the Makers.
                </h1>
                <p className="mx-auto mt-3 max-w-2xl text-base text-[var(--muted)] md:text-lg">
                    Cardex was built by two students who wanted a better way to track Pokémon
                    collections. Here&apos;s a little about who made it.
                </p>
            </header>

            <div className="grid gap-5 md:grid-cols-2 md:gap-6">
                {CREATORS.map((creator) => (
                    <CreatorCard key={creator.name} creator={creator} />
                ))}
            </div>
        </section>
    );
}
