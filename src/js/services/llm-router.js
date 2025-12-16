/**
 * VocabMeld LLM Router
 * 统一管理多API配置的路由和fallback
 */

import { storage } from '../core/storage.js';

/**
 * LLM错误类型
 */
export class LlmError extends Error {
  constructor(type, message, httpStatus = null) {
    super(message);
    this.type = type; // 'AUTH' | 'RATE_LIMIT' | 'TIMEOUT' | 'NETWORK' | 'SERVER' | 'BAD_RESPONSE'
    this.httpStatus = httpStatus;
    this.retriable = ['RATE_LIMIT', 'TIMEOUT', 'NETWORK', 'SERVER'].includes(type);
  }
}

/**
 * LLM Router类
 * 负责API路由、fallback和健康管理
 */
class LlmRouter {
  constructor() {
    this.inflightRequests = new Map(); // 请求去重
    this.rateLimiters = new Map();     // Rate limit追踪
  }

  /**
   * 解析路由决策
   * @returns {Promise<{mode, candidates}>}
   */
  async route() {
    const [routing, profiles] = await Promise.all([
      storage.getApiRouting(),
      storage.getApiProfiles()
    ]);

    const enabledProfiles = profiles.filter(p => p.enabled);

    if (routing.mode === 'manual') {
      const selected = enabledProfiles.find(p => p.id === routing.selectedProfileId);
      return {
        mode: 'manual',
        candidates: selected ? [selected] : []
      };
    }

    // fallback模式：按priority排序
    const ordered = [...enabledProfiles].sort((a, b) => a.priority - b.priority);

    // 过滤掉blocked和cooldown中的profile
    const now = Date.now();
    const available = [];

    for (const profile of ordered) {
      const health = await storage.getProfileHealth(profile.id);

      if (!health) {
        available.push(profile);
        continue;
      }

      // blocked状态跳过
      if (health.status === 'blocked') continue;

      // cooldown未过期跳过
      if (health.cooldownUntil && health.cooldownUntil > now) continue;

      available.push(profile);
    }

    return {
      mode: 'fallback',
      candidates: available
    };
  }

  /**
   * 执行翻译请求（带fallback）
   * @param {object} request - 翻译请求
   * @returns {Promise<object>}
   */
  async translate(request) {
    const { candidates } = await this.route();

    if (candidates.length === 0) {
      throw new LlmError('AUTH', 'No available API profiles configured');
    }

    let lastError = null;
    let usedFallback = false;

    for (let i = 0; i < candidates.length; i++) {
      const profile = candidates[i];

      try {
        const startTime = Date.now();
        const result = await this.translateWithProfile(profile, request);
        const latencyMs = Date.now() - startTime;

        // 成功：更新健康状态
        await this.recordSuccess(profile.id);

        return {
          ...result,
          profileId: profile.id,
          profileName: profile.name,
          latencyMs,
          usedFallback: i > 0
        };
      } catch (error) {
        console.error(`[LlmRouter] Profile "${profile.name}" failed:`, error);
        lastError = error;
        usedFallback = true;

        // 记录失败
        await this.recordFailure(profile.id, error);

        // 如果是AUTH错误，不要继续fallback其他profile
        if (error.type === 'AUTH') {
          // 但继续尝试下一个profile（可能其他profile的key是好的）
          continue;
        }

        // 如果不可重试，或已是最后一个，抛出错误
        if (!error.retriable || i === candidates.length - 1) {
          break;
        }

        // 可重试错误，继续下一个profile
        console.log(`[LlmRouter] Falling back to next profile...`);
      }
    }

    // 所有profile都失败
    throw lastError || new LlmError('UNKNOWN', 'All API profiles failed');
  }

