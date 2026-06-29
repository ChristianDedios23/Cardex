'use client';

import { useLayoutEffect, useRef, useState } from 'react';
import { IoChevronDown, IoChevronUp } from 'react-icons/io5';
import { PiMagnifyingGlassBold } from 'react-icons/pi';
import type {
    SetCardOwnershipFilter,
    SetCardSortDirection,
    SetCardSortField,
} from '@/components/app/types';

const SET_CARD_SORT_OPTIONS: { field: SetCardSortField; label: string }[] = [
    { field: 'number', label: 'Number' },
    { field: 'name', label: 'Name' },
    { field: 'rarity', label: 'Rarity' },
    { field: 'price', label: 'Price' },
    { field: 'artist', label: 'Artist' },
];

export function SetCardSortButton({
    label,
    active,
    direction,
    onClick,
}: {
    label: string;
    active: boolean;
    direction: SetCardSortDirection | null;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                active
                    ? 'border-[var(--accent)] bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)]'
                    : 'border-[var(--border)] bg-[var(--card)] text-[var(--muted)] hover:text-[var(--foreground)]'
            }`}
        >
            {label}
            <span className="flex flex-col leading-none" aria-hidden="true">
                <IoChevronUp
                    className={`h-2.5 w-2.5 ${active && direction === 'asc' ? 'opacity-100' : 'opacity-30'}`}
                />
                <IoChevronDown
                    className={`-mt-0.5 h-2.5 w-2.5 ${active && direction === 'desc' ? 'opacity-100' : 'opacity-30'}`}
                />
            </span>
        </button>
    );
}

export function CardSortButtons({
    sortField,
    sortDirection,
    onSortChange,
}: {
    sortField: SetCardSortField;
    sortDirection: SetCardSortDirection;
    onSortChange: (field: SetCardSortField) => void;
}) {
    return (
        <>
            {SET_CARD_SORT_OPTIONS.map(({ field, label }) => (
                <SetCardSortButton
                    key={field}
                    label={label}
                    active={sortField === field}
                    direction={sortField === field ? sortDirection : null}
                    onClick={() => onSortChange(field)}
                />
            ))}
        </>
    );
}

export function SetCardOwnershipTabs({
    value,
    onChange,
}: {
    value: SetCardOwnershipFilter;
    onChange: (value: SetCardOwnershipFilter) => void;
}) {
    const ownershipOptions: { value: SetCardOwnershipFilter; label: string }[] = [
        { value: 'all', label: 'Show All' },
        { value: 'owned', label: 'Owned' },
        { value: 'need', label: 'Need' },
    ];
    const containerRef = useRef<HTMLDivElement>(null);
    const tabRefs = useRef<Partial<Record<SetCardOwnershipFilter, HTMLButtonElement>>>({});
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
        <div ref={containerRef} className="relative mt-3 border-b border-[var(--border)]">
            <div className="flex gap-6">
                {ownershipOptions.map(({ value: optionValue, label }) => {
                    const active = value === optionValue;

                    return (
                        <button
                            key={optionValue}
                            ref={(element) => {
                                if (element) {
                                    tabRefs.current[optionValue] = element;
                                }
                            }}
                            type="button"
                            onClick={() => onChange(optionValue)}
                            className={`pb-2 text-sm font-medium transition-colors ${
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

export function SetCardsToolbar({
    searchQuery,
    onSearchQueryChange,
    ownershipFilter,
    onOwnershipFilterChange,
    sortField,
    sortDirection,
    onSortChange,
}: {
    searchQuery: string;
    onSearchQueryChange: (value: string) => void;
    ownershipFilter: SetCardOwnershipFilter;
    onOwnershipFilterChange: (value: SetCardOwnershipFilter) => void;
    sortField: SetCardSortField;
    sortDirection: SetCardSortDirection;
    onSortChange: (field: SetCardSortField) => void;
}) {
    return (
        <div className="mb-4">
            <div className="flex flex-wrap items-stretch gap-2">
                <div className="relative min-w-[12rem] flex-1">
                    <PiMagnifyingGlassBold
                        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]"
                        aria-hidden="true"
                    />
                    <input
                        type="search"
                        value={searchQuery}
                        onChange={(event) => onSearchQueryChange(event.target.value)}
                        placeholder="Name or Number..."
                        className="w-full rounded-lg border border-[var(--border)] bg-[var(--card)] py-2 pl-9 pr-3 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)]"
                    />
                </div>
                <CardSortButtons
                    sortField={sortField}
                    sortDirection={sortDirection}
                    onSortChange={onSortChange}
                />
            </div>
            <SetCardOwnershipTabs value={ownershipFilter} onChange={onOwnershipFilterChange} />
        </div>
    );
}
