'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export type ChangelogEntry = {
    id: string;
    title: string;
    date: string;
    tag?: string;
    paragraphs: string[];
};

function isScrollableOverflow(overflowY: string) {
    return overflowY === 'auto' || overflowY === 'scroll' || overflowY === 'overlay';
}

function collectScrollTargets(element: HTMLElement): Array<HTMLElement | Window> {
    const targets: Array<HTMLElement | Window> = [];
    let parent: HTMLElement | null = element.parentElement;

    while (parent) {
        const { overflowY } = getComputedStyle(parent);

        if (isScrollableOverflow(overflowY) && parent.scrollHeight > parent.clientHeight + 1) {
            targets.push(parent);
        }

        parent = parent.parentElement;
    }

    targets.push(window);
    return targets;
}

function isScrolledToBottom(target: HTMLElement | Window) {
    if (target === window) {
        const scrollElement = document.documentElement;
        return window.innerHeight + window.scrollY >= scrollElement.scrollHeight - 4;
    }

    const element = target as HTMLElement;
    return element.scrollHeight - element.scrollTop - element.clientHeight < 4;
}

type ChangelogTimelineProps = {
    entries: ChangelogEntry[];
};

export function ChangelogTimeline({ entries }: ChangelogTimelineProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const entryRefs = useRef<(HTMLElement | null)[]>([]);
    const [scrollProgress, setScrollProgress] = useState(0);

    const setEntryRef = useCallback((index: number, node: HTMLElement | null) => {
        entryRefs.current[index] = node;
    }, []);

    useEffect(() => {
        const container = containerRef.current;

        if (!container || entries.length === 0) {
            return;
        }

        const scrollTargets = collectScrollTargets(container);
        let frameId = 0;

        function updateProgress() {
            const activationY = window.innerHeight * 0.38;
            let progress = 0;

            for (let index = 0; index < entries.length; index += 1) {
                const element = entryRefs.current[index];

                if (!element) {
                    continue;
                }

                const rect = element.getBoundingClientRect();

                if (rect.top >= activationY) {
                    break;
                }

                if (rect.bottom <= activationY) {
                    progress = index + 1;
                    continue;
                }

                const ratio = (activationY - rect.top) / Math.max(rect.height, 1);
                progress = index + Math.min(1, Math.max(0, ratio));
                break;
            }

            if (scrollTargets.some(isScrolledToBottom)) {
                progress = entries.length - 1;
            }

            setScrollProgress(Math.min(progress, entries.length - 1));
        }

        function scheduleUpdate() {
            cancelAnimationFrame(frameId);
            frameId = requestAnimationFrame(updateProgress);
        }

        scrollTargets.forEach((target) => {
            target.addEventListener('scroll', scheduleUpdate, { passive: true });
        });
        window.addEventListener('resize', scheduleUpdate);
        scheduleUpdate();

        return () => {
            cancelAnimationFrame(frameId);
            scrollTargets.forEach((target) => {
                target.removeEventListener('scroll', scheduleUpdate);
            });
            window.removeEventListener('resize', scheduleUpdate);
        };
    }, [entries.length]);

    return (
        <div ref={containerRef} className="changelog-timeline">
            {entries.map((entry, index) => {
                const isDotActive = scrollProgress >= index;
                const segmentFill =
                    index < entries.length - 1
                        ? Math.min(1, Math.max(0, scrollProgress - index))
                        : 0;

                return (
                    <article
                        key={entry.id}
                        ref={(node) => setEntryRef(index, node)}
                        className="changelog-timeline-entry"
                    >
                        <div className="changelog-timeline-meta">
                            {entry.tag && (
                                <span className="ui-pill changelog-timeline-tag">{entry.tag}</span>
                            )}
                            <time className="changelog-timeline-date">{entry.date}</time>
                        </div>

                        <div className="changelog-timeline-rail" aria-hidden="true">
                            {index < entries.length - 1 && (
                                <span className="changelog-timeline-segment">
                                    <span
                                        className="changelog-timeline-segment-fill"
                                        style={{ transform: `scaleY(${segmentFill})` }}
                                    />
                                </span>
                            )}
                            <span
                                className={`changelog-timeline-dot ${
                                    isDotActive ? 'changelog-timeline-dot-active' : ''
                                }`}
                            />
                        </div>

                        <div className="changelog-timeline-content">
                            <h2
                                className={`changelog-timeline-title ${
                                    isDotActive ? 'changelog-timeline-title-active' : ''
                                }`}
                            >
                                {entry.title}
                            </h2>
                            <div className="changelog-timeline-body">
                                {entry.paragraphs.map((paragraph) => (
                                    <p key={paragraph}>{paragraph}</p>
                                ))}
                            </div>
                        </div>
                    </article>
                );
            })}
        </div>
    );
}
