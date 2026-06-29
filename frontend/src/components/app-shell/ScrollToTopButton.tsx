'use client';

import { useEffect, useState, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import { HiArrowUp } from 'react-icons/hi2';

function getScrollOffset(scrollContainer: HTMLElement | null): number {
    return Math.max(window.scrollY, scrollContainer?.scrollTop ?? 0);
}

function easeOutCubic(progress: number): number {
    return 1 - Math.pow(1 - progress, 3);
}

function scrollToTopFast(scrollContainer: HTMLElement | null) {
    const startWindow = window.scrollY;
    const startContainer = scrollContainer?.scrollTop ?? 0;

    if (startWindow === 0 && startContainer === 0) {
        return;
    }

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        window.scrollTo({ top: 0, behavior: 'auto' });
        if (scrollContainer) {
            scrollContainer.scrollTop = 0;
        }
        return;
    }

    const durationMs = 420;
    const startTime = performance.now();

    function step(now: number) {
        const progress = Math.min((now - startTime) / durationMs, 1);
        const eased = easeOutCubic(progress);

        window.scrollTo(0, startWindow * (1 - eased));

        if (scrollContainer) {
            scrollContainer.scrollTop = startContainer * (1 - eased);
        }

        if (progress < 1) {
            requestAnimationFrame(step);
        }
    }

    requestAnimationFrame(step);
}

export function ScrollToTopButton({
    scrollContainerRef,
}: {
    scrollContainerRef: RefObject<HTMLElement | null>;
}) {
    const [mounted, setMounted] = useState(false);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!mounted) {
            return;
        }

        const container = scrollContainerRef.current;

        function onScroll() {
            setVisible(getScrollOffset(scrollContainerRef.current) > 120);
        }

        window.addEventListener('scroll', onScroll, { passive: true });
        container?.addEventListener('scroll', onScroll, { passive: true });
        onScroll();

        return () => {
            window.removeEventListener('scroll', onScroll);
            container?.removeEventListener('scroll', onScroll);
        };
    }, [mounted, scrollContainerRef]);

    if (!mounted || !visible) {
        return null;
    }

    function scrollToTop() {
        scrollToTopFast(scrollContainerRef.current);
    }

    return createPortal(
        <button
            type="button"
            onClick={scrollToTop}
            aria-label="Scroll to top"
            className="fixed bottom-6 right-6 z-50 flex h-11 w-11 items-center justify-center rounded-md border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] shadow-lg transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
        >
            <HiArrowUp className="h-5 w-5" aria-hidden="true" />
        </button>,
        document.body,
    );
}
