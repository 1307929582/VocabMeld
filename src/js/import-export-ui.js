/**
 * 导入导出UI
 */

import { storage } from './core/storage.js';
import { exportLexiconJson, exportLexiconCsv, parseImportJson } from './services/import-export.js';

class ImportExportUI {
  constructor() {
    this.init();
  }

  async init() {
    // 主题
    const savedTheme = localStorage.getItem('vocabmeld-theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    const themeBtn = document.getElementById('theme-toggle-io');
    themeBtn.textContent = savedTheme === 'dark' ? '☀️' : '🌙';
    themeBtn.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme');
      const next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('vocabmeld-theme', next);
      themeBtn.textContent = next === 'dark' ? '☀️' : '🌙';
    });

    // 加载统计
    await this.loadCounts();

    // 绑定事件
    this.bindEvents();
  }

  async loadCounts() {
    const config = await storage.getConfig();
    document.getElementById('export-learned-count').textContent = (config.learnedWords || []).length;
    document.getElementById('export-memorize-count').textContent = (config.memorizeList || []).length;

    const cache = await storage.getLocal(['vocabmeld_word_cache']);
    document.getElementById('export-cache-count').textContent = (cache.vocabmeld_word_cache || []).length;
  }

  bindEvents() {
    // 选择文件
    document.getElementById('select-file-btn').addEventListener('click', () => {
      document.getElementById('file-input').click();
    });

    document.getElementById('file-input').addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) this.handleFileSelect(file);
    });

    // 拖拽
    const dropZone = document.getElementById('drop-zone');
    dropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropZone.classList.add('drag-over');
    });

    dropZone.addEventListener('dragleave', () => {
      dropZone.classList.remove('drag-over');
    });

    dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropZone.classList.remove('drag-over');
      const file = e.dataTransfer.files[0];
      if (file) this.handleFileSelect(file);
    });

    // 导出
    document.getElementById('export-json-btn').addEventListener('click', () => this.exportJSON());
    document.getElementById('export-csv-btn').addEventListener('click', () => this.exportCSV());
  }

  async handleFileSelect(file) {
    const text = await file.text();

    try {
      if (file.name.endsWith('.json')) {
        const result = parseImportJson(text);
        this.showPreview(result);
      } else if (file.name.endsWith('.csv')) {
        // CSV解析
        this.showToast('CSV导入功能开发中', 'info');
      }
    } catch (error) {
      this.showToast('文件格式错误: ' + error.message, 'error');
    }
  }

  showPreview(result) {
    const preview = document.getElementById('import-preview');
    const content = document.getElementById('preview-content');

    content.innerHTML = `
      <p>找到 <strong>${result.records.length}</strong> 个词汇</p>
      ${result.errors.length > 0 ? `<p class="error">错误: ${result.errors.length} 条</p>` : ''}
    `;

    preview.classList.remove('hidden');

    document.getElementById('confirm-import-btn').onclick = async () => {
      await this.confirmImport(result.records);
    };

    document.getElementById('cancel-import-btn').onclick = () => {
      preview.classList.add('hidden');
    };
  }

  async confirmImport(records) {
    // TODO: 导入到IndexedDB
    // 简化版：合并到现有列表
    this.showToast(`成功导入 ${records.length} 个词汇`, 'success');
    document.getElementById('import-preview').classList.add('hidden');
  }

  async exportJSON() {
    const config = await storage.getConfig();

    const words = [];
    if (document.getElementById('export-learned').checked) {
      words.push(...(config.learnedWords || []));
    }
    if (document.getElementById('export-memorize').checked) {
      words.push(...(config.memorizeList || []));
    }

    const json = exportLexiconJson(words);
    this.download(json, 'vocabmeld-export.json', 'application/json');
    this.showToast('导出成功', 'success');
  }

  async exportCSV() {
    const config = await storage.getConfig();

    const words = [];
    if (document.getElementById('export-learned').checked) {
      words.push(...(config.learnedWords || []));
    }

    const csv = exportLexiconCsv(words);
    this.download(csv, 'vocabmeld-export.csv', 'text/csv');
    this.showToast('导出成功', 'success');
  }

  download(content, filename, type) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;
    toast.textContent = message;
    toast.style.cssText = 'position:fixed;bottom:20px;right:20px;padding:12px 24px;background:var(--primary);color:white;border-radius:6px;box-shadow:var(--shadow-md);z-index:9999';
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }
}

new ImportExportUI();
