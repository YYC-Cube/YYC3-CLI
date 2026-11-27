# Changelog

所有显著变更记录于本文件。格式参考 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，版本遵循 [SemVer](https://semver.org/lang/zh-CN/)。

## [2.1.0] - 2026-11-27

### 血统声明（重要）

npm 上 `yyc3-cli@2.0.0`（2026-09-16 发布）经逐字节考古确认实为 **YYC3-AI-Agent-Archive/packages/yyc3-cli 副本血统**（tarball 8/9 文件与其 2026-08-18→09-03 提交态一致；tarball 独有 `skills-aync-index.js`/`skills-naming.js` 两文件在本仓全历史不存在）。经裁决：**本仓（YYC-Cube/YYC3-CLI）为 yyc3-cli 的真值源**，2.0.0 视为误发血统；自 2.1.0 起发布包回归本仓真值血统，并建议 deprecate 2.0.0。

### Added（真值血统首次随包发布）

- `yyc3 skills sync-core`：从 @yyc3/i18n-Core 同步技能包到 skills-hub 并链式校验（2.0.0 误发版缺失）
- `yyc3 i18n init|extract|audit`：i18n 命令组（2.0.0 误发版缺失；实现本体自本版 vendor 进 `lib/i18n-commands.cjs`，源自 YYC3-i18n-Core cli-integration v1.1.0）
- **回迁**（自 Archive 血统考古件逐字节取回，2.0.0 独有而真值线缺失）：
  - `yyc3 skills index`：AYNC 统一索引生成（docs/AYNC-INDEX.md + .json）——`lib/skills-aync-index.js`
  - `yyc3 skills naming lint|migrate`：命名合规 lint 与 AYNC 迁移计划（默认 dry-run）——`lib/skills-naming.js`
  - 回迁件依赖修复：`lib/skills-indexer.js` 补导出 `ROOT`（即 REPO_ROOT，语义对齐本仓 SKILLS_HUB 解析）

### Changed

- 版本链归一：本仓 2.0.0（未发布态）→ 2.1.0，npm 2.0.0（Archive 误发血统）→ deprecated
- i18n 依赖归一：移除不可发布的 `file:` 协议依赖 `@yyc3/cli-integration`（private 包），实现 vendor 进仓，新增常规依赖 `glob ^14.0.3`
- `files` 白名单清理：移除不存在的 `templates/`，纳入 `CHANGELOG.md`
- lint 门禁修复：补 `.eslintrc.json`（此前 `npm run lint` 因无配置必败，`prepublishOnly` 连带必败）；lint 范围收束到发布本体 `bin lib`；回迁两文件为保逐字节血统豁免 no-unused-vars

### Fixed

- （随 main 线继承，首次随包发布）`skills-indexer` 折叠标量解析（agentskills.io 多行 description）与根路径越仓修正

## [2.0.0] - 2026-09-16（npm 误发版 · 建议弃用）

> ⚠️ 本条目记录的是 **npm 上的 2.0.0**（2026-09-16T15:02:45Z 发布，dist.shasum b5e3e708a676269d138f97265b5671318c9363db）。其内容为 YYC3-AI-Agent-Archive 副本血统的快照，**非本仓真值血统**：

- 缺失本仓真值功能：skills sync-core / i18n 命令组 / skills-sync.js / i18n.js 均不在包内
- tarball 独有文件（Archive 血统）：`skills-aync-index.js`、`skills-naming.js`（已于 2.1.0 逐字节回迁归一）
- 依赖态异常：`inquirer ^14.2.0` / `ora ^9.4.1`（Archive 线激进版本）与本仓保守线（inquirer ^8.2.6 / ora ^5.4.1）不一致
- 处置：以 `npm deprecate yyc3-cli@2.0.0` 标注误发血统并引导升级 2.1.0

[2.1.0]: https://github.com/YYC-Cube/YYC3-CLI/compare/v2.0.0...v2.1.0
[2.0.0]: https://github.com/YYC-Cube/YYC3-CLI/releases/tag/v2.0.0
