// Type stubs for the editor, so autocomplete works for the sandbox's packages
// and Jest globals. They describe src/runner/sandbox; keep them in step with it.

export const MEMDB_D_TS = `declare module 'memdb' {
  type Doc = { _id: string; [key: string]: any };
  type Filter = { [key: string]: any };
  interface Update {
    $inc?: { [key: string]: number };
    $set?: { [key: string]: any };
    $push?: { [key: string]: any };
  }
  interface Collection {
    /** All matching documents (copies). */
    find(filter?: Filter): Promise<Doc[]>;
    /** First matching document, or null. */
    findOne(filter?: Filter): Promise<Doc | null>;
    findById(id: any): Promise<Doc | null>;
    /** Saves a copy and gives it an _id. */
    insert(doc: object): Promise<Doc>;
    updateById(id: any, patch: object): Promise<Doc | null>;
    /** Finds and changes a document in one step ($inc, $set, $push). */
    findOneAndUpdate(filter: Filter, update: Update): Promise<Doc | null>;
    deleteById(id: any): Promise<boolean>;
    count(filter?: Filter): Promise<number>;
  }
  const db: { collection(name: string): Collection };
  export = db;
}
`;

export const EXPRESS_D_TS = `declare module 'express' {
  interface Request {
    method: string;
    path: string;
    url: string;
    originalUrl: string;
    query: { [key: string]: string };
    headers: { [key: string]: string };
    params: { [key: string]: string };
    body: any;
    get(header: string): string | undefined;
    header(header: string): string | undefined;
    [key: string]: any;
  }
  interface Response {
    statusCode: number;
    headersSent: boolean;
    status(code: number): Response;
    set(header: string, value: string): Response;
    json(body?: any): Response;
    send(body?: any): Response;
    redirect(url: string): Response;
    redirect(status: number, url: string): Response;
    sendStatus(code: number): Response;
    end(): Response;
    [key: string]: any;
  }
  type NextFunction = (err?: any) => void;
  type Handler = (req: Request, res: Response, next: NextFunction) => any;
  type ErrorHandler = (err: any, req: Request, res: Response, next: NextFunction) => any;
  interface Router {
    (req: Request, res: Response, next: NextFunction): any;
    use(path: string, ...handlers: Array<Handler | ErrorHandler | Router>): Router;
    use(...handlers: Array<Handler | ErrorHandler | Router>): Router;
    get(path: string, ...handlers: Handler[]): Router;
    post(path: string, ...handlers: Handler[]): Router;
    put(path: string, ...handlers: Handler[]): Router;
    patch(path: string, ...handlers: Handler[]): Router;
    delete(path: string, ...handlers: Handler[]): Router;
  }
  interface Express {
    (): Router;
    Router(): Router;
    json(): Handler;
  }
  const express: Express;
  export = express;
}
`;

export const SUPERTEST_D_TS = `declare module 'supertest' {
  interface Response {
    status: number;
    body: any;
    headers: { [key: string]: string };
  }
  interface Test extends PromiseLike<Response> {
    set(header: string, value: any): Test;
    send(body: any): Test;
  }
  interface Agent {
    get(url: string): Test;
    post(url: string): Test;
    put(url: string): Test;
    patch(url: string): Test;
    delete(url: string): Test;
  }
  function request(app: any): Agent;
  export = request;
}
`;

export const JEST_D_TS = `interface Matchers {
  toBe(expected: any): void;
  toEqual(expected: any): void;
  toMatchObject(expected: any): void;
  toHaveLength(length: number): void;
  toContain(item: any): void;
  toBeGreaterThan(n: number): void;
  toBeGreaterThanOrEqual(n: number): void;
  toBeLessThan(n: number): void;
  toBeLessThanOrEqual(n: number): void;
  toBeCloseTo(n: number, digits?: number): void;
  toBeTruthy(): void;
  toBeFalsy(): void;
  toBeNull(): void;
  toBeUndefined(): void;
  toBeDefined(): void;
}
declare function describe(name: string, fn: () => void): void;
declare function test(name: string, fn: () => any): void;
declare function it(name: string, fn: () => any): void;
declare function beforeEach(fn: () => any): void;
declare function expect(actual: any): Matchers & { not: Matchers };
`;
