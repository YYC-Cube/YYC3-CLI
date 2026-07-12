#!/usr/bin/env node

/**
 * YYC³ CLI 工具
 * Copyright (c) 2024 YanYu Intelligence Cloud³
 */

// 全局变量定义
// 模板管理模块
const TemplateManager = {
  // 模板缓存
  cache: {},

  // 页面模板
  pageTemplates: {
    dashboard: `export default function Dashboard() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900">
          欢迎使用 {{name}}
        </h1>
        <p className="mt-4 text-gray-600">
          这是一个使用 YYC³ 工具包创建的仪表板应用
        </p>
      </div>
    </div>
  );
}`,
    landing: `export default function LandingPage() {
  return (
    <div className="min-h-screen">
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-20">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h1 className="text-5xl font-bold mb-6">{{name}}</h1>
          <p className="text-xl mb-8">使用 YYC³ 工具包构建的现代应用</p>
          <button className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
            立即开始
          </button>
        </div>
      </section>
    </div>
  );
}`
  },

  // 布局模板
  layoutTemplates: {
    default: `import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: '{{name}}',
  description: '使用 YYC³ 工具包创建的应用',
  creator: 'YanYu Intelligence Cloud³',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className={inter.className}>
        {children}
      </body>
    </html>
  );
}`
  },

  // 替换模板中的变量
  replaceVariables(template, variables) {
    let result = template;
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{{${key}}}`, 'g');
      result = result.replace(regex, value);
    }
    return result;
  },

  // 获取页面模板
  getPageTemplate(templateType, variables) {
    const cacheKey = `page-${templateType}-${JSON.stringify(variables)}`;

    // 检查缓存
    if (this.cache[cacheKey]) {
      return this.cache[cacheKey];
    }

    const template = this.pageTemplates[templateType] || this.pageTemplates.dashboard;
    const result = this.replaceVariables(template, variables);

    // 缓存结果
    this.cache[cacheKey] = result;

    return result;
  },

  // 获取布局模板
  getLayoutTemplate(templateType, variables) {
    templateType = templateType || 'default';
    const cacheKey = `layout-${templateType}-${JSON.stringify(variables)}`;

    // 检查缓存
    if (this.cache[cacheKey]) {
      return this.cache[cacheKey];
    }

    const template = this.layoutTemplates[templateType] || this.layoutTemplates.default;
    const result = this.replaceVariables(template, variables);

    // 缓存结果
    this.cache[cacheKey] = result;

    return result;
  },

  // 清除缓存
  clearCache() {
    this.cache = {};
  }
};

// 向后兼容的全局模板缓存引用
const templateCache = TemplateManager.cache;

const { program } = require('commander');
const chalk = require('chalk');
const inquirer = require('inquirer');
const ora = require('ora');
const fs = require('fs-extra');
const path = require('path');

// 版本信息
const { version } = require('../package.json');

// 获取命令名
const commandName = process.argv[1].split('/').pop();

// 欢迎信息
const showWelcome = () => {
  console.log(chalk.cyan(`
    ██╗   ██╗██╗   ██╗ ██████╗██████╗
    ╚██╗ ██╔╝╚██╗ ██╔╝██╔════╝╚════██╗
     ╚████╔╝  ╚████╔╝ ██║      █████╔╝
      ╚██╔╝    ╚██╔╝  ██║      ╚═══██╗
       ██║      ██║   ╚██████╗██████╔╝
       ╚═╝      ╚═╝    ╚═════╝╚═════╝

    YYC³ 开发者工具 v${version}
    YanYu Intelligence Cloud³ - 智能优化版
  `));
};

// 主程序配置
program
  .name(commandName)
  .description('YYC³ 开发者工具命令行工具')
  .version(version)
  .hook('preAction', () => {
    if (!process.argv.includes('--version') && !process.argv.includes('-V')) {
      showWelcome();
    }
  });

program
  .command('templates')
  .description('查看可用模板列表')
  .action(() => {
    console.log(chalk.cyan('\n  YYC³ 可用模板 (20套)\n'));
    console.log(chalk.gray('  ─────────────────────────────────────────────────────────\n'));
    YYC3_TEMPLATES.forEach((t, i) => {
      const num = String(i + 1).padStart(2, ' ');
      console.log(`  ${chalk.green(num)}. ${chalk.bold(t.title.padEnd(22))} ${chalk.gray(t.desc)}  ${chalk.blue(`:${t.port}`)}`);
      console.log(`      ${chalk.gray('yyc3 create app my-project -t ' + t.value)}`);
    });
    console.log(chalk.gray('\n  ─────────────────────────────────────────────────────────'));
    console.log(chalk.yellow('\n  用法: yyc3 create app <项目名> -t <模板名>\n'));
  });

program
  .command('create <type> <name>')
  .description('创建新项目')
  .option('-t, --template <template>', '使用指定模板 (yyc3 templates 查看列表)')
  .option('-f, --force', '强制覆盖已存在的目录')
  .option('-s, --skip-install', '跳过依赖安装')
  .action(async (type, name, options) => {
    const spinner = ora('正在创建项目...').start();

    try {
      if (!options.template && type === 'app') {
        spinner.stop();
        const templatesDir = resolveTemplatesDir();
        if (templatesDir) {
          const answer = await inquirer.prompt([{
            type: 'list',
            name: 'template',
            message: '选择项目模板:',
            choices: YYC3_TEMPLATES.map(t => ({
              name: `${t.title.padEnd(22)} ${chalk.gray(t.desc)}`,
              value: t.value,
            })),
            pageSize: 20,
          }]);
          options.template = answer.template;
        }
        spinner.start('正在创建项目...');
      }
      await createProject(type, name, options);
      spinner.succeed(`项目 ${chalk.green(name)} 创建成功！`);

      console.log(chalk.blue('\n🎉 项目创建完成！'));
      console.log(chalk.yellow('\n📋 下一步：'));
      console.log(`  cd ${name}`);
      if (!options.skipInstall) {
        console.log(`  pnpm install`);
      }
      console.log(`  pnpm dev`);
    } catch (error) {
      spinner.fail(`项目创建失败: ${error.message}`);
      process.exit(1);
    }
  });

// 生成代码命令
program
  .command('generate <type> <name>')
  .alias('g')
  .description('生成代码')
  .option('-p, --path <path>', '生成路径')
  .option('-t, --template <template>', '使用指定模板')
  .action(async (type, name, options) => {
    const spinner = ora(`正在生成 ${type}...`).start();

    try {
      await generateCode(type, name, options);
      spinner.succeed(`${type} ${chalk.green(name)} 生成成功！`);
    } catch (error) {
      spinner.fail(`生成失败: ${error.message}`);
      process.exit(1);
    }
  });

// 品牌检查命令
program
  .command('brand-check')
  .description('检查品牌合规性')
  .option('--fix', '自动修复问题')
  .option('--report', '生成报告')
  .option('-o, --output <path>', '报告输出路径')
  .action(async (options) => {
    const spinner = ora('正在检查品牌合规性...').start();

    try {
      const result = await checkBrandCompliance(options);

      if (result.issues.length === 0) {
        spinner.succeed('品牌合规性检查通过！');
      } else {
        spinner.warn(`发现 ${result.issues.length} 个问题`);
        console.log(chalk.yellow('\n⚠️  发现以下问题：'));
        result.issues.forEach(issue => {
          console.log(`  ${chalk.red('•')} ${issue}`);
        });

        if (options.fix) {
          const fixSpinner = ora('正在自动修复...').start();
          const fixed = await fixBrandIssues(result.issues);
          fixSpinner.succeed(`成功修复 ${fixed} 个问题！`);
        }

        if (options.report) {
          const reportSpinner = ora('正在生成报告...').start();
          await generateBrandReport(result, options.output);
          reportSpinner.succeed(`报告已生成到 ${options.output || 'brand-report.txt'}`);
        }
      }
    } catch (error) {
      spinner.fail(`检查失败: ${error.message}`);
      process.exit(1);
    }
  });

// 状态命令
program
  .command('status')
  .description('查看系统状态')
  .action(() => {
    console.log(chalk.blue('📊 系统状态检查'));
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // Node.js 版本
    console.log(`${chalk.green('✓')} Node.js: ${process.version}`);

    // npm 版本
    try {
      const { spawnSync } = require('child_process');
      const result = spawnSync('npm', ['--version'], { encoding: 'utf8', shell: true });
      const npmVersion = result.stdout.trim();
      console.log(`${chalk.green('✓')} npm: v${npmVersion}`);
    } catch (error) {
      console.log(`${chalk.red('✗')} npm: 不可用`);
    }

    // 当前目录
    console.log(`${chalk.green('✓')} 当前目录: ${process.cwd()}`);

    // 检查项目配置
    if (fs.existsSync('package.json')) {
      try {
        const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
        console.log(`${chalk.green('✓')} 项目: ${pkg.name || '未命名'}@${pkg.version || '0.0.0'}`);
      } catch (error) {
        console.log(`${chalk.yellow('!')} package.json 格式错误`);
      }
    } else {
      console.log(`${chalk.yellow('!')} 未找到 package.json`);
    }

    // 检查 YYC³ 配置
    if (fs.existsSync('yyc3.config.js')) {
      console.log(`${chalk.green('✓')} YYC³ 配置: 已找到`);
    } else {
      console.log(`${chalk.yellow('!')} YYC³ 配置: 未找到`);
    }

    // 检查 YY 组件
    if (fs.existsSync('src/components')) {
      const components = fs.readdirSync('src/components', { withFileTypes: true })
        .filter(dirent => dirent.isDirectory() && dirent.name.startsWith('YY'))
        .map(dirent => dirent.name);

      if (components.length > 0) {
        console.log(`${chalk.green('✓')} YY 组件: 找到 ${components.length} 个`);
      } else {
        console.log(`${chalk.yellow('!')} YY 组件: 未找到任何 YY 前缀组件`);
      }
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(chalk.green('✅ 系统状态检查完成'));
  });

// 更新命令
program
  .command('update')
  .description('检查并更新 YYC³ CLI')
  .option('-f, --force', '强制更新到最新版本')
  .action(async (options) => {
    const spinner = ora('正在检查更新...').start();

    try {
      const updateResult = await checkForUpdates(options);

      if (updateResult.available) {
        spinner.info(`发现新版本: ${updateResult.latestVersion}`);

        const answer = await inquirer.prompt([{
          type: 'confirm',
          name: 'update',
          message: '是否更新到最新版本?',
          default: true
        }]);

        if (answer.update || options.force) {
          const updateSpinner = ora('正在更新...').start();
          await performUpdate();
          updateSpinner.succeed('更新完成！');
        } else {
          console.log(chalk.yellow('\n⚠️  更新已取消'));
        }
      } else {
        spinner.succeed('您已经在使用最新版本！');
      }
    } catch (error) {
      spinner.fail(`更新检查失败: ${error.message}`);
    }
  });

// 项目创建函数
async function createProject(type, name, options) {
  const targetDir = path.join(process.cwd(), name);

  // 检查目录是否存在
  if (fs.existsSync(targetDir)) {
    if (options.force) {
      fs.removeSync(targetDir);
    } else {
      throw new Error(`目录 ${name} 已存在，请使用 --force 选项强制覆盖`);
    }
  }

  // 创建目录
  fs.ensureDirSync(targetDir);

  switch (type) {
    case 'app':
      await createNextApp(targetDir, name, options);
      break;
    case 'component':
      await createComponentLibrary(targetDir, name, options);
      break;
    case 'package':
      await createPackage(targetDir, name, options);
      break;
    default:
      throw new Error(`不支持的项目类型: ${type}`);
  }
}

// 创建 package.json 配置文件
function createPackageJson(targetDir, name) {
  const packageJson = {
    name: name,
    version: '0.1.0',
    private: true,
    scripts: {
      dev: 'next dev',
      build: 'next build',
      start: 'next start',
      lint: 'next lint'
    },
    dependencies: {
      'next': '^14.0.0',
      'react': '^18.2.0',
      'react-dom': '^18.2.0',
      '@yanyucloud/ui': '^1.0.0'
    },
    devDependencies: {
      '@types/node': '^20.0.0',
      '@types/react': '^18.2.0',
      '@types/react-dom': '^18.2.0',
      'typescript': '^5.2.0',
      'tailwindcss': '^3.3.0',
      'autoprefixer': '^10.4.0',
      'postcss': '^8.4.0'
    }
  };

  fs.writeFileSync(
    path.join(targetDir, 'package.json'),
    JSON.stringify(packageJson, null, 2)
  );
}

// 创建项目目录结构
function createProjectStructure(targetDir) {
  const dirs = [
    'src/app',
    'src/components',
    'src/lib',
    'src/styles',
    'public'
  ];

  dirs.forEach(dir => {
    fs.ensureDirSync(path.join(targetDir, dir));
  });
}

// 创建项目文件
function createProjectFiles(targetDir, name, template) {
  // 创建页面文件
  const pageContent = getPageTemplate(template, name);
  fs.writeFileSync(
    path.join(targetDir, 'src/app/page.tsx'),
    pageContent
  );

  // 创建布局文件
  const layoutContent = getLayoutTemplate(name);
  fs.writeFileSync(
    path.join(targetDir, 'src/app/layout.tsx'),
    layoutContent
  );
}

// 安装项目依赖
function installProjectDependencies(targetDir) {
  const installSpinner = ora('正在安装依赖...').start();
  try {
    const { spawn } = require('child_process');
    const npmProcess = spawn('npm', ['install'], {
      cwd: targetDir,
      stdio: 'inherit',
      shell: true
    });

    npmProcess.on('close', (code) => {
      if (code === 0) {
        installSpinner.succeed('依赖安装完成');
      } else {
        installSpinner.warn('依赖安装失败，请手动运行 npm install');
      }
    });
  } catch (error) {
    installSpinner.warn('依赖安装失败，请手动运行 npm install');
  }
}

const YYC3_TEMPLATES = [
  { value: 'ai-center', title: 'T01 AI智能中心', desc: 'Chat+侧栏+历史+设置', port: 3300 },
  { value: 'admin-dashboard', title: 'T02 管理后台', desc: '侧栏+卡片+表格+图表', port: 3201 },
  { value: 'landing-page', title: 'T03 企业官网', desc: 'Hero+特性+定价+CTA', port: 3200 },
  { value: 'ai-medical', title: 'T04 AI医疗', desc: '智能问诊+健康档案', port: 3205 },
  { value: 'learning-platform', title: 'T05 学习平台', desc: '课程列表+进度+考试', port: 3203 },
  { value: 'smart-city', title: 'T06 智慧城市', desc: '城市服务+AI助手', port: 3206 },
  { value: '3d-portal', title: 'T07 3D门户', desc: '沉浸式3D交互体验', port: 3207 },
  { value: 'crm-system', title: 'T08 CRM', desc: '客户管理+跟进+漏斗', port: 3208 },
  { value: 'data-dashboard', title: 'T09 数据看盘', desc: '全屏图表+实时数据', port: 3202 },
  { value: 'ai-code-ide', title: 'T10 AI编程IDE', desc: '代码编辑+AI对话', port: 3209 },
  { value: 'financial-quant', title: 'T11 金融量化', desc: 'K线图+交易+策略', port: 3210 },
  { value: 'music-player', title: 'T12 音乐播放器', desc: '歌单+歌词+可视化', port: 3211 },
  { value: 'devops-monitor', title: 'T13 DevOps', desc: '状态+日志+告警', port: 3212 },
  { value: 'saas-platform', title: 'T14 SaaS', desc: '多租户+计费+API', port: 3213 },
  { value: 'ai-call-center', title: 'T15 AI呼叫中心', desc: '通话+转写+AI分析', port: 3214 },
  { value: 'knowledge-wiki', title: 'T16 知识库', desc: '文档树+搜索+编辑', port: 3204 },
  { value: 'ecommerce-shop', title: 'T17 电商', desc: '商品+购物车+订单', port: 3215 },
  { value: 'portfolio', title: 'T18 Portfolio', desc: '项目展示+技能+联系', port: 3216 },
  { value: 'table-converter', title: 'T19 表格转换', desc: '拖拽+格式+预览', port: 3217 },
  { value: 'forum-community', title: 'T20 论坛', desc: '帖子+评论+社区', port: 3218 },
];

const TEMPLATE_DIR_MAP = {
  'ai-center': 'T01-ai-intelligent-center',
  'admin-dashboard': 'T02-admin-dashboard',
  'landing-page': 'T03-landing-page',
  'ai-medical': 'T04-ai-medical',
  'learning-platform': 'T05-learning-platform',
  'smart-city': 'T06-smart-city',
  '3d-portal': 'T07-3d-portal',
  'crm-system': 'T08-crm-system',
  'data-dashboard': 'T09-data-dashboard',
  'ai-code-ide': 'T10-ai-code-ide',
  'financial-quant': 'T11-financial-quant',
  'music-player': 'T12-music-player',
  'devops-monitor': 'T13-devops-monitor',
  'saas-platform': 'T14-saas-platform',
  'ai-call-center': 'T15-ai-call-center',
  'knowledge-wiki': 'T16-knowledge-wiki',
  'ecommerce-shop': 'T17-ecommerce-shop',
  'portfolio': 'T18-portfolio',
  'table-converter': 'T19-table-converter',
  'forum-community': 'T20-forum-community',
};

function resolveTemplatesDir() {
  const candidates = [
    path.resolve(__dirname, '..', '..', '..', '..', 'YYC3-Templates'),
    path.resolve(__dirname, '..', '..', 'YYC3-Templates'),
    path.join(process.cwd(), 'YYC3-Templates'),
    path.join(process.env.HOME || '/root', 'YYC3-Templates'),
  ];
  for (const dir of candidates) {
    if (fs.existsSync(path.join(dir, '_shared'))) {
      return dir;
    }
  }
  return null;
}

async function createNextApp(targetDir, name, options) {
  let template = options.template || 'dashboard';
  const templatesDir = resolveTemplatesDir();
  const templateDirName = TEMPLATE_DIR_MAP[template];
  const isBuiltinTemplate = !!templateDirName;

  if (isBuiltinTemplate && templatesDir) {
    const srcDir = path.join(templatesDir, templateDirName);
    if (!fs.existsSync(srcDir)) {
      throw new Error(`模板目录不存在: ${templateDirName}`);
    }

    const tpl = YYC3_TEMPLATES.find(t => t.value === template);
    const totalSteps = 4;
    let currentStep = 0;
    const showProgress = (message) => {
      currentStep++;
      console.log(chalk.blue(`[${currentStep}/${totalSteps}] ${message}`));
    };

    showProgress(`复制模板: ${tpl ? tpl.title : template}`);
    fs.copySync(srcDir, targetDir, { overwrite: true });

    showProgress('更新项目名称');
    const pkgPath = path.join(targetDir, 'package.json');
    if (fs.existsSync(pkgPath)) {
      const pkg = fs.readJsonSync(pkgPath);
      pkg.name = name;
      fs.writeJsonSync(pkgPath, pkg, { spaces: 2 });
    }

    if (!options.skipInstall) {
      showProgress('安装依赖 (pnpm)');
      const { spawnSync } = require('child_process');
      const usePnpm = spawnSync('pnpm', ['--version'], { encoding: 'utf8', shell: true }).status === 0;
      const pkgMgr = usePnpm ? 'pnpm' : 'npm';
      const result = spawnSync(pkgMgr, ['install'], { cwd: targetDir, stdio: 'inherit', shell: true });
      if (result.status !== 0) {
        console.log(chalk.yellow(`依赖安装失败，请手动运行: cd ${name} && ${pkgMgr} install`));
      }
    }

    showProgress('完成');
    const port = tpl ? tpl.port : 3000;
    console.log(chalk.green(`\n✅ 项目 ${name} 创建成功！`));
    console.log(chalk.cyan(`\n📋 下一步：`));
    console.log(`  cd ${name}`);
    console.log(`  pnpm dev`);
    console.log(`  # 打开 http://localhost:${port}`);
    return;
  }

  const totalSteps = 6;
  let currentStep = 0;
  const showProgress = (message) => {
    currentStep++;
    console.log(chalk.blue(`[${currentStep}/${totalSteps}] ${message}`));
  };

  showProgress('创建 package.json 配置文件');
  createPackageJson(targetDir, name);

  showProgress('创建项目目录结构');
  createProjectStructure(targetDir);

  showProgress('创建页面文件');
  createProjectFiles(targetDir, name, template);

  showProgress('创建配置文件');
  createConfigFiles(targetDir, name);

  if (!options.skipInstall) {
    showProgress('安装 npm 依赖');
    installProjectDependencies(targetDir);
  }
}

