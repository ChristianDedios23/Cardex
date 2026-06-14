const LUCENE_SPECIAL_CHARS = /([+\-&|!(){}[\]^"~*?:\\/])/g;

export function escapeLucene(value: string): string {
    return value.replace(LUCENE_SPECIAL_CHARS, '\\$1');
}
