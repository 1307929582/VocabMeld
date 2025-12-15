# Phase 1.3 模块补齐计划

**目标**: 补齐services/模块，确保Phase 2能够顺利迁移content.js

**预计工时**: 1-2小时

---

## 1. 新增模块清单

### 1.1 `services/ui-overlay.js`

**职责**: DOM Overlay组件管理（tooltip/toast/selectionPopup）

**接口设计**：

```javascript
class UIOverlay {
  // Tooltip管理
  createTooltip(): HTMLElement
  showTooltip(element: HTMLElement, data: {translation, original, phonetic, difficulty}): void
  hideTooltip(): void

  // Toast提示
  showToast(message: string, duration: number = 2000): void

  // Selection Popup
  createSelectionPopup(): HTMLElement
  showSelectionPopup(x: number, y: number, word: string): void
  hideSelectionPopup(): void

  // 清理
  destroy(): void
}

export const uiOverlay = new UIOverlay();
export default uiOverlay;
```

**数据契约**：
- Tooltip内容：翻译、原文、音标（可选）、难度徽章、提示文字
- Tooltip定位：元素下方5px
- Toast定位：右下角固定，2秒后消失

---

### 1.2 `services/background-bridge.js`

**职责**: 封装与background的消息通信

**接口设计**：

```javascript
class BackgroundBridge {
  // 语音播报
  async speak(text: string): Promise<void>

  // 获取统计
  async getStats(): Promise<StatsData>

  // 获取缓存统计
  async getCacheStats(): Promise<{size: number, maxSize: number}>

  // 清空缓存
  async clearCache(): Promise<void>

  // 内部：统一消息发送
  private async send Message(action: string, payload?: any): Promise<any>
}

export const backgroundBridge = new BackgroundBridge();
export default backgroundBridge;
```

**消息协议**：遵循CONTRACTS.md中的`action`协议

---

### 1.3 `core/text-utils.js` (可选，建议Phase 2再做)

**职责**: 文本处理工具函数

```javascript
export function detectLanguage(text: string): 'zh-CN'|'en'|'ja'|'ko'
export function isCodeText(text: string): boolean
export function reconstructTextWithWords(text: string, targetWords: string[]): string
export function debounce(func: Function, wait: number): Function
export function generateFingerprint(text: string, path: string): string
```

---

## 2. 现有模块增强

### 2.1 `services/processing-service.js`

**需要新增**：

```javascript
class ProcessingService {
  // 现有方法保持...

  // 新增：处理特定词汇列表
  async processSpecificWords(words: string[]): Promise<number>

  // 新增：恢复页面到原始状态
  restorePage(): void
}
```

### 2.2 `services/text-replacer.js`

**需要增强**：

```javascript
class TextReplacer {
  // 现有方法保持...

  // 修改：支持translationStyle
  createWrapperElement(original, translation, phonetic, difficulty, style): HTMLElement

  // 安全增强：去除innerHTML，使用DOM API
  // (根据codex之前的patch建议)
}
```

---

## 3. 实施优先级

### P0 (必须完成，Phase 2依赖)
- [ ] 增强`processing-service`: 添加`processSpecificWords()`和`restorePage()`
- [ ] 增强`text-replacer`: 支持`translationStyle`并去除`innerHTML`
- [ ] 新增`services/background-bridge.js`

### P1 (强烈建议，影响体验)
- [ ] 新增`services/ui-overlay.js`

### P2 (可选，Phase 2时再决定)
- [ ] 新增`core/text-utils.js`统一工具函数

---

## 4. 实施策略

**选择：范围收敛的选项A**

### 阶段1：增强现有模块（30分钟）
1. processing-service添加两个方法（接口先行，实现可简化）
2. text-replacer去除innerHTML并支持translationStyle

### 阶段2：新增UI模块（30-60分钟）
3. 创建background-bridge.js
4. 创建ui-overlay.js

### 阶段3：验证（15分钟）
5. 确保所有模块正确导出
6. 简单的import测试（不运行，只验证语法）

---

## 5. 功能对照表（Phase 2迁移时检查）

| Content.js功能 | 对应模块/方法 | 状态 |
|----------------|---------------|------|
| `processPage()` | `processingService.processPage()` | ✅ 已有 |
| `processSpecificWords()` | `processingService.processSpecificWords()` | ⏳ P0待加 |
| `restoreAll()` | `processingService.restorePage()` | ⏳ P0待加 |
| `translateText()` | `apiService.translate()` | ✅ 已有 |
| `applyReplacements()` | `textReplacer.replace()` | ✅ 已有 |
| `createReplacementElement()` | `textReplacer.createWrapper()` | ⏳ P0需增强 |
| `createTooltip()` | `uiOverlay.createTooltip()` | ⏳ P1待加 |
| `showTooltip()` | `uiOverlay.showTooltip()` | ⏳ P1待加 |
| `showToast()` | `uiOverlay.showToast()` | ⏳ P1待加 |
| `createSelectionPopup()` | `uiOverlay.createSelectionPopup()` | ⏳ P1待加 |
| `chrome.runtime.sendMessage` | `backgroundBridge.*()` | ⏳ P0待加 |
| `setupEventListeners()` | 保留在content.js入口 | - |
| `init()` | 保留在content.js入口（重写） | - |

---

## 6. 下一步行动

**立即执行**：开始补齐P0模块

**分工建议**：
- **我（codex）**：增强processing-service和text-replacer（后端核心）
- **gemini**：创建ui-overlay.js（前端UI组件）
- **你（Claude）**：创建background-bridge.js并协调

**输出形式**：仍然是"unified diff patch"（不实际改代码），你基于此重写为高质量实现。

准备好了请回复，我立即开始给 processing-service / text-replacer 的增强方案（patch 形式）。
