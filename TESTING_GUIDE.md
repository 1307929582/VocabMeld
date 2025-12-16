# 🧪 VocabMeld 商业级功能 - 完整测试指南

## 🚀 快速开始

### 1. 构建和加载

```bash
# 确保最新代码
git pull

# 重新构建
npm run build

# 在浏览器中
1. 打开 chrome://extensions/ 或 edge://extensions/
2. 找到VocabMeld → 点击"刷新"图标
   （或先移除，再"加载已解压的扩展程序" → 选择 dist/ 目录）
```

---

## ✅ 完整功能清单

### 核心功能（原有+重构）
- ✅ 智能词汇替换
- ✅ CEFR难度控制
- ✅ 2000词LRU缓存
- ✅ 已学会词汇管理
- ✅ 需记忆词汇列表

### 新增商业级功能
- ✅ 多API配置管理
- ✅ 智能路由和Fallback
- ✅ 学习Dashboard
- ✅ SRS复习系统
- ✅ 数据导入/导出
- ✅ 深色模式
- ✅ IndexedDB词库

---

## 🎯 功能测试步骤

### 测试1：多API配置管理 ⭐ 核心功能

**步骤**：
1. 点击扩展图标 → 点击"设置"
2. 在Options页面滚动到底部找到"API配置管理"section
3. 点击"+ 添加API配置"按钮

**预期**：
- ✓ 弹出Modal对话框
- ✓ 表单包含：配置名称、Provider选择、Endpoint、Model、API Key
- ✓ 选择DeepSeek后，Endpoint和Model自动填充

**操作**：
1. 填写配置名称："DeepSeek主用"
2. 选择Provider：DeepSeek
3. 输入你的DeepSeek API Key
4. 勾选"启用此配置"
5. 点击"保存"

**预期**：
- ✓ Modal关闭
- ✓ 卡片出现在列表中
- ✓ 显示配置名称、Provider、Model
- ✓ 有"编辑"、"使用"、"测试"按钮

**测试多配置**：
1. 再添加一个OpenAI配置
2. 点击某个卡片的"使用此配置"按钮
3. 观察卡片显示"当前使用"标签
4. 点击"测试"按钮验证连接

---

### 测试2：学习Dashboard ⭐ 数据可视化

**打开方式**：
```
方法1: 在浏览器地址栏输入
chrome-extension://[你的扩展ID]/dashboard.html

方法2: 直接打开文件
file:///Users/xmdbd/项目/VocabMeld/dist/dashboard.html

方法3: 在Options页面Console执行
chrome.tabs.create({url: chrome.runtime.getURL('dashboard.html')})
```

**预期**：
- ✓ 看到4个统计卡片：已学会、需记忆、今日新词、缓存命中率
- ✓ 看到学习趋势折线图（Chart.js）
- ✓ 右上角有"🌙 深色模式"按钮
- ✓ 点击切换主题，页面变为深色

---

### 测试3：SRS复习模式 ⭐ Anki风格

**打开方式**：
```
chrome-extension://[你的扩展ID]/review.html
或
file:///Users/xmdbd/项目/VocabMeld/dist/review.html
```

**预期**：
- ✓ 看到大号卡片，显示一个单词
- ✓ 卡片上方显示难度标签（如B2）
- ✓ 底部显示提示："点击卡片翻转"
- ✓ 下方有3个按钮：困难😰、一般🤔、简单😊

**操作**：
1. 点击卡片（或按空格键）
2. 卡片翻转，显示翻译和音标
3. 点击"简单"按钮（或按3键）
4. 下一张卡片出现
5. 观察顶部进度条增长

**快捷键测试**：
- 按`空格`键 → 翻转卡片
- 按`1`键 → 困难
- 按`2`键 → 一般
- 按`3`键 → 简单

---

### 测试4：数据导入/导出

**打开方式**：
```
chrome-extension://[你的扩展ID]/import-export.html
或
file:///Users/xmdbd/项目/VocabMeld/dist/import-export.html
```

**测试导出**：
1. 勾选"已学会词汇"和"需记忆词汇"
2. 点击"导出为JSON"
3. 文件自动下载（vocabmeld-export.json）
4. 打开JSON文件验证数据格式

**测试导入**：
1. 点击"选择文件"或拖拽JSON文件到区域
2. 看到预览："找到 X 个词汇"
3. 点击"确认导入"
4. 看到成功提示

---

### 测试5：深色模式 ⭐ 全局主题

**测试页面**：
- Dashboard
- Review
- Import-Export
- Options（如果添加了主题切换按钮）

**操作**：
1. 在任意页面点击"🌙"按钮
2. 观察页面切换为深色主题
3. 刷新页面，主题保持
4. 切换到其他页面，主题一致

**预期**：
- ✓ 背景变为深灰色（#1A1D21）
- ✓ 卡片变为深色（#25282D）
- ✓ 文字颜色自动适配
- ✓ 主题持久化（LocalStorage）

---

### 测试6：自动Fallback ⭐ 容错机制

**前提**：需要至少2个API配置

