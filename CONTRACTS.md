# VocabMeld 接口协议文档

> 本文档定义了重构过程中必须遵守的接口契约，任何修改都需要经过review批准

**版本**: 1.0
**创建日期**: 2025-12-16
**Reviewers**: gemini (前端), codex (后端+reviewer), Claude (后端)

---

## 1. 消息通信协议

### 1.1 Content Script 接收的消息

Content script通过`chrome.runtime.onMessage`接收以下消息：

```javascript
// 处理当前页面
{ action: 'processPage' }

// 恢复页面到原始状态
{ action: 'restorePage' }

// 处理特定单词列表
{ action: 'processSpecificWords', words: string[] }

// 获取当前状态
{ action: 'getStatus' }
```

### 1.2 Background Script 接收的消息

Background script通过`chrome.runtime.onMessage`接收以下消息：

```javascript
// 测试API配置
{ action: 'testApi', payload: { apiEndpoint, apiKey, modelName } }

// 语音播报
{ action: 'speak', text: string }

// 获取统计信息
{ action: 'getStats' }

// 获取缓存统计
{ action: 'getCacheStats' }

// 清空缓存
{ action: 'clearCache' }

// 清空已学会词汇
{ action: 'clearLearnedWords' }

// 清空记忆列表
{ action: 'clearMemorizeList' }
```

### 1.3 消息响应格式

所有background消息处理函数必须返回以下格式：

```javascript
{
  success: boolean,
  data?: any,      // 成功时的数据
  error?: string   // 失败时的错误信息
}
```

---

## 2. Storage API 协议

### 2.1 存储层抽象（`core/storage.js`）

所有模块**必须**通过`storage`服务访问chrome.storage，**禁止**直接调用`chrome.storage.*`。

#### 核心API

```javascript
// 获取完整配置（合并sync + local）
await storage.getConfig(): Promise<Config>

// 设置配置（自动路由到sync/local）
await storage.set(items: object): Promise<void>

// 获取特定键（sync）
await storage.get(keys: string[] | null): Promise<object>

// Local存储操作
await storage.getLocal(keys: string[]): Promise<object>
await storage.setLocal(items: object): Promise<void>

// 监听存储变化
storage.addChangeListener(callback: (changes, area) => void)
```

### 2.2 存储位置映射

**Chrome Storage Sync** (同步，5MB限制):
- `apiEndpoint`, `modelName`
- `nativeLanguage`, `targetLanguage`
- `difficultyLevel`, `intensity`
- `autoProcess`, `showPhonetic`, `translationStyle`
- `enabled`
- `blacklist`, `whitelist`
- `learnedWords`, `memorizeList`
- `totalWords`, `todayWords`, `lastResetDate`
- `cacheHits`, `cacheMisses`

**Chrome Storage Local** (本地，无限制):
- `apiKey` - **不同步**（安全考虑）
- `vocabmeld_word_cache` - 2000词LRU缓存

---

## 3. 数据Schema

### 3.1 Config对象

```javascript
{
  // API配置
  apiEndpoint: string,
  apiKey: string,  // 从local读取
  modelName: string,

  // 语言配置
  nativeLanguage: 'zh-CN' | 'zh-TW' | 'en' | 'ja' | 'ko',
  targetLanguage: 'en' | 'zh-CN' | 'zh-TW' | 'ja' | 'ko' | 'fr' | 'de' | 'es',

  // 学习配置
  difficultyLevel: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2',
  intensity: 'low' | 'medium' | 'high',

  // 行为配置
  autoProcess: boolean,
  showPhonetic: boolean,
  translationStyle: 'translation-original' | 'translation-only' | 'original-translation',
  enabled: boolean,

  // 站点规则
  blacklist: string[],
  whitelist: string[],

  // 词汇列表
  learnedWords: WordItem[],
  memorizeList: WordItem[]
}
```

### 3.2 WordItem对象

```javascript
{
  original: string,    // 原文（英文或中文）
  word?: string,       // 翻译（可选，用于learnedWords）
  difficulty?: string, // CEFR难度（可选）
  addedAt: number,     // Unix timestamp
  phonetic?: string    // 音标（可选，缓存中使用）
}
```

### 3.3 Cache对象（vocabmeld_word_cache）

```javascript
[
  {
    key: string,        // 格式: "原文:源语言:目标语言"
    translation: string,
    phonetic: string,
    difficulty: string  // CEFR等级
  },
  // ...最多2000项
]
```

---

## 4. 模块导出规范

所有模块必须使用ES Module格式：

```javascript
// ✅ 正确：命名导出 + 默认导出
export const storage = new StorageService();
export default storage;

// ✅ 正确：多个命名导出
export const CEFR_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
export const DEFAULT_CONFIG = { /* ... */ };

// ❌ 错误：混用CommonJS
module.exports = { ... };  // 禁止！
```

---

## 5. 重构期间的约束

### 5.1 禁止行为
- ❌ 绕过`storage`服务直接调用`chrome.storage.*`
- ❌ 修改消息协议的`action`字段名称
- ❌ 修改存储schema的键名称
- ❌ 在services/中引用DOM API（background会加载）

### 5.2 必须行为
- ✅ 所有配置读写通过`storage.getConfig()`/`storage.set()`
- ✅ 所有消息使用`action`字段（不是`type`）
- ✅ 新增协议必须更新本文档
- ✅ 每个phase完成后更新文档版本

---

## 6. 版本历史

| 版本 | 日期 | 修改内容 | Reviewer |
|------|------|----------|----------|
| 1.0 | 2025-12-16 | 初始版本，冻结基线协议 | codex ✅ |

---

## 附录A：常量定义位置

- CEFR等级: `core/config.js::CEFR_LEVELS`
- 强度配置: `core/config.js::INTENSITY_CONFIG`
- 跳过标签: `core/config.js::SKIP_TAGS`
- API预设: `core/config.js::API_PRESETS`
- 默认配置: `core/config.js::DEFAULT_CONFIG`
