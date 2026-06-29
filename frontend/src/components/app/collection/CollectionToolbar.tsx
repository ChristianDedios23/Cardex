'use client';

import type { ReactNode } from 'react';
import { HiBars3, HiSquares2X2 } from 'react-icons/hi2';
import { SetCardSortButton } from '@/components/app/cards/CardSortButtons';
import type {
    SetCardSortDirection,
    UserCardSortField,
    UserCardViewMode,
} from '@/components/app/types';

const USER_CARD_SORT_OPTIONS: { field: UserCardSortField; label: string }[] = [
    { field: 'name', label: 'Name' },
    { field: 'price', label: 'Price' },
    { field: 'date', label: 'Date' },
    { field: 'condition', label: 'Condition' },
];

function ViewModeButton({
    active,
    label,
    onClick,
    children,
}: {
    active: boolean;
    label: string;
    onClick: () => void;
    children: ReactNode;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            aria-label={label}
            aria-pressed={active}
            className={`flex h-9 w-9 items-center justify-center rounded-lg border transition-colors ${
                active
                    ? 'border-[var(--accent)] bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)]'
                    : 'border-[var(--border)] bg-[var(--card)] text-[var(--muted)] hover:text-[var(--foreground)]'
            }`}
        >
            {children}
        </button>
    );
}

export function CollectionToolbar({
    viewMode,
    onViewModeChange,
    sortField,
    sortDirection,
    onSortChange,
}: {
    viewMode: UserCardViewMode;
    onViewModeChange: (mode: UserCardViewMode) => void;
    sortField: UserCardSortField;
    sortDirection: SetCardSortDirection;
    onSortChange: (field: UserCardSortField) => void;
}) {
    function handleSortChange(field: UserCardSortField) {
        onSortChange(field);
    }

    return (
        <div className="flex flex-wrap items-center justify-end gap-2">
            {USER_CARD_SORT_OPTIONS.map(({ field, label }) => (
                <SetCardSortButton
                    key={field}
                    label={label}
                    active={sortField === field}
                    direction={sortField === field ? sortDirection : null}
                    onClick={() => handleSortChange(field)}
                />
            ))}
            <div className="flex items-center gap-1.5 pl-1">
                <ViewModeButton
                    active={viewMode === 'grid'}
                    label="Grid view"
                    onClick={() => onViewModeChange('grid')}
                >
                    <HiSquares2X2 className="h-4 w-4" aria-hidden="true" />
                </ViewModeButton>
                <ViewModeButton
                    active={viewMode === 'list'}
                    label="Row view"
                    onClick={() => onViewModeChange('list')}
                >
                    <HiBars3 className="h-4 w-4" aria-hidden="true" />
                </ViewModeButton>
            </div>
        </div>
    );
}
