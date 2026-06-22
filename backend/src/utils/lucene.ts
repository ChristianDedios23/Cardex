const LUCENE_SPECIAL_CHARS = /([+\-&|!(){}[\]^"~*?:\\/])/g;

export function escapeLucene(value: string): string {
    return value.replace(LUCENE_SPECIAL_CHARS, '\\$1');
}

/** Normalize user input for caching and term extraction (hyphens treated like spaces). */
export function normalizeSearchInput(query: string): string {
    return query.trim().toLowerCase().replace(/-/g, ' ').replace(/\s+/g, ' ').trim();
}

/** Split a search into name tokens, e.g. "alakazam ex" and "alakazam-ex" → ["alakazam", "ex"]. */
export function parseSearchTerms(query: string): string[] {
    const normalized = normalizeSearchInput(query);

    if (!normalized) {
        return [];
    }

    return normalized.split(' ').filter((term) => term.length > 0);
}

/**
 * Build a Pokémon TCG API Lucene name query.
 * Single term: prefix match on name. Multiple terms: each must prefix-match name (AND),
 * so "alakazam ex" matches both "Alakazam ex" and "Alakazam-EX".
 */
export function buildNameSearchQuery(query: string): string {
    const terms = parseSearchTerms(query);

    if (terms.length === 0) {
        return '';
    }

    if (terms.length === 1) {
        const [singleTerm] = terms;

        if (!singleTerm) {
            return '';
        }

        return `name:${escapeLucene(singleTerm)}*`;
    }

    return terms.map((term) => `name:${escapeLucene(term)}*`).join(' AND ');
}
