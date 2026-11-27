/**
 * @file skills-indexer.js
 * @description Skills 索引构建引擎
 */
const fs = require('fs').promises;
const path = require('path');
// 仓根默认（lib/..）；工作区级聚合经 YYC3_SKILLS_HUB 环境变量覆写
const REPO_ROOT = path.resolve(__dirname, '..');
const SKILLS_HUB = process.env.YYC3_SKILLS_HUB
  ? path.resolve(process.env.YYC3_SKILLS_HUB)
  : path.join(REPO_ROOT, 'skills-hub');

async function scanSkillFiles(baseDir) {
  const results = []; const dir = baseDir || SKILLS_HUB;
  async function walk(d) {
    const entries = await fs.readdir(d, { withFileTypes: true });
    for (const e of entries) {
      const fp = path.join(d, e.name);
      if (e.isDirectory()) { if (!e.name.startsWith('.')) await walk(fp); }
      else if (e.name === 'SKILL.md') results.push(fp);
    }
  }
  await walk(dir); return results;
}

function parseFrontmatter(content) {
  const m = content.match(/^---\n([\s\S]*?)\n---\n/);
  if (!m) return {};
  const r = {};
  let lastKey = null;
  let folded = null; // 'block'（| 换行连接）| 'flow'（> 空格连接）
  for (const l of m[1].split('\n')) {
    // 折叠/块标量续行（agentskills.io 开放规范的多行 description：>- / > / |- / |）
    if (lastKey && folded && /^\s+.+/.test(l)) {
      const piece = l.trim();
      r[lastKey] = r[lastKey] ? (folded === 'block' ? r[lastKey] + '\n' + piece : r[lastKey] + ' ' + piece) : piece;
      continue;
    }
    folded = null;
    const i = l.indexOf(':'); if (i < 0) continue;
    const key = l.slice(0,i).trim();
    let v = l.slice(i+1).trim();
    if (v === '>-' || v === '>') { v = ''; folded = 'flow'; }
    else if (v === '|-' || v === '|') { v = ''; folded = 'block'; }
    else v = v.replace(/^["']|["']$/g,'');
    r[key] = v;
    lastKey = key;
  }
  return r;
}

async function buildIndex(options) {
  options = options || {};
  console.log('[skills:build] Scanning...');
  const files = await scanSkillFiles();
  console.log('[skills:build] Found ' + files.length + ' files');
  const cats = {};
  for (const f of files) {
    const meta = parseFrontmatter(await fs.readFile(f, 'utf-8'));
    const cat = meta.category || 'Uncategorized';
    if (!cats[cat]) cats[cat] = [];
    cats[cat].push({ name: meta.name, path: path.relative(REPO_ROOT, f), category: cat, version: meta.version || '1.0.0' });
  }
  const out = { _meta: { total: files.length, categories: Object.keys(cats).length, generated_at: new Date().toISOString() }, categories: cats };
  const outPath = options.output || path.join(REPO_ROOT, '_categories.json');
  await fs.writeFile(outPath, JSON.stringify(out, null, 2));
  console.log('[skills:build] Done: ' + files.length + ' skills in ' + Object.keys(cats).length + ' categories');
  return out;
}

module.exports = { buildIndex, scanSkillFiles, parseFrontmatter, ROOT: REPO_ROOT };
