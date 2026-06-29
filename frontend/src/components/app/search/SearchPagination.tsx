'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { IoIosArrowBack, IoIosArrowForward } from 'react-icons/io';
import { getFixedPageWindow } from '@/components/app/card-utils';

export function SearchPagination({
    currentPage,
    totalPages,
    hasMore,
    onPageChange,
    disabled = false,
    jumpInputId = 'jump-to-page',
}: {
    currentPage: number;
    totalPages: number;
    hasMore: boolean;
    onPageChange: (page: number) => void;
    disabled?: boolean;
    jumpInputId?: string;
}) {
    const [jumpValue, setJumpValue] = useState(String(currentPage));

    useEffect(() => {
        setJumpValue(String(currentPage));
    }, [currentPage]);

    const pageItems = getFixedPageWindow(currentPage, totalPages);
    const pageButtonClass =
        'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg px-2 text-sm tabular-nums';
    const canGoNext = currentPage < totalPages || hasMore;

    function handleJump(event: FormEvent) {
        event.preventDefault();

        const parsed = Number.parseInt(jumpValue, 10);

        if (!Number.isFinite(parsed) || parsed < 1) {
            return;
        }

        onPageChange(parsed);
    }

    return (
        <div className="flex flex-col items-center gap-3">
            <nav
                aria-label="Search results pagination"
                className="flex items-center justify-center gap-1"
            >
                <button
                    type="button"
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={disabled || currentPage <= 1}
                    aria-label="Previous page"
                    className={`${pageButtonClass} border border-[var(--border)] hover:bg-white/5 disabled:opacity-50`}
                >
                    <IoIosArrowBack className="h-5 w-5" aria-hidden="true" />
                </button>

                {pageItems.map((page) => (
                    <button
                        key={page}
                        type="button"
                        onClick={() => onPageChange(page)}
                        disabled={disabled || page === currentPage}
                        aria-label={`Page ${page}`}
                        aria-current={page === currentPage ? 'page' : undefined}
                        className={`${pageButtonClass} ${
                            page === currentPage
                                ? 'bg-[var(--accent)] font-medium text-white'
                                : 'border border-[var(--border)] hover:bg-white/5'
                        } disabled:opacity-100`}
                    >
                        {page}
                    </button>
                ))}

                <button
                    type="button"
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={disabled || !canGoNext}
                    aria-label="Next page"
                    className={`${pageButtonClass} border border-[var(--border)] hover:bg-white/5 disabled:opacity-50`}
                >
                    <IoIosArrowForward className="h-5 w-5" aria-hidden="true" />
                </button>
            </nav>

            <form
                onSubmit={handleJump}
                className="flex flex-wrap items-center justify-center gap-2 text-sm text-[var(--muted)]"
            >
                <label htmlFor={jumpInputId}>Go to page</label>
                <input
                    id={jumpInputId}
                    type="number"
                    min={1}
                    max={totalPages}
                    value={jumpValue}
                    onChange={(event) => setJumpValue(event.target.value)}
                    disabled={disabled}
                    className="w-16 rounded-lg border border-[var(--border)] bg-[var(--background)] px-2 py-1.5 text-center text-[var(--foreground)] disabled:opacity-50"
                />
                <button
                    type="submit"
                    disabled={disabled || !jumpValue.trim()}
                    className="rounded-lg border border-[var(--border)] px-3 py-1.5 hover:bg-white/5 disabled:opacity-50"
                >
                    Go
                </button>
            </form>
        </div>
    );
}