**步骤**：
1. 添加2个API配置：
   - DeepSeek（正确的Key）
   - OpenAI（错误的Key或不填）
2. 在Options → API配置管理 → 选择"自动Fallback"模式
3. 打开一个网页
4. 点击Popup中的"处理当前页面"
5. 打开Background Service Worker Console（在chrome://extensions/点击"Service Worker"）

**预期**：
- ✓ Console显示尝试第一个API
- ✓ 如果失败，显示"Falling back to next profile..."
- ✓ 尝试第二个API
- ✓ 页面最终能成功处理（如果第二个API可用）

---

## 🔍 Console调试测试

如果某些功能UI不work，可以通过Console直接测试后端：

### 在Options页面Console中

```javascript
// 1. 测试获取API Profiles
const profiles = await storage.getApiProfiles();
console.log('所有API配置:', profiles);

// 2. 测试添加Profile
await storage.upsertApiProfile({
  id: 'test-123',
  name: 'Console测试',
  provider: 'deepseek',
  endpoint: 'https://api.deepseek.com/chat/completions',
  model: 'deepseek-chat',
  apiKeyRef: 'test-key-ref',
  enabled: true,
  priority: 30
});

// 3. 保存API Key
await storage.setApiKey('test-key-ref', 'your-api-key', 'deepseek');

// 4. 验证
const savedProfiles = await storage.getApiProfiles();
console.log('更新后的profiles:', savedProfiles);

// 5. 测试路由
const routing = await storage.getApiRouting();
console.log('当前路由配置:', routing);
```

### 在Background Console中

```javascript
// 测试LLM Router
chrome.runtime.sendMessage({
  action: 'llm:testProfile',
  profileId: 'your-profile-id'
}, (response) => {
  console.log('连接测试结果:', response);
});

// 获取所有profiles
chrome.runtime.sendMessage({
  action: 'profiles:list'
}, (response) => {
  console.log('Profiles from background:', response);
});
```

---

## 📊 功能完成度

| 功能 | 后端 | 前端UI | 状态 |
|------|------|--------|------|
| 基础词汇替换 | ✅ | ✅ | ✅ 可用 |
| 多API配置 | ✅ | ✅ | ✅ 可用 |
| 智能Fallback | ✅ | ✅ | ✅ 可用 |
| Dashboard | ✅ | ✅ | ✅ 可用 |
| 深色模式 | N/A | ✅ | ✅ 可用 |
| SRS复习 | ✅ | ✅ | ✅ 可用 |
| 导入导出 | ✅ | ✅ | ✅ 可用 |
| IndexedDB词库 | ✅ | ⚠️ | 🔧 后台集成中 |

---

## 🎮 快速访问方式

### 方法1：在扩展中访问

1. 右键点击扩展图标
2. 选择"选项"
3. 在Options页面可以：
   - 管理API配置
   - 查看词汇列表
   - 修改设置

### 方法2：直接打开页面

```javascript
// 在任意页面的Console中执行

// 打开Dashboard
chrome.tabs.create({url: chrome.runtime.getURL('dashboard.html')})

// 打开复习模式
chrome.tabs.create({url: chrome.runtime.getURL('review.html')})

// 打开导入导出
chrome.tabs.create({url: chrome.runtime.getURL('import-export.html')})
```

### 方法3：文件系统（开发测试）

直接在浏览器打开：
- `file:///Users/xmdbd/项目/VocabMeld/dist/dashboard.html`
- `file:///Users/xmdbd/项目/VocabMeld/dist/review.html`
- `file:///Users/xmdbd/项目/VocabMeld/dist/import-export.html`

---

## 🐛 常见问题

### Q: Modal点击"添加API配置"没反应？
A: 打开Console查看错误，可能是：
- api-management.js未正确加载
- Modal元素ID不匹配
- 通过Console手动测试storage API

### Q: Dashboard图表不显示？
A: 检查：
- Chart.js CDN是否加载成功
- Console是否有Chart未定义错误
- 网络连接是否正常

### Q: 深色模式不工作？
A: 检查：
- LocalStorage中vocabmeld-theme值
- CSS文件是否正确加载
- 清除浏览器缓存重试

---

## ✨ 测试成功标准

完成以下测试即代表商业化升级成功：

- [ ] ✅ 能添加至少2个API配置
- [ ] ✅ 能切换使用不同的API
- [ ] ✅ Dashboard正常显示统计数据
- [ ] ✅ 深色模式在所有页面正常工作
- [ ] ✅ 复习模式卡片可以翻转和评分
- [ ] ✅ 能导出JSON格式数据
- [ ] ✅ 能导入之前导出的数据

---

## 🎯 下一步

测试完成后，你可以：

1. **使用新功能** - 添加多个API配置提高稳定性
2. **复习词汇** - 使用SRS系统科学复习
3. **查看进度** - Dashboard追踪学习数据
4. **备份数据** - 定期导出词汇
5. **分享项目** - 邀请其他人使用

---

**现在开始测试吧！如有任何问题随时反馈！** 🚀
