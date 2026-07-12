#!/usr/bin/env node

/**
 * @file yyc3-cli.js
 * @description YYC³ CLI 主入口点
 * @module cli/entry
 * @author YYC³
 * @version 2.0.0
 * @created 2025-01-30
 * @updated 2025-01-30
 * @copyright Copyright (c) 2025 YYC³
 * @license MIT
 */

const { program } = require('commander');
const pkg = require('../package.json');
const { initProject, deployProject, buildProject, runTests, configureSettings } = require('../lib/index');

// 设置全局错误处理
process.on('uncaughtException', (error) => {
  console.error(`\n🔴 未捕获的异常: ${error.message}`);
  console.error(`📋 堆栈跟踪:\n${error.stack}`);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error(`\n🔴 未处理的 Promise 拒绝: ${reason}`);
  process.exit(1);
});

program
  .name('yyc3')
  .version(pkg.version)
  .description('YYC³ 命令行界面 - 言启象限 | 语枢未来')
  .usage('<command> [options]')
  .helpOption('-h, --help', '显示帮助信息')
  .addHelpCommand('help [command]', '显示指定命令的帮助信息');

// init 命令
program
  .command('init [project-name]')
  .description('初始化新的 YYC³ 项目')
  .option('-t, --template <template>', '指定项目模板 (default: "basic")', 'basic')
  .option('-p, --port <port>', '指定服务端口 (default: 3200)', parseInt)
  .option('-y, --yes', '跳过确认提示', false)
  .action(async (projectName, options) => {
    try {
      await initProject(projectName, options);
      console.log(`\n✅ YYC³ 项目 "${projectName || '新项目'}" 初始化完成！`);
      console.log('🚀 开始你的 YYC³ 之旅：');
      console.log('   cd ' + (projectName || '新项目'));
      console.log('   npm run dev\n');
    } catch (error) {
      console.error(`\n🔴 初始化失败: ${error.message}`);
      process.exit(1);
    }
  });

// deploy 命令
program
  .command('deploy [environment]')
  .description('部署 YYC³ 应用到指定环境')
  .option('-e, --env <env>', '部署环境 (dev/staging/prod)', 'dev')
  .option('-f, --force', '强制部署（跳过检查）', false)
  .option('-c, --config <path>', '自定义配置文件路径')
  .action(async (environment, options) => {
    try {
      await deployProject(environment, options);
      console.log(`\n✅ 部署到 ${environment || options.env} 环境完成！`);
    } catch (error) {
      console.error(`\n🔴 部署失败: ${error.message}`);
      process.exit(1);
    }
  });

// build 命令
program
  .command('build')
  .description('构建 YYC³ 应用')
  .option('-m, --mode <mode>', '构建模式 (development/production)', 'production')
  .option('-o, --output <dir>', '输出目录', 'dist')
  .option('-a, --analyze', '启用包分析', false)
  .action(async (options) => {
    try {
      await buildProject(options);
      console.log('\n✅ 构建完成！');
    } catch (error) {
      console.error(`\n🔴 构建失败: ${error.message}`);
      process.exit(1);
    }
  });

// test 命令
program
  .command('test')
  .description('运行 YYC³ 测试套件')
  .option('-w, --watch', '监听模式', false)
  .option('-c, --coverage', '生成覆盖率报告', false)
  .option('-u, --update', '更新快照', false)
  .action(async (options) => {
    try {
      await runTests(options);
      console.log('\n✅ 测试运行完成！');
    } catch (error) {
      console.error(`\n🔴 测试失败: ${error.message}`);
      process.exit(1);
    }
  });

// config 命令
program
  .command('config')
  .description('配置 YYC³ 设置')
  .option('-g, --get <key>', '获取配置值')
  .option('-s, --set <key> <value>', '设置配置值')
  .option('-l, --list', '列出所有配置', false)
  .option('-r, --reset', '重置为默认配置', false)
  .action(async (options) => {
    try {
      await configureSettings(options);
      if (options.list) console.log('\n✅ 配置列表已显示');
      else if (options.get) console.log(`\n✅ 配置值获取成功`);
      else if (options.set) console.log(`\n✅ 配置设置成功`);
      else if (options.reset) console.log(`\n✅ 配置重置完成`);
    } catch (error) {
      console.error(`\n🔴 配置操作失败: ${error.message}`);
      process.exit(1);
    }
  });

// 默认命令（显示帮助）
program
  .command('help', { isDefault: true })
  .description('显示帮助信息')
  .action(() => {
    program.help();
  });

// 解析命令行参数
program.parse(process.argv);

// 如果没有提供任何参数，显示帮助
if (!process.argv.slice(2).length) {
  program.help();
}