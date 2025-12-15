# VocabMeld Content Script 功能清单

> 从旧content.js (1502行) 提取的完整功能列表，用于重构时对照检查

**版本**: 1.0
**创建日期**: 2025-12-16
**源文件**: `src/js/content.js`
**状态**: ✅ 已冻结（Phase 0完成）

---

## 功能分类概览

| 分类 | 函数数量 | 复杂度 | 优先级 |
|------|---------|--------|--------|
| 1. 配置与存储 | 7 | 中 | 🔴 Critical |
| 2. 文本处理与分段 | 8 | 高 | 🔴 Critical |
| 3. 翻译与API | 3 | 高 | 🔴 Critical |
| 4. DOM操作与替换 | 4 | 高 | 🔴 Critical |
| 5. UI交互 | 6 | 中 | 🔴 Critical |
| 6. 事件监听与自动处理 | 3 | 中 | 🟡 Important |
| **总计** | **31** | - | - |

---

## 1. 配置与存储管理（7个函数）

### 1.1 `loadConfig()` 🔴
**功能**: 从chrome.storage.sync加载完整配置
**返回**: `Promise<Config>`
**依赖**: `chrome.storage.sync`
**重构目标**: 使用`storage.getConfig()`

### 1.2 `loadWordCache()` 🔴
**功能**: 从chrome.storage.local加载2000词LRU缓存
**数据**: `vocabmeld_word_cache`
**依赖**: `chrome.storage.local`
**重构目标**: 使用`cacheService.load()`

### 1.3 `saveWordCache()` 🔴
**功能**: 将Map序列化为数组并保存到local
**触发**: 每次新词缓存后
**依赖**: `chrome.storage.local`
**重构目标**: 使用`cacheService.persist()`

### 1.4 `updateStats(stats)` 🔴
**功能**: 更新统计数据（totalWords, todayWords, cacheHits, cacheMisses）
**逻辑**: 自动检测日期重置todayWords
**依赖**: `chrome.storage.sync`
**重构目标**: 使用`storage.set()`并可能需要节流

### 1.5 `addToWhitelist(original, translation, difficulty)` 🔴
**功能**: 将词汇添加到"已学会"列表
**数据结构**: `{ original, word, addedAt, difficulty }`
**依赖**: `chrome.storage.sync`
**重构目标**: 使用`storage.set({ learnedWords: [...] })`

### 1.6 `addToMemorizeList(word)` 🔴
**功能**: 将词汇添加到"需记忆"列表
**特殊逻辑**:
- 添加后立即触发翻译（`processSpecificWords`或`translateSpecificWords`）
- 显示toast提示
**依赖**: `chrome.storage.sync`
**重构目标**: 使用`storage.set({ memorizeList: [...] })` + 触发处理

### 1.7 `init()` 🔴
**功能**: 初始化content script
**执行流程**:
1. 加载配置
2. 加载缓存
3. 创建UI元素（tooltip, selectionPopup）
4. 绑定事件监听
5. 注册消息处理
6. 监听存储变化
7. 执行自动处理（如果enabled+autoProcess）

---

## 2. 文本处理与分段（8个函数）

### 2.1 `isDifficultyCompatible(wordDifficulty, userDifficulty)` 🔴
**功能**: 判断词汇难度是否符合用户设置
**逻辑**: wordIdx >= userIdx（只显示大于等于用户难度的词）
**重构目标**: 使用`core/config.js::isDifficultyCompatible`

### 2.2 `generateFingerprint(text, path)` 🟡
**功能**: 生成内容指纹，防止重复处理
**算法**: 取前100字符+path的hash
**用途**: `processedFingerprints` Set去重
**重构目标**: 可能保留在入口或移到segmenter

### 2.3 `detectLanguage(text)` 🔴
**功能**: 检测文本主要语言（zh-CN/ja/ko/en）
**算法**: 统计各语言字符占比
**用途**: 决定翻译方向（母语->学习语言 或 反向）
**重构目标**: 移到`core/` or `services/`