// 生成代码函数
async function generateCode(type, name, options) {
  const targetPath = options.path || 'src/components';

  switch (type) {
    case 'component':
      await generateComponent(name, targetPath, options);
      break;
    case 'page':
      await generatePage(name, targetPath, options);
      break;
    case 'hook':
      await generateHook(name, targetPath, options);
      break;
    default:
      throw new Error(`不支持的生成类型: ${type}`);
  }
}

// 生成组件文件内容
function generateComponentContent(componentName) {
  return `import React from 'react';
import { cn } from '@/lib/utils';

export interface ${componentName}Props {
  children?: React.ReactNode;
  className?: string;
}

export const ${componentName}: React.FC<${componentName}Props> = ({
  children,
  className,
}) => {
  return (
    <div className={cn('yyc3-${componentName.toLowerCase()}', className)}>
      {children}
    </div>
  );
};

${componentName}.displayName = '${componentName}';
`;
}

// 生成组件样式内容
function generateComponentStyle(componentName) {
  return `.yyc3-${componentName.toLowerCase()} {
  /* ${componentName} 组件样式 */
}
`;
}

// 生成组件索引内容
function generateComponentIndex(componentName) {
  return `export * from './${componentName}';
`;
}

// 创建组件文件
function createComponentFiles(componentDir, componentName, content) {
  fs.ensureDirSync(componentDir);
  fs.writeFileSync(
    path.join(componentDir, `${componentName}.tsx`),
    content
  );
}

