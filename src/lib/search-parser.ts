
export type SearchNode =
    | { type: 'AND', left: SearchNode, right: SearchNode }
    | { type: 'OR', left: SearchNode, right: SearchNode }
    | { type: 'TERM', value: string }

export function parseSearchQuery(query: string): SearchNode | null {
    const tokens = tokenize(query);
    if (tokens.length === 0) return null;

    const parser = new Parser(tokens);
    return parser.parse();
}

// Token types
type TokenType = 'WORD' | 'AND' | 'OR' | 'LPAREN' | 'RPAREN';
type Token = { type: TokenType; value: string };

function tokenize(input: string): Token[] {
    const tokens: Token[] = [];
    let i = 0;

    while (i < input.length) {
        const char = input[i];

        // Skip whitespace
        if (/\s/.test(char)) {
            i++;
            continue;
        }

        // Handle quotes for exact phrase matching
        if (char === '"') {
            i++; // skip opening quote
            let value = '';
            while (i < input.length && input[i] !== '"') {
                value += input[i];
                i++;
            }
            i++; // skip closing quote
            // Only add if not empty
            if (value) {
                tokens.push({ type: 'WORD', value });
            }
            continue;
        }

        if (char === '*') {
            tokens.push({ type: 'AND', value: '*' });
            i++;
            continue;
        }

        if (char === '+') {
            tokens.push({ type: 'OR', value: '+' });
            i++;
            continue;
        }

        if (char === '(') {
            tokens.push({ type: 'LPAREN', value: '(' });
            i++;
            continue;
        }

        if (char === ')') {
            tokens.push({ type: 'RPAREN', value: ')' });
            i++;
            continue;
        }

        // Word (stop at special chars OR spaces)
        let value = '';
        // Note: We don't include quotes in the stop characters list because
        // if a quote appears in the middle of a word without space like abc"def", 
        // it's ambiguous. But for simple parsing, let's treat it as a delimiter essentially.
        // Standard logic: read until delimiter.
        while (i < input.length && !/[\s*+()]/.test(input[i]) && input[i] !== '"') {
            value += input[i];
            i++;
        }
        if (value) {
            tokens.push({ type: 'WORD', value });
        }
    }

    return tokens;
}

class Parser {
    private tokens: Token[];
    private current: number = 0;

    constructor(tokens: Token[]) {
        this.tokens = tokens;
    }

    private peek(): Token | undefined {
        return this.tokens[this.current];
    }

    private consume(): Token {
        return this.tokens[this.current++];
    }

    private match(type: TokenType): boolean {
        if (this.current >= this.tokens.length) return false;
        if (this.tokens[this.current].type === type) {
            this.current++;
            return true;
        }
        return false;
    }

    public parse(): SearchNode | null {
        try {
            return this.expression();
        } catch (e) {
            console.error(e);
            return null;
        }
    }

    // Expression: Term (+ Term)*
    private expression(): SearchNode {
        let node = this.term();

        while (this.match('OR')) {
            const right = this.term();
            node = { type: 'OR', left: node, right };
        }

        return node;
    }

    // Term: Factor (* Factor)*  (Also implicit AND for adjacent Factors)
    private term(): SearchNode {
        let node = this.factor();

        // Check for explicit AND (*) or implicit (Start of another Factor)
        // Implicit AND happens if next is WORD or LPAREN.
        while (true) {
            if (this.match('AND')) {
                const right = this.factor();
                node = { type: 'AND', left: node, right };
            } else {
                const next = this.peek();
                // If next is WORD (including quoted phrases) or LPAREN, it's an implicit AND
                if (next && (next.type === 'WORD' || next.type === 'LPAREN')) {
                    const right = this.factor();
                    node = { type: 'AND', left: node, right };
                } else {
                    break;
                }
            }
        }

        return node;
    }

    // Factor: ( Expression ) | WORD
    private factor(): SearchNode {
        if (this.match('LPAREN')) {
            const node = this.expression();
            this.match('RPAREN'); // Consume closing paren if present
            return node;
        }

        const token = this.peek();
        if (token && token.type === 'WORD') {
            this.consume();
            return { type: 'TERM', value: token.value };
        }

        // Fallback logic for unexpected tokens to avoid crashing
        if (token) {
            this.consume();
            return { type: 'TERM', value: token.value };
        }

        throw new Error('Unexpected end of input');
    }
}

// Convert Parse Tree to PostgREST Filter String
// Columns: Array of column names to search in (OR logic per term)
export function buildPostgrestFilter(node: SearchNode, columns: string[]): string {
    if (node.type === 'TERM') {
        // Term should match ANY of the columns (OR)
        // original_title.ilike.%val%,simple_summary.ilike.%val%
        // We return the raw conditions joined by comma. 
        // The caller (supabase.or) will wrap this appropriately.
        return columns.map(col => `${col}.ilike.%${node.value}%`).join(',');
    }

    if (node.type === 'AND') {
        const left = buildPostgrestFilter(node.left, columns);
        const right = buildPostgrestFilter(node.right, columns);
        return `and(${left},${right})`;
    }

    if (node.type === 'OR') {
        const left = buildPostgrestFilter(node.left, columns);
        const right = buildPostgrestFilter(node.right, columns);
        return `or(${left},${right})`;
    }

    return '';
}
