/**
 * @file path-guard.js
 * @description 路径参数安全校验——防 argv 名称注入路径穿越（../../ 逃逸出工作目录）
 * @module cli/path-guard
 */
const path = require('path');

/**
 * 项目名：与主仓 lib/index.js validator 规则一致（小写字母开头，仅小写字母/数字/连字符）。
 * 不含点与斜杠 → 不可能构造 `..` / 绝对路径 / 子路径。
 */
const SAFE_PROJECT_NAME = /^[a-z][a-z0-9-]{0,49}$/;

/** 组件名：字母开头，仅字母/数字/下划线/连字符（用作目录名与 .tsx 文件名）。 */
const SAFE_COMPONENT_NAME = /^[A-Za-z][A-Za-z0-9_-]{0,63}$/;

const RULES = {
  project: { pattern: SAFE_PROJECT_NAME, label: '项目名' },
  component: { pattern: SAFE_COMPONENT_NAME, label: '组件名' },
};

/**
 * 校验 CLI 传入的名称为单一安全路径段。
 * @param {string} name - argv 原始名称
 * @param {'project'|'component'} kind - 用途类别
 * @returns {string} 校验通过的名称（trim 后）
 * @throws {Error} 名称缺失、含路径分隔符/`..`/越界字符时抛出
 */
function validateSafeName(name, kind) {
  const rule = RULES[kind];
  if (!rule) {
    throw new Error(`未知的名称类别: ${kind}`);
  }
  if (typeof name !== 'string' || name.trim() === '') {
    throw new Error(`${rule.label}不能为空`);
  }
  const trimmed = name.trim();
  // 显式拒绝穿越序列与分隔符（双保险：字符白名单本身已不含 . 和 /）
  if (trimmed.includes('..') || /[/\\]/.test(trimmed) || path.isAbsolute(trimmed)) {
    throw new Error(`${rule.label}不能包含路径分隔符或 ".."（疑似路径穿越）: ${trimmed}`);
  }
  if (!rule.pattern.test(trimmed)) {
    throw new Error(
      `${rule.label}只能包含${kind === 'project' ? '小写字母、数字和连字符，且必须以字母开头' : '字母、数字、下划线和连字符，且必须以字母开头'}（长度 ≤ ${kind === 'project' ? 50 : 64}）: ${trimmed}`
    );
  }
  return trimmed;
}

/**
 * 校验目标路径解析后落在允许根目录内（供需要相对根的写操作使用）。
 * @param {string} target - 待写路径（相对或绝对）
 * @param {string} root - 允许根目录
 * @returns {string} 解析后的绝对路径
 * @throws {Error} 落点逃逸出根目录时抛出
 */
function ensureWithinRoot(target, root) {
  const resolvedRoot = path.resolve(root);
  const resolvedTarget = path.resolve(resolvedRoot, target);
  if (resolvedTarget !== resolvedRoot && !resolvedTarget.startsWith(resolvedRoot + path.sep)) {
    throw new Error(`目标路径逃逸出允许根目录 ${resolvedRoot}: ${target}`);
  }
  return resolvedTarget;
}

module.exports = { validateSafeName, ensureWithinRoot, SAFE_PROJECT_NAME, SAFE_COMPONENT_NAME };
