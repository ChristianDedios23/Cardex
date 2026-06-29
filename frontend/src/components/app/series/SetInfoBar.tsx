import type { PokemonCardDetail, PokemonSetSummary } from '@/lib/api';
import type { SetMarketStats } from '@/components/app/types';
import {
    formatSeriesReleaseDate,
    formatSetCardCount,
    formatTcgPlayerMarketPrice,
} from '@/components/app/card-utils';
import { BulkActionButton } from '@/components/app/series/BulkActionButton';
import { CollectionProgressBar } from '@/components/app/series/CollectionProgressBar';
import { SetInfoField } from '@/components/app/series/SetInfoField';

export function SetInfoBar({
    set,
    cards,
    stats,
    onAddAll,
    onRemoveAll,
    bulkOperating = null,
    bulkCooldownSource = null,
    bulkCooldownProgress = 0,
    isBulkCooldownActive = false,
    addAllRemainingCount = 0,
    ownedInSetCount = 0,
}: {
    set: PokemonSetSummary;
    cards: PokemonCardDetail[];
    stats: SetMarketStats;
    onAddAll?: () => void;
    onRemoveAll?: () => void;
    bulkOperating?: 'add' | 'remove' | null;
    bulkCooldownSource?: 'add' | 'remove' | null;
    bulkCooldownProgress?: number;
    isBulkCooldownActive?: boolean;
    addAllRemainingCount?: number;
    ownedInSetCount?: number;
}) {
    const totalCards = set.total ?? cards.length;
    const isBulkBusy = bulkOperating !== null;

    return (
        <div className="mb-6 rounded-xl border border-[var(--border)] bg-[var(--background)]/80 p-3 backdrop-blur-sm sm:p-4">
            <div className="flex flex-col gap-4">
                <div className="grid gap-4 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] md:gap-0">
                    <div className="min-w-0 md:pr-5">
                        <div className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3">
                            <SetInfoField label="Set Name" value={set.name} />
                            <SetInfoField
                                label="Series"
                                value={set.series}
                                valueClassName="text-[var(--accent)]"
                            />
                            <SetInfoField
                                label="Release Date"
                                value={formatSeriesReleaseDate(set.releaseDate)}
                                className="col-span-2 sm:col-span-1"
                            />
                            <div className="col-span-2 grid grid-cols-2 gap-4 sm:col-span-3">
                                <SetInfoField
                                    label="Cards"
                                    value={formatSetCardCount(set, cards.length)}
                                />
                                <SetInfoField
                                    label="Most Expensive Card"
                                    value={stats.mostExpensiveName ?? ''}
                                    allowWrap
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex min-w-0 flex-col justify-center gap-4 border-[var(--border)] md:border-l md:pl-5">
                        <SetInfoField
                            label="Full Set Market Value"
                            value={formatTcgPlayerMarketPrice(stats.fullSetValue)}
                            valueClassName="text-[var(--success)]"
                        />
                        <SetInfoField
                            label="Your Set Value"
                            value={formatTcgPlayerMarketPrice(stats.yourSetValue)}
                            valueClassName="text-[var(--success)]"
                        />
                    </div>
                </div>

                {(onAddAll || onRemoveAll) && (
                    <div className="grid grid-cols-2 gap-3">
                        {onAddAll && (
                            <BulkActionButton
                                label={
                                    bulkOperating === 'add'
                                        ? 'Adding…'
                                        : addAllRemainingCount === 0
                                          ? 'All owned'
                                          : `Add all (${addAllRemainingCount})`
                                }
                                disabled={
                                    isBulkBusy || isBulkCooldownActive || addAllRemainingCount === 0
                                }
                                showCooldownBar={
                                    isBulkCooldownActive && bulkCooldownSource === 'remove'
                                }
                                cooldownProgress={bulkCooldownProgress}
                                onClick={onAddAll}
                                hoverClassName="hover:border-[var(--accent)] hover:text-[var(--foreground)]"
                            />
                        )}
                        {onRemoveAll && (
                            <BulkActionButton
                                label={
                                    bulkOperating === 'remove'
                                        ? 'Removing…'
                                        : ownedInSetCount === 0
                                          ? 'None owned'
                                          : `Remove all (${ownedInSetCount})`
                                }
                                disabled={
                                    isBulkBusy || isBulkCooldownActive || ownedInSetCount === 0
                                }
                                showCooldownBar={
                                    isBulkCooldownActive && bulkCooldownSource === 'add'
                                }
                                cooldownProgress={bulkCooldownProgress}
                                onClick={onRemoveAll}
                                hoverClassName="hover:border-[var(--danger)] hover:text-[var(--foreground)]"
                            />
                        )}
                    </div>
                )}

                {totalCards > 0 && (
                    <CollectionProgressBar
                        collected={stats.collectedCount}
                        total={totalCards}
                        fullWidth
                    />
                )}
            </div>
        </div>
    );
}
