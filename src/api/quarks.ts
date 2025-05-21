// Types for configuration and responses
interface QuarksConfig {
    baseUrl: string;
    appId: string;
}

interface FilterCondition {
    eq?: any;
    eq_any?: any[];
    gt?: any;
    lt?: any;
    gte?: any;
    lte?: any;
}

interface WhereCondition {
    [field: string]: FilterCondition;
}

interface FilterOptions {
    where?: WhereCondition | {
        or?: WhereCondition[];
        and?: WhereCondition[];
    };
}

interface QueryOptions {
    skip?: number;
    limit?: number;
    sortBy?: string;
    sortDesc?: boolean;
    where?: WhereCondition | {
        or?: WhereCondition[];
        and?: WhereCondition[];
    };
}

interface SearchJsonInclude {
    map: {
        field: string;
        as: string;
    };
    module?: string;
    filter?: string;
    params?: string;
}

interface SearchJsonOptions {
    keys: string;
    include: SearchJsonInclude;
    skip?: number;
    limit?: number;
}

interface FuzzySearchItem {
    word: string;
    tag?: string;
    meta?: string;
}

interface FuzzySearchUpdateItem extends FuzzySearchItem {
    oldword: string;
}

interface FuzzySearchQuery {
    word: string;
    /**
     * Maximum number of character edits (insertions, deletions, or substitutions) allowed when matching words.
     * Higher values will return more approximate matches but may be slower.
     * Example: searching "apple" with maxedits=2 would match:
     * - "aple" (1 edit - deletion)
     * - "apples" (1 edit - insertion)
     * - "apl" (2 edits - deletions)
     */
    maxedits?: number;
}

// Generate a unique id similar to nanoid
const generateId = (size: number = 20): string => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    return Array.from(crypto.getRandomValues(new Uint8Array(size)))
        .map(x => chars[x % chars.length])
        .join('');
};

// Generate unique identifiers using a custom algorithm called "Snowflake" 
// which creates 64-bit IDs composed of a timestamp, a machine identifier, and a sequence number, allowing for highly scalable and time-ordered unique IDs across their distributed systems
const generateSnowflakeId = (): string => {
    const timestamp = Date.now();
    const machineId = generateId(6);
    const sequence = generateId(6);
    return `${timestamp}-${machineId}-${sequence}`;
};

// Main Quarks Client Class
class QuarksClient {
    private baseUrl: string;
    private appId: string;

    constructor(config: QuarksConfig) {
        this.baseUrl = `${config.baseUrl}`;
        this.appId = config.appId;
    }

    // Create a collection reference
    collection<T extends Record<string, any>>(name: string) {
        return new CollectionReference<T>(this, name);
    }

    // Add prefix to word for fuzzy operations
    private addPrefixToWord(word: string): string {
        return `${this.appId}:${word}`;
    }

    // Delete a word from fuzzy search. Tag and meta are optional.
    async deleteFuzzyWord(item: FuzzySearchItem): Promise<{ result: boolean }> {
        const prefixedItem = {
            ...item,
            word: this.addPrefixToWord(item.word)
        };
        return this.request('/fuzzy/delete', 'DELETE', prefixedItem);
    }

    // Update a word in fuzzy search (delete old word and insert new word)
    async updateFuzzyWord(item: FuzzySearchUpdateItem): Promise<{ result: boolean }> {
        const prefixedItem = {
            ...item,
            oldword: this.addPrefixToWord(item.oldword),
            word: this.addPrefixToWord(item.word)
        };
        return this.request('/fuzzy/update', 'POST', prefixedItem);
    }

    // Insert a word for fuzzy search
    async insertFuzzyWord(item: FuzzySearchItem): Promise<{ result: boolean }> {
        const prefixedItem = {
            ...item,
            word: this.addPrefixToWord(item.word)
        };
        console.log("/fuzzy/insert", prefixedItem);
        return this.request('/fuzzy/insert', 'POST', prefixedItem);
    }

    // Search for words using fuzzy matching
    async searchFuzzyWord(query: FuzzySearchQuery): Promise<any> {
        const prefixedQuery = {
            ...query,
            word: this.addPrefixToWord(query.word)
        };
        console.log("/fuzzy/prefix", prefixedQuery);
        return this.request('/fuzzy/prefix', 'POST', prefixedQuery);
    }

    private async request(endpoint: string, method: 'GET' | 'POST' | 'DELETE', body?: any) {
        const url = `${this.baseUrl}${endpoint}`;
        console.log(method, "url", url, body);
        try {
            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: body ? JSON.stringify(body) : undefined,
            });

