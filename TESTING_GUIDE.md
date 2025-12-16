# 🧪 VocabMeld 商业化功能测试指南

## 快速开始

### 1. 重新构建和加载

```bash
# 重新构建（获取最新功能）
npm run build

# 在浏览器中
1. 打开 chrome://extensions/ 或 edge://extensions/
2. 找到VocabMeld扩展
3. 点击"刷新"图标（或移除后重新加载dist/目录）
```

---

## 🎯 新功能测试清单

### ✅ 功能1：多API配置管理

**测试步骤**：
1. 点击扩展图标 → 打开"设置"
2. 滚动到"API配置管理"section
3. 点击"+ 添加API配置"按钮

**预期结果**：
- ✓ 弹出Modal对话框
- ✓ 可以填写：配置名称、选择Provider、输入Endpoint和Model、输入API Key
- ✓ 选择不同Provider时，Endpoint和Model自动填充
- ✓ 点击"保存"后，卡片出现在列表中

**测试多个配置**：
1. 添加第2个API配置（例如添加OpenAI作为备用）
2. 点击某个卡片的"使用此配置"按钮
3. 观察该卡片显示"当前使用"标签

**测试连接**：
1. 在某个API卡片上点击"测试"按钮
2. 观察提示（成功/失败）

---

### ✅ 功能2：学习Dashboard

**测试步骤**：
1. 直接在浏览器打开：`file:///Users/xmdbd/项目/VocabMeld/dist/dashboard.html`

   或者在Console中：
   ```javascript
   chrome.tabs.create({url: chrome.runtime.getURL('dashboard.html')})
   ```

**预期结果**：
- ✓ 看到4个统计卡片（已学会、需记忆、今日新词、缓存命中率）
- ✓ 看到学习趋势折线图（Chart.js）
- ✓ 右上角有"🌙 深色模式"按钮

---

### ✅ 功能3：深色模式

**测试步骤**：

**在Dashboard**：
1. 打开Dashboard页面
2. 点击右上角"🌙 深色模式"按钮

**在Options**：
1. 打开Options页面
2. 点击侧边栏标题旁的"🌙"按钮

**预期结果**：
- ✓ 页面切换为深色主题
- ✓ 背景变为深灰色
- ✓ 文字颜色适配
- ✓ 刷新页面后主题保持

---

### ✅ 功能4：自动Fallback（后端已就绪）

**测试方式**（需要2个以上API配置）：
1. 添加2个API配置（例如DeepSeek + OpenAI）
2. 在Options设置中选择"自动Fallback"模式
3. 将一个配置的API Key故意设置错误
4. 处理页面时，观察Console

**预期结果**：
- ✓ 第一个API失败后自动尝试第二个
- ✓ Console显示fallback日志
- ✓ 页面最终能成功处理

---

### ✅ 功能5：数据迁移（自动）

**测试方式**：
1. 如果你之前使用过旧版本，卸载后重新加载新版本
2. 打开Background Service Worker Console
3. 查看日志

**预期结果**：
- ✓ 看到"Migrating to V2 schema..."
- ✓ 旧的API配置自动迁移为Profile
- ✓ 所有数据保留

---

## 🔍 Console调试测试

如果UI功能不work，可以通过Console直接测试后端：

### 测试Storage API
```javascript
// F12打开Console（在options页面）

// 获取所有API Profiles
const profiles = await storage.getApiProfiles();
console.log('Profiles:', profiles);

// 获取路由配置
const routing = await storage.getApiRouting();
console.log('Routing:', routing);

// 测试添加Profile
await storage.upsertApiProfile({
  id: 'test-123',
  name: 'Test Profile',
  provider: 'deepseek',
  endpoint: 'https://api.deepseek.com/chat/completions',
  model: 'deepseek-chat',
  apiKeyRef: 'test-key-ref',
  enabled: true,
  priority: 20
});

// 测试保存API Key
await storage.setApiKey('test-key-ref', 'your-api-key-here', 'deepseek');

// 验证
const key = await storage.getApiKey('test-key-ref');
console.log('Retrieved key:', key);
```

### 测试Background消息
```javascript
// 测试获取profiles
chrome.runtime.sendMessage({action: 'profiles:list'}, (response) => {
  console.log('Profiles from background:', response);
});

// 测试API
chrome.runtime.sendMessage({
  action: 'llm:testProfile',
  profileId: 'your-profile-id'
}, (response) => {
  console.log('Test result:', response);
});
```

---

## 📊 预期功能状态

| 功能 | 后端 | 前端UI | 可测试 |
|------|------|--------|--------|
| 多API配置 | ✅ | ✅ | ✅ |
| 智能路由 | ✅ | ✅ | ✅ |
| 自动Fallback | ✅ | ⚠️ | 🔧 Console |
| Dashboard | ✅ | ✅ | ✅ |
| 深色模式 | N/A | ✅ | ✅ |
| IndexedDB词库 | ✅ | ⚠️ | 🔧 Console |
| SRS复习 | ✅ | ❌ | 🔧 Console |
| 词汇卡片 | ✅ | ❌ | ❌ |
| 导入/导出 | ✅ | ❌ | 🔧 Console |

**图例**：
- ✅ 完全可用
- ⚠️ 部分可用
- ❌ 未实现
- 🔧 仅通过Console测试

---

## 🚀 开始测试

**推荐测试流程**：

1. **重新构建**：`npm run build`
2. **重新加载扩展**：在chrome://extensions/刷新
3. **测试基础功能**：Popup、Options能否打开
4. **测试多API配置**：添加/编辑/切换API配置
5. **测试Dashboard**：打开dashboard.html查看统计
6. **测试深色模式**：切换主题
7. **测试Console API**：通过Console测试后端功能

---

## 💡 如果遇到问题

**问题1：Modal不弹出**
- 检查Console是否有错误
- 确认api-management.js已加载

**问题2：Dashboard打不开**
- 确保使用正确路径打开
- 检查Chart.js CDN是否加载

**问题3：深色模式不工作**
- 检查localStorage中是否有vocabmeld-theme
- 清除缓存重试

---

**现在可以开始测试了！告诉我测试结果，我会立即修复任何问题！** 🔧
