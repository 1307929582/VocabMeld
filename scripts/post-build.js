#!/usr/bin/env node

/**
 * Post-build脚本：修复Vite构建后的HTML路径问题
 * 将HTML从dist/src/移动到dist/并修复路径引用
 */

const fs = require('fs');
const path = require('path');

const distPath = path.join(__dirname, '../dist');
const srcPath = path.join(distPath, 'src');

console.log('[Post-Build] Starting HTML path fix...');

// 移动HTML文件
if (fs.existsSync(srcPath)) {
  const htmlFiles = fs.readdirSync(srcPath).filter(f => f.endsWith('.html'));

  for (const file of htmlFiles) {
    const from = path.join(srcPath, file);
    const to = path.join(distPath, file);

    // 移动文件
    fs.renameSync(from, to);
    console.log(`[Post-Build] Moved ${file} to dist/`);

    // 读取并修复路径
    let content = fs.readFileSync(to, 'utf-8');
    content = content.replace(/(src|href)="\.\.\//g, '$1="./');
    fs.writeFileSync(to, content);
    console.log(`[Post-Build] Fixed paths in ${file}`);
  }

  // 删除空的src目录
  if (fs.readdirSync(srcPath).length === 0) {
    fs.rmdirSync(srcPath);
    console.log('[Post-Build] Removed empty src/ directory');
  }
}

console.log('[Post-Build] ✓ Complete');