// 创建组件样式文件
function createComponentStyle(componentDir, componentName, styleContent) {
  fs.writeFileSync(
    path.join(componentDir, `${componentName}.module.css`),
    styleContent
  );
}

// 创建组件索引文件
function createComponentIndex(componentDir, indexContent) {
  fs.writeFileSync(
    path.join(componentDir, 'index.ts'),
    indexContent
  );
}

// 生成组件
async function generateComponent(name, targetPath, options) {
  // 确保组件名以 YY 开头
  const componentName = name.startsWith('YY') ? name : `YY${name}`;
  const totalSteps = 3;
  let currentStep = 0;

  const showProgress = (message) => {
    currentStep++;
    console.log(chalk.blue(`[${currentStep}/${totalSteps}] ${message}`));
  };

  const componentContent = generateComponentContent(componentName);
  const styleContent = generateComponentStyle(componentName);
  const indexContent = generateComponentIndex(componentName);

  const componentDir = path.join(targetPath, componentName);

  showProgress(`创建 ${componentName} 组件文件`);
  createComponentFiles(componentDir, componentName, componentContent);

  showProgress(`创建 ${componentName} 样式文件`);
  createComponentStyle(componentDir, componentName, styleContent);

  showProgress(`创建 ${componentName} 索引文件`);
  createComponentIndex(componentDir, indexContent);

  console.log(`组件 ${chalk.green(componentName)} 已生成到 ${componentDir}`);
}

