'use client';

import { useState, type FormEvent } from 'react';

type ReportType = 'bug' | 'feedback' | 'other';
type SubCategory = 'ui' | 'data' | 'other';

type SampleReport = {
    id: string;
    title: string;
    type: ReportType;
    subCategory?: SubCategory;
    status: 'open' | 'in-progress' | 'resolved';
    summary: string;
    reportedAt: string;
};

const REPORT_TYPE_LABELS: Record<ReportType, string> = {
    bug: 'Bug',
    feedback: 'Feedback',
    other: 'Other',
};

const SUB_CATEGORY_LABELS: Record<SubCategory, string> = {
    ui: 'UI / UX',
    data: 'Data / Sync',
    other: 'Other',
};

const DESCRIPTION_CONFIG: Record<ReportType, { label: string; placeholder: string }> = {
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

const SAMPLE_REPORTS: SampleReport[] = [
    {
        id: 'CARDEX-12',
        title: 'Set progress bar shows 100% before all cards are owned',
        type: 'bug',
        subCategory: 'data',
        status: 'open',
        summary:
            'Progress checkpoint hits 100% when 49/50 cards are marked owned in Prismatic Evolutions.',
        reportedAt: 'Mar 8, 2026',
    },
    {
        id: 'CARDEX-9',
        title: 'Rarity symbol clipped on Double Rare cards',
        type: 'bug',
        subCategory: 'ui',
        status: 'in-progress',
        summary:
            'Multi-star rarity icon is slightly cropped in the card detail modal on smaller screens.',
        reportedAt: 'Mar 3, 2026',
    },
    {
        id: 'CARDEX-7',
        title: 'Wishlist sort options',
        type: 'feedback',
        subCategory: 'ui',
        status: 'open',
        summary: 'Would love to sort wishlist cards by price or rarity, not just date added.',
        reportedAt: 'Feb 28, 2026',
    },
];

const STATUS_STYLES: Record<SampleReport['status'], string> = {
    open: 'contact-report-status-open',
    'in-progress': 'contact-report-status-progress',
    resolved: 'contact-report-status-resolved',
};

const STATUS_LABELS: Record<SampleReport['status'], string> = {
    open: 'Open',
    'in-progress': 'In progress',
    resolved: 'Resolved',
};

const inputClassName =
    'w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm';

function formatReportCategory(report: SampleReport): string {
    if (report.type === 'other' || !report.subCategory) {
        return REPORT_TYPE_LABELS[report.type];
    }

    return `${REPORT_TYPE_LABELS[report.type]} · ${SUB_CATEGORY_LABELS[report.subCategory]}`;
}

function SampleReportCard({ report }: { report: SampleReport }) {
    return (
        <article className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                    <p className="text-xs font-medium uppercase tracking-wide text-[var(--muted)]">
                        {report.id}
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
                <span>Reported {report.reportedAt}</span>
            </div>
        </article>
    );
}

export function ContactPage() {
    const [title, setTitle] = useState('');
    const [reportType, setReportType] = useState<ReportType>('bug');
    const [subCategory, setSubCategory] = useState<SubCategory>('ui');
    const [description, setDescription] = useState('');
    const [steps, setSteps] = useState('');
    const [email, setEmail] = useState('');
    const [submittedMessage, setSubmittedMessage] = useState<string | null>(null);

    const showSubCategory = reportType === 'bug' || reportType === 'feedback';
    const showSteps = reportType === 'bug';
    const descriptionField = DESCRIPTION_CONFIG[reportType];

    function handleReportTypeChange(nextType: ReportType) {
        setReportType(nextType);

        if (nextType !== 'bug') {
            setSteps('');
        }
    }

    function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (!title.trim() || !description.trim()) {
            setSubmittedMessage('Please add a title and description before submitting.');
            return;
        }

        setSubmittedMessage(
            'Thanks — this is a placeholder tracker. Your report was not saved yet, but the form is ready for backend wiring.',
        );
        setTitle('');
        setReportType('bug');
        setSubCategory('ui');
        setDescription('');
        setSteps('');
        setEmail('');
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
                    Found something broken? Have an idea? Submit a report and we&apos;ll track it
                    here. This page is a sample preview — submissions are not stored yet.
                </p>
            </header>

            <form
                onSubmit={handleSubmit}
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
                                handleReportTypeChange(event.target.value as ReportType)
                            }
                            className={inputClassName}
                        >
                            {(Object.keys(REPORT_TYPE_LABELS) as ReportType[]).map((value) => (
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
                                    setSubCategory(event.target.value as SubCategory)
                                }
                                className={inputClassName}
                            >
                                {(Object.keys(SUB_CATEGORY_LABELS) as SubCategory[]).map(
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
                        className="w-fit shrink-0 rounded-lg border border-transparent bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--accent-hover)] active:bg-[var(--accent-hover)]"
                    >
                        Submit report
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
                <h2 className="text-lg font-medium">Example reports</h2>
                <p className="mt-1 text-sm text-[var(--muted)]">
                    Sample entries showing how tracked reports will appear once this is connected.
                </p>
                <div className="mt-4 grid gap-3">
                    {SAMPLE_REPORTS.map((report) => (
                        <SampleReportCard key={report.id} report={report} />
                    ))}
                </div>
            </div>
        </section>
    );
}
