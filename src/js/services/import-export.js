/**
 * 导入/导出服务
 */

import { makeWordRecord } from '../core/idb.js';

/**
 * 导出为JSON
 */
export function exportLexiconJson(words) {
  return JSON.stringify({
    version: 1,
    exportedAt: Date.now(),
    words: words.map(w => sanitizeWordForExport(w))
  }, null, 2);
}

/**
 * 导出为CSV
 */
export function exportLexiconCsv(words) {
  const cols = ['id', 'original', 'translation', 'phonetic', 'difficulty', 'sourceLang', 'targetLang', 'status'];
  const lines = [cols.join(',')];

  for (const w of words) {
    const row = [
      w.id, w.original, w.translation, w.phonetic, w.difficulty,
      w.sourceLang, w.targetLang, w.status
    ].map(csvCell);
    lines.push(row.join(','));
  }

  return lines.join('\n');
}

/**
 * 解析导入的JSON
 */
export function parseImportJson(jsonText) {
  const raw = JSON.parse(jsonText);
  if (!raw || !Array.isArray(raw.words)) {
    throw new Error('Invalid JSON format');
  }

  const errors = [];
  const records = [];

  for (let i = 0; i < raw.words.length; i++) {
    try {
      records.push(validateAndNormalizeWord(raw.words[i]));
    } catch (e) {
      errors.push({ index: i, error: e.message });
    }
  }

  return { records, errors };
}

/**
 * 验证和规范化词汇记录
 */
function validateAndNormalizeWord(input) {
  const original = String(input.original || '').trim();
  const sourceLang = String(input.sourceLang || '').trim();
  const targetLang = String(input.targetLang || '').trim();

  if (!original) throw new Error('original is required');
  if (!sourceLang) throw new Error('sourceLang is required');
  if (!targetLang) throw new Error('targetLang is required');
  if (original.length > 100) throw new Error('original too long');

  return makeWordRecord({
    ...input,
    original,
    sourceLang,
    targetLang
  });
}

/**
 * 清理敏感字段
 */
function sanitizeWordForExport(w) {
  return {
    id: w.id,
    original: w.original,
    translation: w.translation,
    phonetic: w.phonetic,
    difficulty: w.difficulty,
    sourceLang: w.sourceLang,
    targetLang: w.targetLang,
    status: w.status,
    createdAt: w.createdAt,
    updatedAt: w.updatedAt
  };
}

/**
 * CSV单元格转义
 */
function csvCell(v) {
  const s = v === null || v === undefined ? '' : String(v);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}