            if (!response.ok) {
                const text = await response.text();
                console.log("text", text);
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Request failed:', error);
            throw error;
        }
    }

    // Base methods used by CollectionReference
    async put(key: string, value: any): Promise<void> {
        await this.request('/putjson', 'POST', { key, value });
    }

    async get(key: string): Promise<any> {
        const response = await this.request('/getjson', 'POST', { key });
        return response;
    }

    async query(prefix: string, options: QueryOptions = {}): Promise<any[]> {
        const { skip = 0, limit = 50, sortBy, sortDesc, where } = options;
        var endpoint = `/getsorted?keys=${prefix}*&skip=${skip}&limit=${limit}`;
        
        if(where) {
            const filter = { where };
            endpoint += `&filter=${encodeURIComponent(JSON.stringify(filter))}`;
        }
        if(sortBy) endpoint += `&sortby=${sortBy}&des=${sortDesc}`;

        console.log(endpoint);

        const response = await this.request(endpoint, 'GET');
        
        return response.result.map((item: any) => item.value);
    }

    async remove(key: string): Promise<void> {
        await this.request(`/remove?key=${key}`, 'GET');
    }

    async increment(key: string, field: string, value: number): Promise<void> {
        await this.request('/incrval', 'POST', {
            key,
            value: { [field]: value },
        });
    }

    async searchJson(options: SearchJsonOptions): Promise<any[]> {
        const endpoint = '/searchjson';
        console.log(endpoint, options);
        const response = await this.request(endpoint, 'POST', options);
        console.log(response);
        return response.result;
    }

    // Fuzzy search methods
    async fuzzyInsert(item: FuzzySearchItem): Promise<void> {
        await this.request('/fuzzy/insert', 'POST', item);
    }

    async fuzzyQuery(query: FuzzySearchQuery): Promise<FuzzySearchItem[]> {
        const response = await this.request('/fuzzy/query', 'POST', query);
        return response.result;
    }

    async fuzzyMatch(word: string): Promise<FuzzySearchItem[]> {
        const response = await this.request('/fuzzy/match', 'POST', { word });
        return response.result;
    }

    async fuzzyPrefix(query: FuzzySearchQuery): Promise<FuzzySearchItem[]> {
        const response = await this.request('/fuzzy/prefix', 'POST', query);
        return response.result;
    }

    async fuzzySubstring(word: string): Promise<FuzzySearchItem[]> {
        const response = await this.request('/fuzzy/substring', 'POST', { word });
        return response.result;
    }
}

// Collection Reference Class
class CollectionReference<T extends Record<string, any>> {
    private client: QuarksClient;
    private collectionName: string;

    constructor(client: QuarksClient, name: string) {
        this.client = client;
        this.collectionName = name;
    }

    // Create a new document with auto-generated ID
    async add(data: T): Promise<{ id: string; ref: DocumentReference<T> }> {
        const doc = this.doc();
        const id = doc.getId();
        await doc.set(data);
        return { id, ref: doc };
    }

    // Get a document reference
    doc(id?: string): DocumentReference<T> {
        const docId = id || generateSnowflakeId();
        return new DocumentReference<T>(this.client, this.getFullPath(docId));
    }

    private getFullPath(docId: string): string {
        return `${this.client['appId']}_${this.collectionName}_${docId}`;
    }

    // Query the collection with options
    async get(options: QueryOptions = {}): Promise<T[]> {
        const prefix = `${this.client['appId']}_${this.collectionName}_`;
        return this.client.query(prefix, options);
    }

    // Query with filters
    where(field: keyof T, operator: 'eq' | 'eq_any' | 'gt' | 'lt' | 'gte' | 'lte', value: any): Query<T> {
        const condition: WhereCondition = { [field as string]: { [operator]: value } };
        return new Query<T>(this.client, this.collectionName, {
            where: condition
        });
    }

    // Add OR conditions
    orWhere(conditions: Array<{ field: keyof T, operator: 'eq' | 'eq_any' | 'gt' | 'lt' | 'gte' | 'lte', value: any }>): Query<T> {
        const orConditions = conditions.map(({ field, operator, value }) => {
            const condition: WhereCondition = {};
            condition[field as string] = { [operator]: value };
            return condition;
        });
        
        return new Query<T>(this.client, this.collectionName, {
            where: {
                or: orConditions
            }
        });
    }

    // Add AND conditions
    andWhere(conditions: Array<{ field: keyof T, operator: 'eq' | 'eq_any' | 'gt' | 'lt' | 'gte' | 'lte', value: any }>): Query<T> {
        const andConditions = conditions.map(({ field, operator, value }) => {
            const condition: WhereCondition = {};
            condition[field as string] = { [operator]: value };
            return condition;
        });
        
        return new Query<T>(this.client, this.collectionName, {
            where: {
                and: andConditions
            }
        });
    }
    