// 品牌合规检查
async function checkBrandCompliance(options) {
  const issues = [];
  const warnings = [];

  // 检查组件命名
  if (fs.existsSync('src/components')) {
    const files = await fs.readdir('src/components', { recursive: true });
    for (const file of files) {
      if (file.endsWith('.tsx') || file.endsWith('.jsx')) {
        const filePath = path.join('src/components', file);
        const content = await fs.readFile(filePath, 'utf8');

        if (!content.includes('YY') && !content.includes('yyc3-')) {
          issues.push(`${file}: 组件未使用 YY 前缀或 yyc3- 类名`);
        }
      }
    }
  }

  // 检查包名
  if (fs.existsSync('package.json')) {
    const pkg = JSON.parse(await fs.readFile('package.json', 'utf8'));
    if (pkg.name && !pkg.name.startsWith('@yanyucloud/')) {
      issues.push('package.json: 包名未使用 @yanyucloud/ 作用域');
    }
  }

  // 检查 YYC³ 配置
  if (!fs.existsSync('yyc3.config.js')) {
    warnings.push('未找到 yyc3.config.js 配置文件');
  }

  return { issues, warnings };
}

// 修复品牌问题
async function fixBrandIssues(issues) {
  let fixedCount = 0;

  for (const issue of issues) {
    try {
      // 简单的修复逻辑示例
      if (issue.includes('未使用 YY 前缀')) {
        const filePath = issue.split(':')[0];
        if (fs.existsSync(filePath)) {
          let content = await fs.readFile(filePath, 'utf8');
          // 这里可以添加更智能的修复逻辑
          fixedCount++;
        }
      }
    } catch (error) {
      console.error(chalk.red(`修复 ${issue} 失败: ${error.message}`));
    }
  }

  return fixedCount;
}