### 2.4 `isCodeText(text)` 🟡
**功能**: 判断是否为代码文本
**模式**: 检测关键字、符号、URL等
**用途**: 跳过代码块避免误翻译
**重构目标**: 移到`segmenter`或`config`

### 2.5 `reconstructTextWithWords(text, targetWords)` 🟡
**功能**: 重建文本，只保留包含目标词汇的句子
**用途**: 优化发送给API的文本量
**重构目标**: 移到`api-service`或`processing-service`

### 2.6 `shouldSkipNode(node)` 🔴
**功能**: 判断DOM节点是否应跳过处理
**检查**:
- SKIP_TAGS（script/style/code等）
- SKIP_CLASSES（vocabmeld-translated等）
- display:none/visibility:hidden
- contentEditable
- data-vocabmeld-processed属性
**重构目标**: 移到`content-segmenter`

### 2.7 `getElementPath(element)` 🟢
**功能**: 生成元素的CSS路径
**用途**: 辅助生成fingerprint
**重构目标**: 可选，可能移到segmenter

### 2.8 `findTextContainers(root)` 🔴
**功能**: 查找所有包含文本的块级容器
**返回**: 容器数组
**用途**: 第一层分段，传给`getTextContent`
**重构目标**: 整合到`content-segmenter.segment()`

### 2.9 `getTextContent(element)` 🔴
**功能**: 提取元素的纯文本内容
**过滤**: 移除代码块、空白、过短文本
**重构目标**: 整合到`content-segmenter`

### 2.10 `getPageSegments(viewportOnly, margin)` 🔴
**功能**: 获取页面所有文本段落（视口优先）
**返回**: `[{ element, text, fingerprint }]`
**逻辑**:
- 视口优先（margin=300px）
- 生成fingerprint去重
- 过滤代码文本和过短文本
**重构目标**: 核心方法，整合到`content-segmenter.getSegments()`

---

## 3. 翻译与API调用（3个函数）

### 3.1 `translateText(text)` 🔴
**功能**: 调用LLM API翻译文本
**流程**:
1. 检测语言决定翻译方向
2. 提取文本中的英文单词（5+字符）或中文词汇
3. 过滤停用词、已学会词、已缓存词
4. 构建prompt发送给API
5. 解析返回的JSON格式翻译结果
6. 为每个词汇标注难度并过滤不符合的
7. 保存到缓存
8. 更新统计
**依赖**: `config`, `wordCache`, `apiEndpoint/apiKey/modelName`
**返回**: `[{ original, translation, phonetic, difficulty }]`
**重构目标**: 核心逻辑移到`api-service.translate()`

### 3.2 `translateSpecificWords(targetWords)` 🟡
**功能**: 翻译指定的单词列表
**场景**: 用户添加到记忆列表时，即使页面上没有也要翻译并缓存
**逻辑**: 重建包含目标词的文本片段，调用`translateText`
**重构目标**: 整合到`api-service`

### 3.3 `processSpecificWords(targetWords)` 🟡
**功能**: 在页面上查找并替换特定词汇
**场景**: 用户添加到记忆列表后立即翻译页面上的这些词
**返回**: 替换的词汇数量
**重构目标**: 整合到`processing-service`

---

## 4. DOM操作与替换（4个函数）

### 4.1 `createReplacementElement(original, translation, phonetic, difficulty)` 🔴
**功能**: 创建替换元素的DOM节点
**结构**:
```html
<span class="vocabmeld-translated"
      data-original="..."
      data-translation="..."
      data-phonetic="..."
      data-difficulty="...">
  <span class="vocabmeld-word">译文</span>
  <span class="vocabmeld-original">(原文)</span>
</span>
```
**样式变体**: 根据`config.translationStyle`调整显示格式
**重构目标**: 移到`text-replacer.createWrapper()`

### 4.2 `applyReplacements(element, replacements)` 🔴
**功能**: 在指定元素内应用翻译替换
**算法**:
1. TreeWalker遍历文本节点
2. 对每个replacement查找匹配的文本
3. 使用Range API精确替换
4. 避免重复替换（已有vocabmeld-translated的跳过）
5. 处理英文单词边界和中文词汇
**复杂度**: 高（核心DOM操作）
**重构目标**: 核心逻辑移到`text-replacer.replace()`

