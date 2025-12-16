/**
 * Dashboard页面
 */

import { storage } from './core/storage.js';

// 主题切换
document.getElementById('theme-toggle').addEventListener('click', () => {
  const current = document.documentElement.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('vocabmeld-theme', next);
  document.getElementById('theme-toggle').textContent = next === 'dark' ? '☀️ 浅色模式' : '🌙 深色模式';
});

// 加载主题
const savedTheme = localStorage.getItem('vocabmeld-theme') || 'light';
document.documentElement.setAttribute('data-theme', savedTheme);
document.getElementById('theme-toggle').textContent = savedTheme === 'dark' ? '☀️ 浅色模式' : '🌙 深色模式';

// 加载统计
async function loadStats() {
  const config = await storage.getConfig();
  
  document.getElementById('stat-learned').textContent = (config.learnedWords || []).length;
  document.getElementById('stat-memorize').textContent = (config.memorizeList || []).length;
  document.getElementById('stat-today').textContent = config.todayWords || 0;
  
  const hits = config.cacheHits || 0;
  const misses = config.cacheMisses || 0;
  const total = hits + misses;
  const rate = total > 0 ? Math.round((hits / total) * 100) : 0;
  document.getElementById('stat-cache-rate').textContent = rate + '%';

  renderChart();
}

// 渲染图表
function renderChart() {
  const ctx = document.getElementById('learning-chart');
  new Chart(ctx, {
    type: 'line',
    data: {
      labels: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
      datasets: [{
        label: '每日新词',
        data: [12, 19, 8, 15, 10, 13, 9],
        borderColor: '#4A90E2',
        backgroundColor: 'rgba(74, 144, 226, 0.1)',
        tension: 0.4,
        fill: true
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: { beginAtZero: true }
      }
    }
  });
}

loadStats();