    // Order by field
    orderBy(field: keyof T, direction: 'asc' | 'desc' = 'asc'): Query<T> {
        return new Query<T>(this.client, this.collectionName, {
            sortBy: field as string,
            sortDesc: direction === 'desc'
        });
    }

    // Limit results
    limit(limit: number): Query<T> {
        return new Query<T>(this.client, this.collectionName, { limit });
    }

    // Skip results
    offset(skip: number): Query<T> {
        return new Query<T>(this.client, this.collectionName, { skip });
    }

    // Add searchJson method to allow for join-like queries
    async searchJson(options: Partial<SearchJsonOptions> = {}): Promise<T[]> {
        const searchOptions: SearchJsonOptions = {
            keys: `${this.client['appId']}_${this.collectionName}_*`,
            include: options.include!,
            ...(options.skip !== undefined && { skip: options.skip }),
            ...(options.limit !== undefined && { limit: options.limit }),
        };
        
        return this.client.searchJson(searchOptions);
    }
}

// Document Reference Class
class DocumentReference<T extends Record<string, any>> {
    private client: QuarksClient;
    private path: string;

    constructor(client: QuarksClient, path: string) {
        this.client = client;
        this.path = path;
    }

    // Get document ID
    getId(): string {
        return this.path.split('_').pop() || '';
    }

    // Set document data
    async set(data: T): Promise<{ id: string }> {
        const id = this.getId();
        await this.client.put(this.path, {
            ...data,
            id,
            path: this.path,
            created_at: data.created_at || Date.now(),
            updated_at: Date.now(),
        });
        return { id };
    }

    // Get document data
    async get(): Promise<T | null> {
        return this.client.get(this.path);
    }

    // Update document data
    async update(data: Partial<T>): Promise<void> {
        const current = await this.get();
        if (!current) throw new Error('Document not found');
        await this.set({
            ...current,
            ...data,
            updated_at: Date.now(),
        });
    }

    // Delete document
    async delete(): Promise<void> {
        await this.client.remove(this.path);
    }

    // Increment a numeric field
    async increment(field: keyof T, value: number): Promise<void> {
        await this.client.increment(this.path, field as string, value);
    }
}

// Query Class
class Query<T extends Record<string, any>> {
    private client: QuarksClient;
    private collectionName: string;
    private queryOptions: QueryOptions;

    constructor(client: QuarksClient, collectionName: string, options: QueryOptions = {}) {
        this.client = client;
        this.collectionName = collectionName;
        this.queryOptions = options;
    }

    // Execute the query
    get(): Promise<T[]> {
        const prefix = `${this.client['appId']}_${this.collectionName}_`;
        return this.client.query(prefix, this.queryOptions);
    }

    // Add where condition
    where(field: keyof T, operator: 'eq' | 'eq_any' | 'gt' | 'lt' | 'gte' | 'lte', value: any): Query<T> {
        const condition: WhereCondition = {};
        condition[field as string] = { [operator]: value };
        this.queryOptions.where = condition;
        return this;
    }

    // Add OR conditions
    orWhere(conditions: Array<{ field: keyof T, operator: 'eq' | 'eq_any' | 'gt' | 'lt' | 'gte' | 'lte', value: any }>): Query<T> {
        const orConditions = conditions.map(({ field, operator, value }) => {
            const condition: WhereCondition = {};
            condition[field as string] = { [operator]: value };
            return condition;
        });
        
        this.queryOptions.where = {
            or: orConditions
        };
        return this;
    }

    // Add AND conditions
    andWhere(conditions: Array<{ field: keyof T, operator: 'eq' | 'eq_any' | 'gt' | 'lt' | 'gte' | 'lte', value: any }>): Query<T> {
        const andConditions = conditions.map(({ field, operator, value }) => {
            const condition: WhereCondition = {};
            condition[field as string] = { [operator]: value };
            return condition;
        });
        
        this.queryOptions.where = {
            and: andConditions
        };
        return this;
    }

    // Add sorting
    orderBy(field: keyof T, direction: 'asc' | 'desc' = 'asc'): Query<T> {
        this.queryOptions.sortBy = field as string;
        this.queryOptions.sortDesc = direction === 'desc';
        return this;
    }

    // Add limit
    limit(limit: number): Query<T> {
        this.queryOptions.limit = limit;
        return this;
    }

    // Add offset
    offset(skip: number): Query<T> {
        this.queryOptions.skip = skip;
        return this;
    }
}

// Export the client creator function
export const createClient = (config: QuarksConfig) => new QuarksClient(config);

// Export types
export type {
    QuarksConfig,
    FilterCondition,
    FilterOptions,
    QueryOptions,
    FuzzySearchItem,
    FuzzySearchQuery,
};