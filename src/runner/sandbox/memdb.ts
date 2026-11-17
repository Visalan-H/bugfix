import { clone, sleep } from './types';

// Mongoose-like in-memory store. Every call is async with a small delay, so a
// missing `await` or a race condition shows up just like it would for real.
const READ_MS = 1;
const WRITE_MS = 15;

export type Doc = Record<string, unknown> & { _id?: string };
export type Filter = Record<string, unknown>;
export interface Update {
  $inc?: Record<string, number>;
  $set?: Record<string, unknown>;
  $push?: Record<string, unknown>;
}

function matches(doc: Doc, filter: Filter): boolean {
  for (const k in filter) {
    const cond = filter[k];
    if (cond === undefined) continue; // like Mongoose: undefined keys are stripped
    const v = doc[k] as never;
    if (cond && typeof cond === 'object' && !Array.isArray(cond)) {
      const ops = cond as Record<string, unknown>;
      for (const op in ops) {
        const c = ops[op] as never;
        if (op === '$gte' && !(v >= c)) return false;
        if (op === '$gt' && !(v > c)) return false;
        if (op === '$lte' && !(v <= c)) return false;
        if (op === '$lt' && !(v < c)) return false;
        if (op === '$ne' && v === c) return false;
        if (op === '$in' && !(c as unknown[]).includes(v)) return false;
        if (op === '$regex') {
          const re = (c as unknown) instanceof RegExp ? (c as RegExp) : new RegExp(c, (ops.$options as string) || '');
          if (typeof v !== 'string' || !re.test(v)) return false;
        }
      }
    } else if (v !== cond) return false;
  }
  return true;
}

export interface Collection {
  find(filter?: Filter): Promise<Doc[]>;
  findOne(filter?: Filter): Promise<Doc | null>;
  findById(id: unknown): Promise<Doc | null>;
  insert(doc: Doc): Promise<Doc>;
  updateById(id: unknown, patch: Doc): Promise<Doc | null>;
  findOneAndUpdate(filter: Filter, update: Update): Promise<Doc | null>;
  deleteById(id: unknown): Promise<boolean>;
  count(filter?: Filter): Promise<number>;
}

export interface MemDb {
  collection(name: string): Collection;
}

export function createMemDb(): MemDb {
  const cols: Record<string, Collection> = {};
  let idc = 1000;

  function collection(name: string): Collection {
    if (cols[name]) return cols[name];
    const rows: Doc[] = [];
    const api: Collection = {
      async find(filter = {}) {
        await sleep(READ_MS);
        return rows.filter((d) => matches(d, filter)).map(clone);
      },
      async findOne(filter = {}) {
        await sleep(READ_MS);
        const d = rows.find((x) => matches(x, filter));
        return d ? clone(d) : null;
      },
      async findById(id) {
        await sleep(READ_MS);
        const d = rows.find((x) => x._id === String(id));
        return d ? clone(d) : null;
      },
      async insert(doc) {
        await sleep(WRITE_MS);
        const d = Object.assign(clone(doc), { _id: doc._id != null ? String(doc._id) : String(++idc) });
        rows.push(d);
        return clone(d);
      },
      async updateById(id, patch) {
        await sleep(WRITE_MS);
        const d = rows.find((x) => x._id === String(id));
        if (!d) return null;
        Object.assign(d, clone(patch));
        return clone(d);
      },
      async findOneAndUpdate(filter, update) {
        // One step, no await in between: this is the atomic version.
        await sleep(WRITE_MS);
        const d = rows.find((x) => matches(x, filter));
        if (!d) return null;
        if (update.$inc) for (const k in update.$inc) d[k] = ((d[k] as number) || 0) + update.$inc[k];
        if (update.$set) Object.assign(d, clone(update.$set));
        if (update.$push) for (const k in update.$push) ((d[k] = d[k] || []) as unknown[]).push(clone(update.$push[k]));
        return clone(d);
      },
      async deleteById(id) {
        await sleep(WRITE_MS);
        const i = rows.findIndex((x) => x._id === String(id));
        if (i < 0) return false;
        rows.splice(i, 1);
        return true;
      },
      async count(filter = {}) {
        await sleep(READ_MS);
        return rows.filter((d) => matches(d, filter)).length;
      },
    };
    cols[name] = api;
    return api;
  }
  return { collection };
}