### 4.3 `restoreOriginal(element)` 🔴
**功能**: 恢复单个元素到原始文本
**逻辑**: 查找所有`.vocabmeld-translated`，替换为`data-original`
**触发**: 用户标记"已学会"后
**重构目标**: 移到`text-replacer.restore()`

### 4.4 `restoreAll()` 🔴
**功能**: 恢复整个页面到原始状态
**逻辑**:
- 查找所有`.vocabmeld-translated`元素
- 移除data-vocabmeld-processed标记
- 清空processedFingerprints
**触发**: 用户点击"恢复页面"或配置变更
**重构目标**: 移到`processing-service.restorePage()`

---

## 5. UI交互（6个函数）

### 5.1 `createTooltip()` 🔴
**功能**: 创建tooltip DOM元素并添加到body
**样式**: 固定定位，z-index高
**触发**: init时创建一次
**重构目标**: 移到新的`ui-overlay`模块

### 5.2 `showTooltip(element)` 🔴
**功能**: 显示tooltip在指定元素附近
**内容**: 翻译、难度徽章、音标（可选）、提示文字
**定位**: 元素下方5px
**重构目标**: 移到`ui-overlay.showTooltip()`

### 5.3 `hideTooltip()` 🔴
**功能**: 隐藏tooltip
**触发**: 鼠标移出、点击、滚动
**重构目标**: 移到`ui-overlay.hideTooltip()`

### 5.4 `showToast(message)` 🟡
**功能**: 显示临时提示消息（2秒后消失）
**样式**: 右下角固定，渐入渐出动画
**触发**: 添加到记忆列表等操作
**重构目标**: 移到`ui-overlay.showToast()`

### 5.5 `createSelectionPopup()` 🔴
**功能**: 创建选中文本后的弹出按钮
**按钮**: "添加到需记忆"
**定位**: 选中文本附近
**触发**: init时创建一次
**重构目标**: 移到`ui-overlay.createSelectionPopup()`

### 5.6 `setupEventListeners()` 🔴
**功能**: 绑定所有事件监听
**事件类型**:
- 鼠标悬停/移出（tooltip）
- 左键点击（发音）
- 右键点击（标记已学会）
- 文本选择（selection popup）
- 滚动（懒加载）
- MutationObserver（DOM变化）
**重构目标**: 部分移到`interaction-service`，部分保留在入口

---

## 6. 事件监听与自动处理（3个函数+1个核心处理）

### 6.1 `processPage(viewportOnly)` 🔴
**功能**: 处理页面的主函数
**流程**:
1. 检查isProcessing防止并发
2. 调用`getPageSegments()`获取段落
3. 分批并发处理（MAX_CONCURRENT=3）
4. 每个段落:
   - 调用`translateText()`
   - 应用难度过滤
   - 限制替换数量（根据intensity）
   - 调用`applyReplacements()`
5. 更新统计
**复杂度**: 非常高（主处理流程）
**重构目标**: 整体移到`processing-service.processPage()`

### 6.2 MutationObserver监听 🟡
**功能**: 监听DOM变化自动处理新内容
**逻辑**:
- 防抖500ms
- 只在enabled+autoProcess时触发
- 调用`processPage(false)`
**重构目标**: 保留在入口，使用debounce工具

### 6.3 Scroll监听（IntersectionObserver） 🟡
**功能**: 视口懒加载，滚动到时处理新内容
**margin**: 500px
**重构目标**: 保留在入口或移到`processing-service`

### 6.4 `chrome.runtime.onMessage`监听 🔴
**消息处理**:
- `processPage`: 调用`processPage()`
- `restorePage`: 调用`restoreAll()`
- `processSpecificWords`: 调用`processSpecificWords()`
- `getStatus`: 返回状态信息
**重构目标**: 保留在入口，调用service方法

### 6.5 `chrome.storage.onChanged`监听 🔴
**触发逻辑**:
- `enabled`变化: 禁用时恢复页面
- 其他配置变化: 恢复+重新处理（如果enabled）
**重构目标**: 保留在入口，可能需要更精细的变更检测

