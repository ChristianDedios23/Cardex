import { resolveRaritySymbol, type RaritySymbolVariant } from '@/lib/pokemonRaritySymbols';

const BLACK = '#000000';
const WHITE = '#ffffff';
const GOLD = '#ffd700';
const SILVER = '#c0c0c0';
const STROKE = 0.55;
const STAR_RADIUS = 4.5;
const STAR_GAP = 0.25;
const STAR_STEP = STAR_RADIUS * 2 + STAR_GAP;
const STAR_INSET = STAR_RADIUS + STROKE / 2;

function starPoints(
    cx: number,
    cy: number,
    outerRadius: number,
    innerRadius = outerRadius * 0.42,
): string {
    const points: string[] = [];

    for (let index = 0; index < 5; index += 1) {
        const outerAngle = -Math.PI / 2 + (index * 2 * Math.PI) / 5;
        const innerAngle = outerAngle + Math.PI / 5;

        points.push(
            `${cx + outerRadius * Math.cos(outerAngle)},${cy + outerRadius * Math.sin(outerAngle)}`,
            `${cx + innerRadius * Math.cos(innerAngle)},${cy + innerRadius * Math.sin(innerAngle)}`,
        );
    }

    return points.join(' ');
}

function StrokedShape({
    fill,
    stroke = WHITE,
    children,
}: {
    fill: string;
    stroke?: string;
    children: React.ReactNode;
}) {
    return (
        <g fill={fill} stroke={stroke} strokeWidth={STROKE} strokeLinejoin="round">
            {children}
        </g>
    );
}

function SingleStar({ fill, stroke = WHITE }: { fill: string; stroke?: string }) {
    return (
        <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true" className="block">
            <StrokedShape fill={fill} stroke={stroke}>
                <polygon points={starPoints(7, 7, STAR_RADIUS)} />
            </StrokedShape>
        </svg>
    );
}

function MultiStarRow({
    fills,
    count,
    stroke = WHITE,
}: {
    fills: string[];
    count: number;
    stroke?: string;
}) {
    const width = STAR_INSET * 2 + (count - 1) * STAR_STEP;

    return (
        <svg
            width={width}
            height="14"
            viewBox={`0 0 ${width} 14`}
            aria-hidden="true"
            className="block"
        >
            {Array.from({ length: count }, (_, index) => (
                <StrokedShape key={index} fill={fills[index] ?? fills[0]} stroke={stroke}>
                    <polygon points={starPoints(STAR_INSET + index * STAR_STEP, 7, STAR_RADIUS)} />
                </StrokedShape>
            ))}
        </svg>
    );
}

function RaritySymbolSvg({ variant }: { variant: RaritySymbolVariant }) {
    switch (variant) {
        case 'common':
            return (
                <svg
                    width="14"
                    height="14"
                    viewBox="0 0 14 14"
                    aria-hidden="true"
                    className="block"
                >
                    <StrokedShape fill={BLACK}>
                        <circle cx="7" cy="7" r="4.25" />
                    </StrokedShape>
                </svg>
            );
        case 'uncommon':
            return (
                <svg
                    width="14"
                    height="14"
                    viewBox="0 0 14 14"
                    aria-hidden="true"
                    className="block"
                >
                    <StrokedShape fill={BLACK}>
                        <polygon points="7,2.5 11.5,7 7,11.5 2.5,7" />
                    </StrokedShape>
                </svg>
            );
        case 'promo':
            return (
                <svg
                    width="34"
                    height="14"
                    viewBox="0 0 34 14"
                    aria-hidden="true"
                    className="block"
                >
                    <StrokedShape fill={BLACK}>
                        <polygon points={starPoints(7, 7, STAR_RADIUS)} />
                    </StrokedShape>
                    <text
                        x="16"
                        y="9.5"
                        fill={BLACK}
                        stroke={WHITE}
                        strokeWidth={0.35}
                        paintOrder="stroke fill"
                        fontSize="6"
                        fontWeight="700"
                        fontFamily="system-ui, sans-serif"
                    >
                        PROMO
                    </text>
                </svg>
            );
        case 'double-rare':
            return <MultiStarRow count={2} fills={[BLACK, BLACK]} />;
        case 'illustration-rare':
        case 'shiny-rare':
            return <SingleStar fill={GOLD} />;
        case 'ultra-rare':
            return <MultiStarRow count={2} fills={[SILVER, SILVER]} />;
        case 'special-illustration-rare':
            return <MultiStarRow count={2} fills={[GOLD, GOLD]} />;
        case 'hyper-rare':
            return <MultiStarRow count={3} fills={[GOLD, GOLD, GOLD]} />;
        case 'rare':
        default:
            return <SingleStar fill={BLACK} />;
    }
}

export function RaritySymbol({ rarity, className }: { rarity: string; className?: string }) {
    const variant = resolveRaritySymbol(rarity);

    if (!variant) {
        return null;
    }

    return (
        <span
            className={`inline-flex shrink-0 items-center ${className ?? ''}`}
            title={rarity}
            aria-hidden="true"
        >
            <RaritySymbolSvg variant={variant} />
        </span>
    );
}
