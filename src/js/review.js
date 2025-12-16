/**
 * SRS复习界面
 */

import { storage } from './core/storage.js';

class ReviewUI {
  constructor() {
    this.queue = [];
    this.currentIndex = 0;
    this.reviewedToday = 0;

    this.flashcard = document.getElementById('flashcard');
    this.container = document.getElementById('flashcard-container');
    this.emptyState = document.getElementById('review-empty');

    this.init();
  }

  async init() {
    // 初始化主题
    const savedTheme = localStorage.getItem('vocabmeld-theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    const themeBtn = document.getElementById('theme-toggle-review');
    themeBtn.textContent = savedTheme === 'dark' ? '☀️' : '🌙';
    themeBtn.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme');
      const next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('vocabmeld-theme', next);
      themeBtn.textContent = next === 'dark' ? '☀️' : '🌙';
    });

    // 加载复习队列（从storage的learnedWords和memorizeList）
    await this.loadQueue();

    if (this.queue.length === 0) {
      this.showEmpty();
      return;
    }

    this.showCard();
    this.bindEvents();
  }

  async loadQueue() {
    const config = await storage.getConfig();

    // 简化版：从已学会和需记忆中随机抽取
    const learned = config.learnedWords || [];
    const memorize = config.memorizeList || [];

    this.queue = [
      ...learned.map(w => ({
        original: w.original,
        translation: w.word || '',
        difficulty: w.difficulty || 'B1',
        type: 'learned'
      })),
      ...memorize.map(w => ({
        original: w.word,
        translation: '待复习',
        difficulty: w.difficulty || 'B1',
        type: 'memorize'
      }))
    ].sort(() => Math.random() - 0.5).slice(0, 20); // 随机抽20个

    document.getElementById('progress-total').textContent = this.queue.length;
    document.getElementById('review-remaining').textContent = this.queue.length;
  }

  showCard() {
    if (this.currentIndex >= this.queue.length) {
      this.showEmpty();
      return;
    }

    const word = this.queue[this.currentIndex];

    document.getElementById('card-word').textContent = word.original;
    document.getElementById('card-translation').textContent = word.translation;
    document.getElementById('card-phonetic').textContent = word.phonetic || '';
    document.getElementById('card-difficulty').textContent = word.difficulty;

    document.getElementById('progress-current').textContent = this.currentIndex + 1;
    document.getElementById('progress-fill').style.width =
      ((this.currentIndex + 1) / this.queue.length * 100) + '%';

    this.flashcard.classList.remove('flipped');
  }

  showEmpty() {
    this.container.classList.add('hidden');
    this.emptyState.classList.remove('hidden');
  }

  bindEvents() {
    // 点击卡片翻转
    this.flashcard.addEventListener('click', () => {
      this.flashcard.classList.toggle('flipped');
    });

    // 评分按钮
    document.getElementById('btn-hard').addEventListener('click', () => this.rate(1));
    document.getElementById('btn-good').addEventListener('click', () => this.rate(3));
    document.getElementById('btn-easy').addEventListener('click', () => this.rate(5));

    // 键盘快捷键
    document.addEventListener('keydown', (e) => {
      if (e.key === ' ') {
        e.preventDefault();
        this.flashcard.classList.toggle('flipped');
      }
      if (e.key === '1') this.rate(1);
      if (e.key === '2') this.rate(3);
      if (e.key === '3') this.rate(5);
    });
  }

  rate(grade) {
    this.reviewedToday++;
    document.getElementById('review-today-count').textContent = this.reviewedToday;
    document.getElementById('review-remaining').textContent =
      this.queue.length - this.currentIndex - 1;

    // TODO: 调用SRS后端更新间隔
    // await srsService.submitReview({wordId, grade});

    this.currentIndex++;
    this.showCard();
  }
}

new ReviewUI();
