const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

describe('YYC3 CLI - Core Tests', () => {
  const cliPath = path.join(__dirname, '../bin/yyc3-cli.js');

  test('CLI version check', () => {
    const output = execSync(`node ${cliPath} --version`, { encoding: 'utf8' }).trim();
    expect(output).toMatch(/^\d+\.\d+\.\d+$/);
  });

  test('CLI help output', () => {
    const output = execSync(`node ${cliPath} --help`, { encoding: 'utf8' });
    expect(output).toContain('command');
    expect(output).toContain('create');
    expect(output).toContain('generate');
    expect(output).toContain('status');
  });

  test('status command runs without error', () => {
    const output = execSync(`node ${cliPath} status`, { encoding: 'utf8' });
    expect(output).toContain('Node.js');
  });

  test('unknown command shows error', () => {
    try {
      execSync(`node ${cliPath} nonexistent-command`, { encoding: 'utf8', stdio: 'pipe' });
    } catch (error) {
      expect(error.status).not.toBe(0);
    }
  });
});

describe('YYC3 CLI - Package Configuration', () => {
  test('package.json is valid', () => {
    const packageJson = require('../package.json');

    expect(packageJson.name).toBe('yyc3-cli');
    expect(packageJson.version).toMatch(/^\d+\.\d+\.\d+$/);
    expect(packageJson.bin).toBeDefined();
    expect(packageJson.scripts).toHaveProperty('test');
    expect(packageJson.scripts).toHaveProperty('build');
    expect(packageJson.license).toBe('MIT');
  });

  test('project structure is complete', () => {
    const requiredFiles = [
      'package.json',
      'bin/yyc3-cli.js',
      'lib/index.js',
    ];

    requiredFiles.forEach(file => {
      const filePath = path.join(__dirname, '..', file);
      expect(fs.existsSync(filePath)).toBeTruthy();
    });
  });
});
