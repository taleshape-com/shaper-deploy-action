#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

function getInput(name, options = {}) {
  const envName = `INPUT_${name.replace(/ /g, '_').toUpperCase()}`;
  const value = process.env[envName];
  if ((value === undefined || value === '') && options.required) {
    throw new Error(`Input required and not supplied: ${name}`);
  }
  return value !== undefined ? value : options.default;
}

async function run() {
  try {
    const apiKey = getInput('api-key');
    const shaperVersion = getInput('shaper-version', { default: 'latest' });
    const configFile = getInput('config-file', { default: './shaper.json' });
    const validateOnlyInput = getInput('validate-only', { default: 'false' });
    const workingDirectoryInput = getInput('working-directory', { default: '.' });

    const validateOnly = String(validateOnlyInput).toLowerCase() === 'true';

    const workspace = process.env.GITHUB_WORKSPACE || process.cwd();
    const cwd = path.resolve(workspace, workingDirectoryInput || '.');

    const env = { ...process.env };
    if (apiKey && apiKey.trim() !== '') {
      env.SHAPER_DEPLOY_API_KEY = apiKey.trim();
    }

    const npxArgs = ['--yes', `@taleshape/shaper@${shaperVersion || 'latest'}`, 'deploy'];

    if (configFile && configFile.trim() !== '') {
      npxArgs.push('--config', configFile.trim());
    }

    if (validateOnly) {
      npxArgs.push('--validate-only');
    }

    console.log(`Running: npx ${npxArgs.join(' ')} (cwd: ${cwd})`);

    await new Promise((resolve, reject) => {
      const child = spawn('npx', npxArgs, {
        cwd,
        env,
        stdio: 'inherit',
      });

      child.on('error', (err) => {
        reject(err);
      });

      child.on('exit', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`shaper deploy exited with code ${code}`));
        }
      });
    });
  } catch (error) {
    console.error(error.message || error);
    process.exit(1);
  }
}

run();
