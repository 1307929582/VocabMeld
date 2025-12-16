/**
 * VocabMeld API Profile 类型定义
 * 支持多API配置管理
 */

/**
 * Provider类型
 */
export type ProviderId = 'openai' | 'deepseek' | 'moonshot' | 'groq' | 'ollama' | 'custom';

/**
 * API Profile（非敏感，可sync）
 */
export interface ApiProfile {
  id: string;                    // uuid
  name: string;                  // 用户自定义名称
  provider: ProviderId;          // Provider类型

  endpoint: string;              // API端点
  model: string;                 // 模型名称

  apiKeyRef: string | null;      // 指向local存储的key id
  enabled: boolean;              // 是否启用

  priority: number;              // Fallback优先级（越小越优先）
  createdAt: number;             // 创建时间(ms)
  updatedAt: number;             // 更新时间(ms)

  extraHeaders?: Record<string, string>; // 额外header
  timeoutMs?: number;            // 超时时间（默认25000）
}

/**
 * API路由配置
 */
export type RoutingMode = 'manual' | 'fallback';

export interface ApiRoutingConfig {
  mode: RoutingMode;
  selectedProfileId: string | null;  // 手动模式使用
  fallbackOrder: string[];           // Fallback顺序
}

/**
 * API Key记录（敏感，仅local）
 */
export interface ApiKeyRecord {
  id: string;              // uuid
  provider: ProviderId;
  key: string;             // 明文（存local）
  createdAt: number;
  updatedAt: number;
}

/**
 * Profile健康状态
 */
export type HealthStatus = 'ok' | 'degraded' | 'blocked';

export interface ProfileHealth {
  profileId: string;
  status: HealthStatus;
  consecutiveFailures: number;
  lastFailureAt: number | null;
  lastSuccessAt: number | null;
  cooldownUntil: number | null;
  lastErrorCode?: string;
}

/**
 * Provider预设配置
 */
export interface ProviderPreset {
  name: string;
  endpoint: string;
  model: string;
  icon?: string;
}

export const PROVIDER_PRESETS: Record<ProviderId, ProviderPreset> = {
  openai: {
    name: 'OpenAI',
    endpoint: 'https://api.openai.com/v1/chat/completions',
    model: 'gpt-4o-mini'
  },
  deepseek: {
    name: 'DeepSeek',
    endpoint: 'https://api.deepseek.com/chat/completions',
    model: 'deepseek-chat'
  },
  moonshot: {
    name: 'Moonshot',
    endpoint: 'https://api.moonshot.cn/v1/chat/completions',
    model: 'moonshot-v1-8k'
  },
  groq: {
    name: 'Groq',
    endpoint: 'https://api.groq.com/openai/v1/chat/completions',
    model: 'llama-3.1-8b-instant'
  },
  ollama: {
    name: 'Ollama',
    endpoint: 'http://localhost:11434/v1/chat/completions',
    model: 'qwen2.5:7b'
  },
  custom: {
    name: 'Custom',
    endpoint: '',
    model: ''
  }
};
