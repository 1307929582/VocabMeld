# VocabMeld 商业化升级 - 技术架构文档

## 项目概述

**目标**：将VocabMeld从功能性扩展升级为商业级语言学习产品
**范围**：P0+P1完整实施（2-4周）
**风格**：现代专业风（蓝色主题+Inter字体+SaaS风格）

---

## P0 核心功能（Week 1-2）

### 1. 多API配置管理

**数据结构**：
```typescript
interface ApiProfile {
  id: string;              // uuid
  name: string;            // "DeepSeek主用"
  provider: 'openai'|'deepseek'|'moonshot'|'groq'|'ollama'|'custom';
  endpoint: string;
  model: string;
  apiKeyRef: string;       // 指向local存储的key id
  enabled: boolean;
  priority: number;        // fallback顺序
  createdAt: number;
  updatedAt: number;
}

interface ApiRoutingConfig {
  mode: 'manual' | 'fallback';
  selectedProfileId: string | null;
  fallbackOrder: string[];
}
```

**存储策略**：
- sync: apiProfiles[], apiRouting (非敏感)
- local: apiKeys (敏感数据)

**UI组件**：
- API卡片列表（grid布局）
- 添加/编辑Modal
- 路由模式切换
- Fallback优先级拖拽排序

---

### 2. 学习Dashboard

**功能**：
- 今日/本周/总计学习数据
- 学习进度条和目标
- 趋势图（Chart.js）

**卡片设计**：
- 今日新词
- 总词汇量
- 缓存命中率
- 学习连续天数

---

### 3. 深色模式

**实现**：
- CSS Variables主题系统
- 跟随系统或手动选择
- 平滑过渡动画

---

## P1 高级功能（Week 3-4）

### 4. SRS复习系统

**算法**：艾宾浩斯遗忘曲线（SM-2）

**数据结构**：
```typescript
interface WordRecord {
  id: string;
  original: string;
  translation: string;
  status: 'new' | 'learning' | 'review' | 'mastered';
  nextReviewAt: number;
  interval: number;
  ease: number;
  reps: number;
}
```

---

### 5. 词汇卡片学习

**界面**：类Anki闪卡
**功能**：主动复习、快捷键操作

---

### 6. 导入/导出

**格式**：CSV/JSON
**隐私**：不包含API Key

---

## UI设计规范

### 配色方案
```css
--primary: #4A90E2;      /* 智慧蓝 */
--success: #50E3C2;      /* 薄荷绿 */
--warning: #F5A623;      /* 温暖橙 */
--error: #D0021B;        /* 错误红 */
--bg: #F5F7FA;           /* 浅灰背景 */
--card-bg: #FFFFFF;      /* 卡片白色 */
--text-primary: #1A1A1A; /* 深黑文字 */
--text-secondary: #4A4A4A; /* 中灰文字 */
```

### 字体
- **主字体**：Inter
- **字号体系**：标题18px, 小标题14px, 正文14px, 提示12px

### 图标
- **Lucide Icons**（简洁现代）

---

## 实施计划

### Week 1
- [ ] 多API配置数据结构实现
- [ ] Background API代理
- [ ] API管理UI（前端）
- [ ] 数据迁移

### Week 2
- [ ] Dashboard UI实现
- [ ] 深色模式实现
- [ ] 测试和bug修复

### Week 3
- [ ] IndexedDB词库
- [ ] SRS复习系统后端
- [ ] 复习界面前端

### Week 4
- [ ] 词汇卡片学习
- [ ] 导入/导出
- [ ] 整体测试和优化

---

## 技术决策

### 安全性
- API Key仅存local，不跨设备同步
- Background统一代理，content不持有key
- 去除所有innerHTML注入

### 性能
- 请求去重和合并
- 并发控制（全局2-4个）
- Rate Limit软限制

### 可扩展性
- Provider Adapter模式
- 插件化pipeline
- 主题系统

---

**下一步**：立即开始多API配置管理实施