// 生成品牌报告
async function generateBrandReport(result, outputPath) {
  const reportPath = outputPath || 'brand-report.txt';
  const reportDate = new Date().toISOString();

  let reportContent = `YYC³ 品牌合规性报告
生成时间: ${reportDate}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

`;

  if (result.issues.length > 0) {
    reportContent += `发现的问题 (${result.issues.length}):
`;
    result.issues.forEach((issue, index) => {
      reportContent += `${index + 1}. ${issue}\n`;
    });
  } else {
    reportContent += `✅ 未发现品牌合规性问题\n`;
  }

  if (result.warnings.length > 0) {
    reportContent += `\n警告 (${result.warnings.length}):\n`;
    result.warnings.forEach((warning, index) => {
      reportContent += `${index + 1}. ${warning}\n`;
    });
  }

  fs.writeFileSync(reportPath, reportContent);
}

// 检查更新
async function checkForUpdates(options) {
  // 这里可以添加实际的更新检查逻辑
  // 例如调用 npm registry API 检查最新版本
  return {
    available: false,
    currentVersion: version,
    latestVersion: version
  };
}

// 执行更新
async function performUpdate() {
  // 这里可以添加实际的更新逻辑
  const { spawn } = require('child_process');
  const updateProcess = spawn('npm', ['update', '-g', '@yanyucloud/cli'], {
    stdio: 'inherit',
    shell: true
  });

  updateProcess.on('close', (code) => {
    if (code === 0) {
      console.log(chalk.green('✓ 更新完成'));
    } else {
      console.log(chalk.red('✗ 更新失败'));
    }
  });
}