---

## 工具函数（已在上面列出）

### `debounce(func, wait)` 🟢
**重构目标**: 移到`core/utils.js`或使用现成库

---

## 重构映射表

| 旧函数 | 新位置 | 优先级 |
|--------|--------|--------|
| `loadConfig` → `storage.getConfig()` | core/storage.js | P0 |
| `loadWordCache` → `cacheService.load()` | services/cache-service.js | P0 |
| `saveWordCache` → `cacheService.persist()` | services/cache-service.js | P0 |
| `translateText` → `apiService.translate()` | services/api-service.js | P0 |
| `getPageSegments` → `segmenter.getSegments()` | services/content-segmenter.js | P0 |
| `applyReplacements` → `replacer.replace()` | services/text-replacer.js | P0 |
| `processPage` → `processingService.processPage()` | services/processing-service.js | P0 |
| `createTooltip/showTooltip` → `uiOverlay.tooltip.*` | services/ui-overlay.js | P1 |
| `createSelectionPopup` → `uiOverlay.selectionPopup.*` | services/ui-overlay.js | P1 |
| `restoreAll` → `processingService.restorePage()` | services/processing-service.js | P1 |
| `addToWhitelist` → `storage.addToLearnedWords()` | core/storage.js | P1 |
| `addToMemorizeList` → `storage.addToMemorizeList()` | core/storage.js | P1 |
| `setupEventListeners` | 保留在content.js入口 | P2 |
| `init` | 保留在content.js入口（重写为轻量） | P2 |

**优先级说明**:
- **P0**: Phase 1必须完成，核心功能
- **P1**: Phase 1-2完成，重要功能
- **P2**: Phase 2完成，入口层

---

## 关键依赖关系图

```
init()
  ├─> loadConfig()
  ├─> loadWordCache()
  ├─> createTooltip()
  ├─> createSelectionPopup()
  ├─> setupEventListeners()
  └─> processPage() [if autoProcess]

processPage()
  ├─> getPageSegments()
  │     ├─> findTextContainers()
  │     ├─> getTextContent()
  │     ├─> detectLanguage()
  │     └─> generateFingerprint()
  ├─> translateText()
  │     ├─> detectLanguage()
  │     ├─> reconstructTextWithWords()
  │     └─> API call
  ├─> applyReplacements()
  │     └─> createReplacementElement()
  └─> updateStats()

用户交互
  ├─> tooltip: showTooltip()/hideTooltip()
  ├─> 左键: chrome.runtime.sendMessage({action:'speak'})
  ├─> 右键: addToWhitelist() + restoreOriginal()
  └─> 选择: addToMemorizeList() + processSpecificWords()
```

---

## 统计数据

- **总代码行数**: 1502行
- **总函数数**: 31个
- **核心函数**: 15个（必须正确实现）
- **辅助函数**: 10个（可以简化或合并）
- **UI函数**: 6个（可以模块化）
- **估计重复代码**: ~800行（与services重复）
- **估计最终content.js**: <300行（入口+wiring）

---

## Phase 1-2 迁移检查清单

每迁移一个函数，在此打勾：

### Phase 1（模块补齐）
- [ ] storage.getConfig() 验证正确
- [ ] cacheService.load/persist() 验证正确
- [ ] apiService.translate() 实现并测试
- [ ] segmenter.getSegments() 实现并测试
- [ ] replacer.replace() 实现并测试
- [ ] uiOverlay 模块创建

### Phase 2（入口薄化）
- [ ] init() 重写为轻量入口
- [ ] processPage 调用processingService
- [ ] setupEventListeners 保留但使用service
- [ ] 消息监听使用service
- [ ] 存储监听使用service
- [ ] 删除所有重复实现代码

### 验证
- [ ] 通过REGRESSION_CHECKLIST.md所有测试
- [ ] content.js < 300行
- [ ] 无重复代码

---

**文档状态**: ✅ 完成
**下一步**: 进入Phase 1实施
