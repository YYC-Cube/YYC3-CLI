/**
 * @file skills-indexer.js
 * @description Skills 索引构建引擎
 */
const fs = require('fs').promises;
const path = require('path');
const SKILLS_HUB = path.resolve(__dirname, '../../skills-hub');

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
  for (const l of m[1].split('\n')) {
    const i = l.indexOf(':'); if (i < 0) continue;
    r[l.slice(0,i).trim()] = l.slice(i+1).trim().replace(/^["']|["']$/g,'');
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
    cats[cat].push({ name: meta.name, path: path.relative(path.resolve(__dirname,'../..'), f), category: cat, version: meta.version || '1.0.0' });
  }
  const out = { _meta: { total: files.length, categories: Object.keys(cats).length, generated_at: new Date().toISOString() }, categories: cats };
  const outPath = options.output || path.resolve(__dirname, '../../_categories.json');
  await fs.writeFile(outPath, JSON.stringify(out, null, 2));
  console.log('[skills:build] Done: ' + files.length + ' skills in ' + Object.keys(cats).length + ' categories');
  return out;
}

module.exports = { buildIndex, scanSkillFiles, parseFrontmatter };
