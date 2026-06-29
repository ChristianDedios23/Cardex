export function CollectionProgressBar({
    collected,
    total,
    fullWidth = false,
}: {
    collected: number;
    total: number;
    fullWidth?: boolean;
}) {
    const progressPercent = total > 0 ? Math.min((collected / total) * 100, 100) : 0;
    const isComplete = total > 0 && collected >= total;
    const checkpoints = [25, 50, 75, 100] as const;

    function checkpointPosition(checkpoint: number) {
        if (checkpoint >= 100) {
            return { right: '0px' };
        }

        return { left: `${checkpoint}%`, transform: 'translateX(-50%)' };
    }

    return (
        <div className="flex w-full flex-col items-center">
            <p className="text-sm font-medium text-[var(--foreground)]">
                {collected.toLocaleString()} / {total.toLocaleString()} collected
            </p>
            <div className={`relative mt-2 w-full min-w-16 ${fullWidth ? '' : 'max-w-lg'}`}>
                <div
                    className={
                        isComplete
                            ? 'collection-progress-shooting-star'
                            : 'relative h-2 overflow-hidden rounded-full bg-[var(--border)]'
                    }
                >
                    {isComplete && (
                        <>
                            <span className="collection-progress-spark" aria-hidden="true" />
                            <span
                                className="collection-progress-spark-backdrop"
                                aria-hidden="true"
                            />
                        </>
                    )}
                    <div
                        className={
                            isComplete
                                ? 'collection-progress-shooting-star-inner'
                                : 'relative h-full'
                        }
                        role="progressbar"
                        aria-valuenow={collected}
                        aria-valuemin={0}
                        aria-valuemax={total}
                        aria-label={`${collected} of ${total} cards collected`}
                    >
                        <div
                            className={`h-full rounded-full transition-[width] duration-500 ease-out ${
                                isComplete
                                    ? 'collection-progress-fill-complete'
                                    : 'bg-[var(--accent)]'
                            }`}
                            style={{ width: `${progressPercent}%` }}
                        />
                        {checkpoints.map((checkpoint) => (
                            <div
                                key={checkpoint}
                                aria-hidden="true"
                                className={`pointer-events-none absolute top-0 z-10 h-full w-px ${
                                    progressPercent >= checkpoint
                                        ? 'bg-[var(--foreground)]/50'
                                        : 'bg-[var(--muted)]/35'
                                }`}
                                style={checkpointPosition(checkpoint)}
                            />
                        ))}
                    </div>
                </div>
                <div className="relative mt-1 h-3 w-full" aria-hidden="true">
                    {checkpoints.map((checkpoint) => (
                        <span
                            key={checkpoint}
                            className={`absolute text-[9px] font-medium tabular-nums ${
                                progressPercent >= checkpoint
                                    ? 'text-[var(--foreground)]'
                                    : 'text-[var(--muted)]'
                            }`}
                            style={checkpointPosition(checkpoint)}
                        >
                            {checkpoint}%
                        </span>
                    ))}
                </div>
            </div>
        </div>
    );
}