  /**
   * 使用特定profile翻译
   * @param {object} profile
   * @param {object} request
   * @returns {Promise<object>}
   */
  async translateWithProfile(profile, request) {
    // 获取API Key
    const apiKey = await storage.getApiKey(profile.apiKeyRef);
    if (!apiKey) {
      throw new LlmError('AUTH', `API Key not found for profile "${profile.name}"`);
    }

    // 构建请求
    const { text, nativeLanguage, targetLanguage, difficultyLevel, intensity } = request;

    // 检测语言方向
    const sourceLang = this.detectLanguage(text);
    const isNativeToTarget = sourceLang === nativeLanguage;
    const translationDirection = isNativeToTarget ? targetLanguage : nativeLanguage;

    // 构建prompt
    const prompt = this.buildPrompt(text, sourceLang, translationDirection, difficultyLevel, intensity);

    // 发送请求（带超时）
    const timeoutMs = profile.timeoutMs || 25000;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(profile.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          ...profile.extraHeaders
        },
        body: JSON.stringify({
          model: profile.model,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.3,
          max_tokens: 2000
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      // 处理HTTP错误
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          throw new LlmError('AUTH', `Authentication failed: ${response.status}`, response.status);
        }
        if (response.status === 429) {
          throw new LlmError('RATE_LIMIT', 'Rate limit exceeded', response.status);
        }
        if (response.status >= 500) {
          throw new LlmError('SERVER', `Server error: ${response.status}`, response.status);
        }
        throw new LlmError('NETWORK', `HTTP ${response.status}`, response.status);
      }

      // 解析响应
      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;

      if (!content) {
        throw new LlmError('BAD_RESPONSE', 'Invalid response format');
      }

      // 解析翻译结果
      const replacements = this.parseTranslations(content, difficultyLevel);

      return {
        replacements,
        provider: profile.provider
      };
    } catch (error) {
      clearTimeout(timeoutId);

      if (error.name === 'AbortError') {
        throw new LlmError('TIMEOUT', 'Request timeout');
      }
      if (error instanceof LlmError) {
        throw error;
      }
      throw new LlmError('NETWORK', error.message);
    }
  }

  /**
   * 检测文本语言
   */
  detectLanguage(text) {
    const chineseCount = (text.match(/[\u4e00-\u9fff]/g) || []).length;
    const latinCount = (text.match(/[a-zA-Z]/g) || []).length;
    const total = chineseCount + latinCount || 1;

    return chineseCount / total > 0.3 ? 'zh-CN' : 'en';
  }

  /**
   * 构建翻译prompt
   */
  buildPrompt(text, sourceLang, targetLang, difficulty, intensity) {
    const intensityMap = { low: 4, medium: 8, high: 14 };
    const maxWords = intensityMap[intensity] || 8;

    return `你是语言学习助手。分析文本并选择${maxWords}个适合学习的词汇翻译。

规则：
1. 选择约${maxWords}个词汇
2. 避免替换：专有名词、数字、代码、URL、小于5字符的英文
3. 难度等级：${difficulty}及以上（CEFR: A1<A2<B1<B2<C1<C2）
4. 返回JSON数组格式

文本：
${text.slice(0, 2000)}

返回格式：
[{"word":"原词","translation":"译文","phonetic":"音标","difficulty":"B2"}]`;
  }

  /**
   * 解析翻译结果
   */
  parseTranslations(content, minDifficulty) {
    try {
      // 尝试提取JSON
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (!jsonMatch) return [];

      const data = JSON.parse(jsonMatch[0]);
      if (!Array.isArray(data)) return [];

      const cefr = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
      const minIdx = cefr.indexOf(minDifficulty);

      return data
        .filter(item => item.word && item.translation)
        .filter(item => {
          if (!item.difficulty) return true;
          const idx = cefr.indexOf(item.difficulty);
          return idx >= minIdx;
        })
        .map(item => ({
          original: item.word,
          translation: item.translation,
          phonetic: item.phonetic || '',
          difficulty: item.difficulty || minDifficulty
        }));
    } catch (error) {
      console.error('[LlmRouter] Parse error:', error);
      return [];
    }
  }

  /**
   * 记录成功
   */
  async recordSuccess(profileId) {
    await storage.updateProfileHealth(profileId, {
      status: 'ok',
      consecutiveFailures: 0,
      lastSuccessAt: Date.now(),
      cooldownUntil: null
    });
  }

  /**
   * 记录失败
   */
  async recordFailure(profileId, error) {
    const health = await storage.getProfileHealth(profileId) || {
      consecutiveFailures: 0
    };

    const failures = health.consecutiveFailures + 1;
    const cooldown = Math.min(Math.pow(2, failures) * 5000, 300000); // max 5min

    await storage.updateProfileHealth(profileId, {
      status: error.type === 'AUTH' ? 'blocked' : 'degraded',
      consecutiveFailures: failures,
      lastFailureAt: Date.now(),
      cooldownUntil: Date.now() + cooldown,
      lastErrorCode: error.type
    });
  }

  /**
   * 测试Profile连接
   * @param {string} profileId
   * @returns {Promise<{success, message}>}
   */
  async testProfile(profileId) {
    const profiles = await storage.getApiProfiles();
    const profile = profiles.find(p => p.id === profileId);

    if (!profile) {
      return { success: false, message: 'Profile not found' };
    }

    const apiKey = await storage.getApiKey(profile.apiKeyRef);
    if (!apiKey) {
      return { success: false, message: 'API Key not configured' };
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(profile.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: profile.model,
          messages: [{ role: 'user', content: 'Say OK' }],
          max_tokens: 10
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        return { success: false, message: `HTTP ${response.status}` };
      }

      return { success: true, message: 'Connection successful' };
    } catch (error) {
      if (error.name === 'AbortError') {
        return { success: false, message: 'Timeout' };
      }
      return { success: false, message: error.message };
    }
  }
}

export const llmRouter = new LlmRouter();
export default llmRouter;
