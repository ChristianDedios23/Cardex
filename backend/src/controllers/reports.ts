import { Request, Response } from 'express';
import { supabase } from '../config/supabase';

const REPORT_CATEGORIES = ['bug', 'feedback', 'other'] as const;
const BUG_TYPES = ['ui_ux', 'data_sync', 'other'] as const;

type ReportCategory = (typeof REPORT_CATEGORIES)[number];
type BugType = (typeof BUG_TYPES)[number];

type ReportRow = {
    id: string;
    title: string;
    category: ReportCategory;
    bug_type: BugType | null;
    description: string;
    status: string;
    created_at: string;
};

function formatDisplayId(id: string): string {
    return id.replace(/-/g, '').slice(0, 8).toUpperCase();
}

function mapReportRow(row: ReportRow) {
    const description = row.description;
    const summary =
        description.length > 280 ? `${description.slice(0, 280)}…` : description;

    return {
        id: row.id,
        displayId: formatDisplayId(row.id),
        title: row.title,
        category: row.category,
        bugType: row.bug_type,
        status: row.status,
        summary,
        createdAt: row.created_at,
    };
}

function parseCategory(value: unknown): ReportCategory | null {
    return typeof value === 'string' && REPORT_CATEGORIES.includes(value as ReportCategory)
        ? (value as ReportCategory)
        : null;
}

function parseBugType(value: unknown): BugType | null {
    if (value === undefined || value === null || value === '') {
        return null;
    }

    return typeof value === 'string' && BUG_TYPES.includes(value as BugType)
        ? (value as BugType)
        : null;
}

export async function createReport(req: Request, res: Response) {
    const title = typeof req.body?.title === 'string' ? req.body.title.trim() : '';
    const description =
        typeof req.body?.description === 'string' ? req.body.description.trim() : '';
    const category = parseCategory(req.body?.category);
    const bugType = parseBugType(req.body?.bug_type ?? req.body?.bugType);
    const stepsToReproduce =
        typeof req.body?.steps_to_reproduce === 'string'
            ? req.body.steps_to_reproduce.trim()
            : typeof req.body?.stepsToReproduce === 'string'
              ? req.body.stepsToReproduce.trim()
              : '';
    const contactEmail =
        typeof req.body?.contact_email === 'string'
            ? req.body.contact_email.trim()
            : typeof req.body?.contactEmail === 'string'
              ? req.body.contactEmail.trim()
              : '';

    if (!title) {
        return res.status(400).json({ error: 'Title is required.' });
    }

    if (title.length > 160) {
        return res.status(400).json({ error: 'Title must be 160 characters or fewer.' });
    }

    if (!description) {
        return res.status(400).json({ error: 'Description is required.' });
    }

    if (!category) {
        return res.status(400).json({ error: 'Category must be bug, feedback, or other.' });
    }

    if (category !== 'bug' && bugType) {
        return res.status(400).json({ error: 'Bug type is only allowed for bug reports.' });
    }

    if (category === 'bug' && bugType && !BUG_TYPES.includes(bugType)) {
        return res.status(400).json({ error: 'Bug type must be ui_ux, data_sync, or other.' });
    }

    const payload = {
        user_id: req.user?.id ?? null,
        title,
        category,
        bug_type: category === 'bug' ? bugType : null,
        description,
        steps_to_reproduce: stepsToReproduce || null,
        contact_email: contactEmail || null,
    };

    const { error } = await supabase.from('reports').insert(payload);

    if (error) {
        console.error('[reports] insert failed:', error.message);
        return res.status(500).json({ error: 'Could not submit report. Please try again.' });
    }

    return res.status(201).json({ ok: true });
}

export async function listReports(req: Request, res: Response) {
    const limitParam = Number(req.query.limit);
    const limit = Number.isFinite(limitParam)
        ? Math.min(Math.max(Math.trunc(limitParam), 1), 100)
        : 50;

    const { data, error } = await supabase
        .from('reports')
        .select('id, title, category, bug_type, description, status, created_at')
        .order('created_at', { ascending: false })
        .limit(limit);

    if (error) {
        console.error('[reports] list failed:', error.message);
        return res.status(500).json({ error: 'Could not load reports.' });
    }

    return res.status(200).json({
        data: ((data ?? []) as ReportRow[]).map(mapReportRow),
    });
}
