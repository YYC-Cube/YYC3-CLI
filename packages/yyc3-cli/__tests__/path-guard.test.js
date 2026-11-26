const { execSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const { validateSafeName, ensureWithinRoot } = require('../lib/path-guard');

describe('path-guard: validateSafeName（穿越样本被拒 / 合法路径通过）', () => {
  describe('project 类（create 命令项目名）', () => {
    test.each([
      '../../escape',
      '..',
      '../..',
      'a/b',
      'a\\b',
      '/tmp/absolute',
      'foo/../bar',
      'foo.bar',
      '.hidden',
    ])('拒绝穿越样本: %s', (sample) => {
      expect(() => validateSafeName(sample, 'project')).toThrow();
    });

    test.each(['my-app', 'yyc3-cli-demo', 'app1'])('放行合法项目名: %s', (name) => {
      expect(validateSafeName(name, 'project')).toBe(name);
    });

    test('拒绝空名与非字符串', () => {
      expect(() => validateSafeName('', 'project')).toThrow();
      expect(() => validateSafeName('   ', 'project')).toThrow();
      expect(() => validateSafeName(undefined, 'project')).toThrow();
    });
  });

  describe('component 类（generate 命令组件名）', () => {
    test.each(['../../evil', 'x/y', 'x\\y', '..', 'comp/../x'])('拒绝穿越样本: %s', (sample) => {
      expect(() => validateSafeName(sample, 'component')).toThrow();
    });

    test.each(['YYHero', 'hero', 'my_comp-1'])('放行合法组件名: %s', (name) => {
      expect(validateSafeName(name, 'component')).toBe(name);
    });
  });

  describe('ensureWithinRoot', () => {
    const root = path.resolve('/tmp/yyc3-guard-root');

    test('根内相对路径放行', () => {
      expect(ensureWithinRoot('dist/out.json', root)).toBe(path.resolve(root, 'dist/out.json'));
    });

    test.each(['../escape', '/etc/passwd', 'a/../../escape'])('拒绝逃逸根目录: %s', (sample) => {
      expect(() => ensureWithinRoot(sample, root)).toThrow(/逃逸出允许根目录/);
    });
  });
});

describe('path-guard: CLI 端到端集成（create 命令）', () => {
  const cliPath = path.join(__dirname, '../bin/yyc3-cli.js');
  let workDir;
  let sandboxRoot;

  beforeEach(() => {
    sandboxRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'yyc3-guard-sandbox-'));
    workDir = path.join(sandboxRoot, 'work');
    fs.mkdirSync(workDir);
  });

  afterEach(() => {
    fs.rmSync(sandboxRoot, { recursive: true, force: true });
  });

  test('create app 带 ../../ 名称被拒绝且不产生仓外目录（含 --force 不得触发 removeSync）', () => {
    let failed = false;
    try {
      execSync(`node ${cliPath} create app ../../escaped --force`, {
        cwd: workDir,
        encoding: 'utf8',
        stdio: 'pipe',
      });
    } catch (error) {
      failed = true;
      const output = `${error.stdout || ''}${error.stderr || ''}`;
      expect(output).toContain('路径分隔符');
    }
    expect(failed).toBe(true);
    // 穿越落点（sandbox 根下，work 外）必须不存在
    expect(fs.existsSync(path.join(sandboxRoot, 'escaped'))).toBe(false);
  });

  test('create app 合法项目名正常创建', () => {
    const output = execSync(`node ${cliPath} create app legal-proj -t dashboard --skip-install`, {
      cwd: workDir,
      encoding: 'utf8',
      stdio: 'pipe',
    });
    expect(fs.existsSync(path.join(workDir, 'legal-proj'))).toBe(true);
    expect(output).toContain('legal-proj');
  });
});
