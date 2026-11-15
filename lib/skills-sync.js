/**
 * @file skills-sync.js
 * @description skills sync-core —— 从 @yyc3/i18n-Core 同步技能包到 skills-hub 并链式校验
 */
const fs = require('fs');
const fsp = require('fs').promises;
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const { validateAll } = require('./skills-validator');

/** 源目录解析：--src（显式即严格——无效即抛）> YYC3_I18N_CORE_DIR > 仓邻 ../YYC3-i18n-Core > node_modules 依赖形态。 */
function resolveSourceDir(explicitSrc) {
  if (explicitSrc) {
    if (!hasSkillPackages(explicitSrc)) {
      throw new Error(`--src 指定的目录无技能包（含 SKILL.md 的子目录）: ${explicitSrc}`);
    }
    return path.resolve(explicitSrc);
  }
  const candidates = [
    process.env.YYC3_I18N_CORE_DIR ? path.join(process.env.YYC3_I18N_CORE_DIR, 'skills') : null,
    path.resolve(ROOT, '../YYC3-i18n-Core/skills'),
    path.resolve(ROOT, 'node_modules/@yyc3/i18n-core/skills'),
  ].filter(Boolean);
  for (const dir of candidates) {
    if (hasSkillPackages(dir)) return dir;
  }
  return null;
}

function hasSkillPackages(dir) {
  try {
    return fs.readdirSync(dir, { withFileTypes: true })
      .some((e) => e.isDirectory() && fs.existsSync(path.join(dir, e.name, 'SKILL.md')));
  } catch { return false; }
}

async function copyDir(src, dest) {
  await fsp.mkdir(dest, { recursive: true });
  let files = 0;
  for (const entry of await fsp.readdir(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) files += await copyDir(s, d);
    else { await fsp.copyFile(s, d); files += 1; }
  }
  return files;
}

/**
 * 同步 i18n-Core 技能包（含 SKILL.md 的子目录）到 skills-hub，随后链式跑校验器。
 * 语义：镜像同步——源内技能包覆盖 hub 同名目录；hub 中源外内容不动。
 */
async function syncCoreSkills(options = {}) {
  options = options || {};
  const src = resolveSourceDir(options.src);
  if (!src) {
    throw new Error('未找到 i18n-Core skills 源（--src 指定，或设 YYC3_I18N_CORE_DIR，或将 YYC3-i18n-Core 置于本仓同级）');
  }
  const hub = process.env.YYC3_SKILLS_HUB
    ? path.resolve(process.env.YYC3_SKILLS_HUB)
    : path.join(ROOT, 'skills-hub');

  const packages = (await fsp.readdir(src, { withFileTypes: true }))
    .filter((e) => e.isDirectory() && fs.existsSync(path.join(src, e.name, 'SKILL.md')))
    .map((e) => e.name);
  if (packages.length === 0) throw new Error(`源目录无技能包（含 SKILL.md 的子目录）: ${src}`);

  console.log(`[skills:sync-core] 源 ${src}`);
  console.log(`[skills:sync-core] 目标 ${hub}`);
  await fsp.mkdir(hub, { recursive: true });
  for (const name of packages) {
    const files = await copyDir(path.join(src, name), path.join(hub, name));
    console.log(`[skills:sync-core] ✓ ${name}（${files} 文件）`);
  }
  console.log(`[skills:sync-core] 同步 ${packages.length} 包完成`);

  if (options.validate !== false) {
    const result = await validateAll({});
    if (result.errors.length > 0) {
      throw new Error(`同步后校验失败：${result.errors.length} 错误（-v 查看明细，yyc3 skills validate -v）`);
    }
    console.log(`[skills:sync-core] 校验通过（${result.total} 文件 / 0 错误）`);
  }
  return { synced: packages, hub, src };
}

module.exports = { syncCoreSkills, resolveSourceDir };
