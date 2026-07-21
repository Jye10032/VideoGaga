#!/usr/bin/env node

/**
 * 迁移脚本：将硬编码的 white/xx 颜色替换为语义化 CSS 变量
 * 用法：node scripts/migrate-to-semantic-colors.js
 */

const fs = require('fs');
const path = require('path');

// 颜色映射表
const colorMap = {
  // 文字颜色
  'text-white/90': 'text-[var(--text-primary)]',
  'text-white/85': 'text-[var(--text-primary)]',
  'text-white/84': 'text-[var(--text-primary)]',
  'text-white/82': 'text-[var(--text-primary)]',
  'text-white/80': 'text-[var(--text-primary)]',
  'text-white/78': 'text-[var(--text-secondary)]',
  'text-white/75': 'text-[var(--text-secondary)]',
  'text-white/70': 'text-[var(--text-secondary)]',
  'text-white/65': 'text-[var(--text-secondary)]',
  'text-white/60': 'text-[var(--text-tertiary)]',
  'text-white/55': 'text-[var(--text-tertiary)]',
  'text-white/50': 'text-[var(--text-tertiary)]',
  'text-white/45': 'text-[var(--text-tertiary)]',
  'text-white/40': 'text-[var(--text-tertiary)]',
  'text-white/35': 'text-[var(--text-placeholder)]',
  'text-white/30': 'text-[var(--text-placeholder)]',

  // 背景颜色 - 使用任意值语法
  'bg-white/[0.035]': 'bg-[var(--surface-bg)]',
  'bg-white/[0.04]': 'bg-[var(--surface-bg)]',
  'bg-white/[0.05]': 'bg-[var(--surface-bg)]',
  'bg-white/[0.06]': 'bg-[var(--surface-bg-hover)]',
  'bg-white/[0.08]': 'bg-[var(--surface-bg-hover)]',
  'bg-white/[0.10]': 'bg-[var(--surface-bg-hover)]',
  'bg-white/[0.12]': 'bg-[var(--surface-bg-active)]',
  'bg-white/[0.15]': 'bg-[var(--surface-bg-active)]',
  'bg-white/[0.028]': 'bg-[var(--surface-bg)]',
  'bg-white/[0.03]': 'bg-[var(--surface-bg)]',
  'bg-white/5': 'bg-[var(--surface-bg)]',
  'bg-white/10': 'bg-[var(--surface-bg-hover)]',
  'bg-white/15': 'bg-[var(--surface-bg-active)]',

  // 边框颜色
  'border-white/[0.06]': 'border-[var(--surface-border)]',
  'border-white/[0.08]': 'border-[var(--surface-border)]',
  'border-white/[0.10]': 'border-[var(--surface-border)]',
  'border-white/[0.12]': 'border-[var(--surface-border)]',
  'border-white/[0.15]': 'border-[var(--surface-border-strong)]',
  'border-white/[0.18]': 'border-[var(--surface-border-strong)]',
  'border-white/[0.20]': 'border-[var(--surface-border-strong)]',
  'border-white/[0.22]': 'border-[var(--surface-border-strong)]',
  'border-white/[0.25]': 'border-[var(--surface-border-strong)]',
  'border-white/[0.30]': 'border-[var(--surface-border-strong)]',
  'border-white/10': 'border-[var(--surface-border)]',
  'border-white/12': 'border-[var(--surface-border)]',
  'border-white/15': 'border-[var(--surface-border-strong)]',
  'border-white/20': 'border-[var(--surface-border-strong)]',
  'border-white/30': 'border-[var(--surface-border-strong)]',

  // placeholder 颜色
  'placeholder:text-white/70': 'placeholder:text-[var(--text-secondary)]',
  'placeholder:text-white/60': 'placeholder:text-[var(--text-tertiary)]',
  'placeholder:text-white/50': 'placeholder:text-[var(--text-placeholder)]',
};

// 需要跳过的文件
const skipFiles = [
  'node_modules',
  '.next',
  'scripts/migrate-to-semantic-colors.js',
];

// 递归获取所有 tsx 文件
function getTsxFiles(dir, files = []) {
  const items = fs.readdirSync(dir);

  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      if (skipFiles.some(skip => fullPath.includes(skip))) continue;
      getTsxFiles(fullPath, files);
    } else if (item.endsWith('.tsx')) {
      files.push(fullPath);
    }
  }

  return files;
}

// 替换文件内容
function replaceInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  let hasChanges = false;

  for (const [oldPattern, newPattern] of Object.entries(colorMap)) {
    // 处理转义的特殊字符
    const escapedPattern = oldPattern
      .replace(/\[/g, '\\[')
      .replace(/\]/g, '\\]');

    const regex = new RegExp(escapedPattern.replace(/\//g, '\\/'), 'g');

    if (regex.test(content)) {
      content = content.replace(regex, newPattern);
      hasChanges = true;
    }
  }

  if (hasChanges) {
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`✓ ${filePath}`);
    return true;
  }

  return false;
}

// 主函数
function main() {
  const rootDir = path.join(__dirname, '..');
  const files = getTsxFiles(path.join(rootDir, 'app'));

  console.log(`Found ${files.length} TSX files\n`);

  let modifiedCount = 0;

  for (const file of files) {
    if (replaceInFile(file)) {
      modifiedCount++;
    }
  }

  console.log(`\n✅ Modified ${modifiedCount} files`);
}

main();
