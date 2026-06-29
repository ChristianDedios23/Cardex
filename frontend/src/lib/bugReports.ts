import { createClient } from '@/lib/supabase/client';

export type BugReportCategory = 'bug' | 'feedback' | 'other';
export type BugReportBugType = 'ui_ux' | 'data_sync' | 'other';
export type BugReportStatus = 'open' | 'in_progress' | 'resolved';

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

type BugReportTrackerRow = {
    id: string;
    display_id: string;
    title: string;
    category: BugReportCategory;
    bug_type: BugReportBugType | null;
    status: BugReportStatus;
    summary: string;
    created_at: string;
};

function mapTrackerRow(row: BugReportTrackerRow): BugReportTrackerItem {
    return {
        id: row.id,
        displayId: row.display_id,
        title: row.title,
        category: row.category,
        bugType: row.bug_type,
        status: row.status,
        summary: row.summary,
        createdAt: row.created_at,
    };
}

export async function submitBugReport(input: BugReportInput): Promise<void> {
    const supabase = createClient();

    const payload = {
        user_id: input.userId ?? null,
        title: input.title.trim(),
        category: input.category,
        bug_type: input.category === 'other' ? null : (input.bugType ?? null),
        description: input.description.trim(),
        steps_to_reproduce: input.stepsToReproduce?.trim() || null,
        contact_email: input.contactEmail?.trim() || null,
    };

    const { error } = await supabase.from('bug_reports').insert(payload);

    if (error) {
        throw new Error(error.message);
    }
}

export async function listBugReportTracker(limit = 50): Promise<BugReportTrackerItem[]> {
    const supabase = createClient();

    const { data, error } = await supabase.rpc('list_bug_report_tracker', {
        max_rows: limit,
    });

    if (error) {
        throw new Error(error.message);
    }

    return ((data ?? []) as BugReportTrackerRow[]).map(mapTrackerRow);
}

export function formatBugReportDate(isoDate: string): string {
    return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    }).format(new Date(isoDate));
}
