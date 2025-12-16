/**
 * SRS复习系统（SM-2算法）
 */

const DAY_MS = 24 * 60 * 60 * 1000;

export const WORD_STATUS = {
  NEW: 'new',
  LEARNING: 'learning',
  REVIEW: 'review',
  MASTERED: 'mastered',
  IGNORED: 'ignored'
};

/**
 * SM-2算法更新SRS状态
 * @param {object} prevSrs - 之前的SRS状态
 * @param {number} grade - 评分(0-5)
 * @param {number} now - 当前时间戳
 * @returns {object} 新的SRS状态
 */
export function sm2Update(prevSrs, grade, now = Date.now()) {
  const g = Math.max(0, Math.min(5, Number(grade)));

  const srs = {
    dueAt: prevSrs?.dueAt ?? now,
    intervalDays: prevSrs?.intervalDays ?? 0,
    ease: prevSrs?.ease ?? 2.5,
    reps: prevSrs?.reps ?? 0,
    lapses: prevSrs?.lapses ?? 0,
    lastReviewedAt: prevSrs?.lastReviewedAt ?? null
  };

  // 更新ease factor
  const ef = srs.ease + (0.1 - (5 - g) * (0.08 + (5 - g) * 0.02));
  srs.ease = Math.max(1.3, Math.min(2.7, ef));

  if (g < 3) {
    // 失败
    srs.lapses += 1;
    srs.reps = 0;
    srs.intervalDays = 1;
    srs.dueAt = now + 1 * DAY_MS;
    srs.lastReviewedAt = now;
    return srs;
  }

  // 成功
  if (srs.reps === 0) srs.intervalDays = 1;
  else if (srs.reps === 1) srs.intervalDays = 6;
  else srs.intervalDays = Math.round(srs.intervalDays * srs.ease);

  srs.reps += 1;
  srs.dueAt = now + srs.intervalDays * DAY_MS;
  srs.lastReviewedAt = now;
  return srs;
}

/**
 * 根据复习结果确定新状态
 */
export function statusAfterReview(word, grade) {
  const g = Math.max(0, Math.min(5, Number(grade)));
  if (g < 3) return WORD_STATUS.LEARNING;

  const reps = (word?.srs?.reps ?? 0) + 1;
  if (reps >= 8) return WORD_STATUS.MASTERED;
  if (reps >= 2) return WORD_STATUS.REVIEW;
  return WORD_STATUS.LEARNING;
}

/**
 * SRS服务类
 */
export class SrsService {
  constructor(lexiconDbInstance) {
    this.db = lexiconDbInstance;
  }

  /**
   * 获取待复习队列
   */
  async getDueQueue({ limit = 30, langPair = null, now = Date.now() } = {}) {
    return this.db.listDue({ now, limit, langPair });
  }

  /**
   * 提交复习结果
   */
  async submitReview({ wordId, grade, now = Date.now() }) {
    const word = await this.db.getWord(wordId);
    if (!word) throw new Error('Word not found');

    const newSrs = sm2Update(word.srs, grade, now);
    const newStatus = statusAfterReview(word, grade);

    const updated = {
      ...word,
      status: newStatus,
      updatedAt: now,
      srs: newSrs,
      srsDueAt: newSrs.dueAt
    };

    await this.db.upsertWord(updated);
    return updated;
  }

  /**
   * 批量提交复习
   */
  async submitMany(reviews, now = Date.now()) {
    const out = [];
    for (const r of reviews) {
      out.push(await this.submitReview({ wordId: r.wordId, grade: r.grade, now }));
    }
    return out;
  }
}
