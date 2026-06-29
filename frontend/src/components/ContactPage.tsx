'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useApp } from '@/components/app-shell/AppProvider';
import {
    formatBugReportDate,
    listBugReportTracker,
    submitBugReport,
    type BugReportStatus,
    type BugReportSubCategory,
    type BugReportTrackerItem,
    type BugReportType,
} from '@/lib/bugReports';

const REPORT_TYPE_LABELS: Record<BugReportType, string> = {
    bug: 'Bug',
    feedback: 'Feedback',
    other: 'Other',
};

const SUB_CATEGORY_LABELS: Record<BugReportSubCategory, string> = {
    ui: 'UI / UX',
    data: 'Data / Sync',
    other: 'Other',
};

const DESCRIPTION_CONFIG: Record<BugReportType, { label: string; placeholder: string }> = {
    bug: {
        label: 'Description',
        placeholder: 'What happened? What did you expect instead?',
    },
    feedback: {
        label: 'Feedback',
        placeholder:
            'What would you like to see improved? Share what you enjoy and what could work better.',
    },
    other: {
        label: 'Message',
        placeholder: 'Tell us what you would like to share…',
    },
};

const STATUS_STYLES: Record<BugReportStatus, string> = {
    open: 'contact-report-status-open',
    in_progress: 'contact-report-status-progress',
    resolved: 'contact-report-status-resolved',
};

const STATUS_LABELS: Record<BugReportStatus, string> = {
    open: 'Open',
    in_progress: 'In progress',
    resolved: 'Resolved',
};

const inputClassName =
    'w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm';

function formatReportCategory(report: BugReportTrackerItem): string {
    if (report.reportType === 'other' || !report.subCategory) {
        return REPORT_TYPE_LABELS[report.reportType];
    }

    return `${REPORT_TYPE_LABELS[report.reportType]} · ${SUB_CATEGORY_LABELS[report.subCategory]}`;
}

function ReportCard({ report }: { report: BugReportTrackerItem }) {
    return (
        <article className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                    <p className="text-xs font-medium uppercase tracking-wide text-[var(--muted)]">
                        {report.displayId}
                    </p>
                    <h3 className="mt-1 font-medium">{report.title}</h3>
                </div>
                <span className={`contact-report-status shrink-0 ${STATUS_STYLES[report.status]}`}>
                    {STATUS_LABELS[report.status]}
                </span>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">{report.summary}</p>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-[var(--muted)]">
                <span className="rounded-full border border-[var(--border)] px-2 py-0.5">
                    {formatReportCategory(report)}
                </span>
                <span>Reported {formatBugReportDate(report.createdAt)}</span>
            </div>
        </article>
    );
}

