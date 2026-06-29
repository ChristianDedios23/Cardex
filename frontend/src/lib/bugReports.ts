import { getAccessToken } from '@/lib/supabase/client';

export type BugReportCategory = 'bug' | 'feedback' | 'other';
export type BugReportBugType = 'ui_ux' | 'data_sync' | 'other';
export type BugReportStatus = 'open' | 'in_progress' | 'resolved' | 'closed';

export type BugReportInput = {
    title: string;
    category: BugReportCategory;
    bugType?: BugReportBugType;
    description: string;
    stepsToReproduce?: string;
    contactEmail?: string;
    userId?: string | null;
};

export type BugReportTrackerItem = {
    id: string;
    displayId: string;
    title: string;
    category: BugReportCategory;
    bugType: BugReportBugType | null;
    status: BugReportStatus;
    summary: string;
    createdAt: string;
};

const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000').replace(/\/$/, '');

type ApiError = {
    error: string;
};

async function reportsFetch<T>(
    path: string,
    options: RequestInit = {},
    token?: string | null,
): Promise<T> {
    const headers = new Headers(options.headers);
    headers.set('Content-Type', 'application/json');

    if (token) {
        headers.set('Authorization', `Bearer ${token}`);
    }

    const response = await fetch(`${API_URL}${path}`, {
        ...options,
        headers,
    });

    if (response.status === 204) {
        return undefined as T;
    }

    const data = await response.json();

    if (!response.ok) {
        const message = (data as ApiError).error ?? 'Request failed';
        throw new Error(message);
    }

    return data as T;
}

export async function submitBugReport(input: BugReportInput): Promise<void> {
    const token = await getAccessToken();

    await reportsFetch<{ ok: true }>(
        '/v1/reports',
        {
            method: 'POST',
            body: JSON.stringify({
                title: input.title,
                category: input.category,
                bug_type: input.category === 'bug' ? (input.bugType ?? null) : null,
                description: input.description,
                steps_to_reproduce: input.stepsToReproduce ?? null,
                contact_email: input.contactEmail ?? null,
            }),
        },
        token,
    );
}

export async function listBugReportTracker(limit = 50): Promise<BugReportTrackerItem[]> {
    const params = new URLSearchParams({ limit: String(limit) });
    const result = await reportsFetch<{ data: BugReportTrackerItem[] }>(
        `/v1/reports?${params.toString()}`,
    );

    return result.data;
}

export const EXAMPLE_BUG_REPORTS: BugReportTrackerItem[] = [
    {
        id: 'example-12',
        displayId: 'CARDEX-12',
        title: 'Set progress bar shows 100% before all cards are owned',
        category: 'bug',
        bugType: 'data_sync',
        status: 'open',
        summary:
            'Progress checkpoint hits 100% when 49/50 cards are marked owned in Prismatic Evolutions.',
        createdAt: '2026-03-08T12:00:00.000Z',
    },
    {
        id: 'example-9',
        displayId: 'CARDEX-9',
        title: 'Rarity symbol clipped on Double Rare cards',
        category: 'bug',
        bugType: 'ui_ux',
        status: 'in_progress',
        summary:
            'Multi-star rarity icon is slightly cropped in the card detail modal on smaller screens.',
        createdAt: '2026-03-03T12:00:00.000Z',
    },
    {
        id: 'example-7',
        displayId: 'CARDEX-7',
        title: 'Wishlist sort options',
        category: 'feedback',
        bugType: null,
        status: 'open',
        summary: 'Would love to sort wishlist cards by price or rarity, not just date added.',
        createdAt: '2026-02-28T12:00:00.000Z',
    },
];

export function isBugReportSchemaMissingError(message: string): boolean {
    const normalized = message.toLowerCase();
    return (
        normalized.includes('failed to fetch') ||
        normalized.includes('network') ||
        normalized.includes('could not load reports') ||
        normalized.includes('could not submit report')
    );
}

export function formatBugReportDate(isoDate: string): string {
    return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    }).format(new Date(isoDate));
}