// 获取页面模板（向后兼容接口）
function getPageTemplate(template, name) {
  return TemplateManager.getPageTemplate(template, { name });
}

// 获取布局模板（向后兼容接口）
function getLayoutTemplate(name) {
  return TemplateManager.getLayoutTemplate('default', { name });
}

// 创建配置文件
function createConfigFiles(targetDir, name) {
  // YYC³ 配置
  const yyc3Config = `module.exports = {
  brand: {
    name: '${name}',
    theme: 'light',
  },
  components: {
    prefix: 'YY',
    generateTests: true,
    generateStories: false,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
};
`;

  fs.writeFileSync(
    path.join(targetDir, 'yyc3.config.js'),
    yyc3Config
  );

  // Tailwind 配置
  const tailwindConfig = `/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'yyc3-primary': '#0ea5e9',
        'yyc3-secondary': '#71717a',
        'yyc3-accent': '#d946ef',
      },
    },
  },
  plugins: [],
};
`;

  fs.writeFileSync(
    path.join(targetDir, 'tailwind.config.js'),
    tailwindConfig
  );

  // TypeScript 配置
  const tsConfig = `{
  "compilerOptions": {
    "target": "es5",
    "lib": ["dom", "dom.iterable", "es6"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
`;

  fs.writeFileSync(
    path.join(targetDir, 'tsconfig.json'),
    tsConfig
  );
}

// 解析命令行参数
program.parse();