export function ContactPage() {
    const { user } = useApp();
    const [title, setTitle] = useState('');
    const [reportType, setReportType] = useState<BugReportType>('bug');
    const [subCategory, setSubCategory] = useState<BugReportSubCategory>('ui');
    const [description, setDescription] = useState('');
    const [steps, setSteps] = useState('');
    const [email, setEmail] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [submittedMessage, setSubmittedMessage] = useState<string | null>(null);
    const [reports, setReports] = useState<BugReportTrackerItem[]>([]);
    const [reportsLoading, setReportsLoading] = useState(true);
    const [reportsError, setReportsError] = useState<string | null>(null);

    const showSubCategory = reportType === 'bug' || reportType === 'feedback';
    const showSteps = reportType === 'bug';
    const descriptionField = DESCRIPTION_CONFIG[reportType];

    useEffect(() => {
        let cancelled = false;

        async function loadReports() {
            setReportsLoading(true);
            setReportsError(null);

            try {
                const nextReports = await listBugReportTracker();
                if (!cancelled) {
                    setReports(nextReports);
                }
            } catch (error) {
                if (!cancelled) {
                    setReportsError(
                        error instanceof Error ? error.message : 'Could not load reports.',
                    );
                }
            } finally {
                if (!cancelled) {
                    setReportsLoading(false);
                }
            }
        }

        void loadReports();

        return () => {
            cancelled = true;
        };
    }, []);

    function handleReportTypeChange(nextType: BugReportType) {
        setReportType(nextType);

        if (nextType !== 'bug') {
            setSteps('');
        }
    }

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (!title.trim() || !description.trim()) {
            setSubmittedMessage('Please add a title and description before submitting.');
            return;
        }

        setSubmitting(true);
        setSubmittedMessage(null);

        try {
            await submitBugReport({
                title,
                reportType,
                subCategory: showSubCategory ? subCategory : undefined,
                description,
                stepsToReproduce: showSteps ? steps : undefined,
                email: email || user?.email || undefined,
                userId: user?.id ?? null,
            });

            setSubmittedMessage('Thanks — your report was submitted.');
            setTitle('');
            setReportType('bug');
            setSubCategory('ui');
            setDescription('');
            setSteps('');
            setEmail('');

            const nextReports = await listBugReportTracker();
            setReports(nextReports);
        } catch (error) {
            setSubmittedMessage(
                error instanceof Error
                    ? error.message
                    : 'Something went wrong while submitting your report.',
            );
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <section className="mx-auto flex max-w-3xl flex-col gap-8 py-8 md:py-12">
            <header className="text-center">
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-[var(--accent)]">
                    Contact
                </p>
                <h1 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">
                    Submit a Report.
                </h1>
                <p className="mx-auto mt-3 max-w-2xl text-base text-[var(--muted)] md:text-lg">
                    Found something broken? Have an idea? Submit a report and track it below.
                </p>
            </header>

            <form
                onSubmit={(event) => void handleSubmit(event)}
                className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6"
            >
                <h2 className="text-lg font-medium">Submit a report</h2>
                <p className="mt-1 text-sm text-[var(--muted)]">
                    Include as much detail as you can.
                </p>

                <div className="mt-5 grid gap-4">
                    <label className="grid gap-1.5 text-sm">
                        <span>Title</span>
                        <input
                            type="text"
                            value={title}
                            onChange={(event) => setTitle(event.target.value)}
                            placeholder="Include a title for your report"
                            className={inputClassName}
                        />
                    </label>

                    <label className="grid gap-1.5 text-sm">
                        <span>Category</span>
                        <select
                            value={reportType}
                            onChange={(event) =>
                                handleReportTypeChange(event.target.value as BugReportType)
                            }
                            className={inputClassName}
                        >
                            {(Object.keys(REPORT_TYPE_LABELS) as BugReportType[]).map((value) => (
                                <option key={value} value={value}>
                                    {REPORT_TYPE_LABELS[value]}
                                </option>
                            ))}
                        </select>
                    </label>

                    {showSubCategory && (
                        <label className="grid gap-1.5 text-sm">
                            <span>{reportType === 'bug' ? 'Bug type' : 'Feedback area'}</span>
                            <select
                                value={subCategory}
                                onChange={(event) =>
                                    setSubCategory(event.target.value as BugReportSubCategory)
                                }
                                className={inputClassName}
                            >
                                {(Object.keys(SUB_CATEGORY_LABELS) as BugReportSubCategory[]).map(
                                    (value) => (
                                        <option key={value} value={value}>
                                            {SUB_CATEGORY_LABELS[value]}
                                        </option>
                                    ),
                                )}
                            </select>
                        </label>
                    )}

                    <label className="grid gap-1.5 text-sm">
                        <span>{descriptionField.label}</span>
                        <textarea
                            value={description}
                            onChange={(event) => setDescription(event.target.value)}
                            placeholder={descriptionField.placeholder}
                            rows={4}
                            className={`${inputClassName} resize-y`}
                        />
                    </label>

                    {showSteps && (
                        <label className="grid gap-1.5 text-sm">
                            <span>Steps to reproduce (optional)</span>
                            <textarea
                                value={steps}
                                onChange={(event) => setSteps(event.target.value)}
                                placeholder={'1. Go to Series…\n2. Open a set…\n3. Click Add all…'}
                                rows={3}
                                className={`${inputClassName} resize-y`}
                            />
                        </label>
                    )}

                    <label className="grid gap-1.5 text-sm">
                        <span>Email (optional)</span>
                        <input
                            type="email"
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                            placeholder="We may contact you for further details"
                            className={inputClassName}
                        />
                    </label>
                </div>

                <div className="mt-5 flex flex-col gap-2">
                    <button
                        type="submit"
                        disabled={submitting}
                        className="w-fit shrink-0 rounded-lg border border-transparent bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--accent-hover)] active:bg-[var(--accent-hover)] disabled:opacity-50"
                    >
                        {submitting ? 'Submitting…' : 'Submit report'}
                    </button>
                    <p
                        className={`min-h-5 text-sm text-[var(--muted)] ${submittedMessage ? '' : 'invisible'}`}
                        aria-live="polite"
                    >
                        {submittedMessage ?? '\u00A0'}
                    </p>
                </div>
            </form>

            <div>
                <h2 className="text-lg font-medium">Tracked reports</h2>
                <p className="mt-1 text-sm text-[var(--muted)]">
                    Recent submissions appear here once the Supabase schema is installed.
                </p>
                {reportsLoading && (
                    <p className="mt-4 text-sm text-[var(--muted)]">Loading reports…</p>
                )}
                {reportsError && (
                    <p className="mt-4 text-sm text-[var(--danger)]">{reportsError}</p>
                )}
                {!reportsLoading && !reportsError && reports.length === 0 && (
                    <p className="mt-4 text-sm text-[var(--muted)]">No reports yet.</p>
                )}
                {!reportsLoading && reports.length > 0 && (
                    <div className="mt-4 grid gap-3">
                        {reports.map((report) => (
                            <ReportCard key={report.id} report={report} />
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
}
