const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);
const fs = require('fs').promises;
const path = require('path');

describe('YYC3 CLI - Integration Tests', () => {
  const cliPath = path.join(__dirname, '../bin/yyc3-cli.js');

  test('CLI loads and responds to version', async () => {
    const { stdout } = await execPromise(`node ${cliPath} --version`);
    expect(stdout.trim()).toMatch(/^\d+\.\d+\.\d+$/);
  });

  test('CLI help shows available commands', async () => {
    const { stdout } = await execPromise(`node ${cliPath} --help`);
    expect(stdout).toContain('create');
    expect(stdout).toContain('generate');
    expect(stdout).toContain('status');
  });

  test('status command returns system info', async () => {
    const { stdout } = await execPromise(`node ${cliPath} status`);
    expect(stdout).toContain('Node.js');
  });

  test('unknown command returns error', async () => {
    await expect(execPromise(`node ${cliPath} xyz-nonexistent`)).rejects.toThrow();
  });
});
