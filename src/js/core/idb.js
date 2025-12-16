/**
 * IndexedDB 词库封装
 */

export class VocabMeldDB {
  static DB_NAME = 'vocabmeld';
  static DB_VERSION = 1;

  constructor(db) {
    this.db = db;
  }

  static async open() {
    const db = await new Promise((resolve, reject) => {
      const req = indexedDB.open(VocabMeldDB.DB_NAME, VocabMeldDB.DB_VERSION);

      req.onupgradeneeded = () => {
        const db = req.result;

        if (!db.objectStoreNames.contains('words')) {
          const store = db.createObjectStore('words', { keyPath: 'id' });
          store.createIndex('byStatus', 'status', { unique: false });
          store.createIndex('byLangPair', 'langPair', { unique: false });
          store.createIndex('byDueAt', 'srsDueAt', { unique: false });
          store.createIndex('byUpdatedAt', 'updatedAt', { unique: false });
          store.createIndex('byOriginal', 'originalLower', { unique: false });
        }

        if (!db.objectStoreNames.contains('meta')) {
          db.createObjectStore('meta', { keyPath: 'key' });
        }
      };

      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });

    return new VocabMeldDB(db);
  }

  close() {
    this.db?.close();
  }

  tx(storeNames, mode, fn) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(storeNames, mode);
      const stores = {};
      for (const name of Array.isArray(storeNames) ? storeNames : [storeNames]) {
        stores[name] = tx.objectStore(name);
      }

      Promise.resolve()
        .then(() => fn(stores, tx))
        .then((result) => {
          tx.oncomplete = () => resolve(result);
          tx.onerror = () => reject(tx.error);
          tx.onabort = () => reject(tx.error);
        })
        .catch(reject);
    });
  }

  static now() {
    return Date.now();
  }
}

export function stableWordId(original, sourceLang, targetLang) {
  const raw = `${(original || '').trim().toLowerCase()}|${sourceLang || ''}|${targetLang || ''}`;
  let h = 0x811c9dc5;
  for (let i = 0; i < raw.length; i++) {
    h ^= raw.charCodeAt(i);
    h = (h * 0x01000193) >>> 0;
  }
  return `w_${h.toString(16)}`;
}

export function langPairKey(sourceLang, targetLang) {
  return `${sourceLang || ''}->${targetLang || ''}`;
}

function req(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export const lexiconDb = {
  _instance: null,
  async get() {
    if (!this._instance) this._instance = await LexiconDB.open();
    return this._instance;
  }
};

// 词汇记录工厂函数
export function makeWordRecord(input) {
  const now = Date.now();
  const original = (input.original || '').trim();
  const sourceLang = input.sourceLang || 'en';
  const targetLang = input.targetLang || 'zh-CN';

  const id = input.id || stableWordId(original, sourceLang, targetLang);
  const status = input.status || 'learning';

  const srs = input.srs || {};
  const srsDueAt = typeof input.srsDueAt === 'number'
    ? input.srsDueAt
    : typeof srs.dueAt === 'number'
      ? srs.dueAt
      : now;

  const stats = input.stats || {};

  return {
    id,
    original,
    originalLower: original.toLowerCase(),
    translation: input.translation || '',
    phonetic: input.phonetic || '',
    difficulty: input.difficulty || 'B1',
    sourceLang,
    targetLang,
    langPair: langPairKey(sourceLang, targetLang),
    status,
    createdAt: input.createdAt || now,
    updatedAt: input.updatedAt || now,
    srsDueAt,
    srs: {
      dueAt: srsDueAt,
      intervalDays: typeof srs.intervalDays === 'number' ? srs.intervalDays : 0,
      ease: typeof srs.ease === 'number' ? srs.ease : 2.5,
      reps: typeof srs.reps === 'number' ? srs.reps : 0,
      lapses: typeof srs.lapses === 'number' ? srs.lapses : 0,
      lastReviewedAt: typeof srs.lastReviewedAt === 'number' ? srs.lastReviewedAt : null
    },
    stats: {
      seenCount: typeof stats.seenCount === 'number' ? stats.seenCount : 0,
      replaceCount: typeof stats.replaceCount === 'number' ? stats.replaceCount : 0,
      lastSeenAt: typeof stats.lastSeenAt === 'number' ? stats.lastSeenAt : null
    }
  };
}

// LexiconDB类（词库操作）
export class LexiconDB {
  constructor(db) {
    this.db = db;
  }

  static async open() {
    const db = await VocabMeldDB.open();
    return new LexiconDB(db);
  }

  async getMeta(key) {
    return this.db.tx('meta', 'readonly', async ({ meta }) => {
      return await req(meta.get(key));
    });
  }

  async setMeta(key, value) {
    return this.db.tx('meta', 'readwrite', async ({ meta }) => {
      await req(meta.put({ key, value }));
    });
  }

  async upsertWord(word) {
    const record = makeWordRecord(word);
    record.updatedAt = Date.now();
    record.srsDueAt = record.srs.dueAt;

    return this.db.tx('words', 'readwrite', async ({ words }) => {
      await req(words.put(record));
      return record;
    });
  }

  async upsertMany(wordsArr) {
    const now = Date.now();
    const records = wordsArr.map(w => {
      const r = makeWordRecord(w);
      r.updatedAt = now;
      r.srsDueAt = r.srs.dueAt;
      return r;
    });

    return this.db.tx('words', 'readwrite', async ({ words }) => {
      for (const r of records) await req(words.put(r));
      return records.length;
    });
  }

  async getWord(id) {
    return this.db.tx('words', 'readonly', async ({ words }) => {
      return await req(words.get(id));
    });
  }

  async deleteWord(id) {
    return this.db.tx('words', 'readwrite', async ({ words }) => {
      await req(words.delete(id));
    });
  }

  async listDue({ now = Date.now(), limit = 50, langPair = null, statuses = ['learning', 'review'] } = {}) {
    return this.db.tx('words', 'readonly', async ({ words }) => {
      const idx = words.index('byDueAt');
      const range = IDBKeyRange.upperBound(now);
      const out = [];

      let cursor = await req(idx.openCursor(range));
      while (cursor && out.length < limit) {
        const v = cursor.value;
        if (statuses.includes(v.status) && (!langPair || v.langPair === langPair)) {
          out.push(v);
        }
        cursor = await req(cursor.continue());
      }

      out.sort((a, b) => (a.srsDueAt || 0) - (b.srsDueAt || 0));
      return out;
    });
  }

  async countByStatus(status) {
    return this.db.tx('words', 'readonly', async ({ words }) => {
      const idx = words.index('byStatus');
      return await req(idx.count(status));
    });
  }
}
