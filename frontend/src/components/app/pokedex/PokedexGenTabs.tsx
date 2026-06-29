'use client';

import { useLayoutEffect, useRef, useState } from 'react';
import { POKEDEX_GENERATIONS, type PokedexGeneration } from '@/lib/pokedex';

export function PokedexGenTabs({
    value,
    onChange,
}: {
    value: PokedexGeneration;
    onChange: (generation: PokedexGeneration) => void;
}) {
    const containerRef = useRef<HTMLDivElement>(null);
    const tabRefs = useRef<Partial<Record<PokedexGeneration, HTMLButtonElement>>>({});
    const [indicator, setIndicator] = useState({ left: 0, width: 0 });

    useLayoutEffect(() => {
        const container = containerRef.current;

        if (!container) {
            return;
        }

        function updateIndicator() {
            const activeTab = tabRefs.current[value];

            if (!activeTab) {
                return;
            }

            setIndicator({
                left: activeTab.offsetLeft,
                width: activeTab.offsetWidth,
            });
        }

        updateIndicator();

        const resizeObserver = new ResizeObserver(updateIndicator);
        resizeObserver.observe(container);

        return () => {
            resizeObserver.disconnect();
        };
    }, [value]);

    return (
        <div ref={containerRef} className="relative border-b border-[var(--border)]">
            <div className="flex gap-4 overflow-x-auto pb-px sm:gap-6">
                {POKEDEX_GENERATIONS.map(({ generation, label }) => {
                    const active = value === generation;

                    return (
                        <button
                            key={generation}
                            ref={(element) => {
                                if (element) {
                                    tabRefs.current[generation] = element;
                                }
                            }}
                            type="button"
                            onClick={() => onChange(generation)}
                            className={`shrink-0 pb-2 text-sm font-medium transition-colors ${
                                active
                                    ? 'text-white'
                                    : 'text-[var(--muted)] hover:text-[var(--foreground)]'
                            }`}
                        >
                            {label}
                        </button>
                    );
                })}
            </div>
            <div
                aria-hidden="true"
                className="absolute bottom-0 h-0.5 bg-[var(--accent)] transition-[transform,width] duration-300 ease-out"
                style={{
                    width: indicator.width,
                    transform: `translateX(${indicator.left}px)`,
                }}
            />
        </div>
    );
}
