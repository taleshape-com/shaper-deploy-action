#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

function getInput(name, options = {}) {
  const envName = `INPUT_${name.replace(/ /g, '_').toUpperCase()}`;
  const value = process.env[envName];
  if ((value === undefined || value === '') && options.required) {
    throw new Error(`Input required and not supplied: ${name}`);
  }
  return value !== undefined ? value : options.default;
}

function getAllDashboardFiles(dir, allFiles = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const name = path.join(dir, file);
    if (fs.statSync(name).isDirectory()) {
      getAllDashboardFiles(name, allFiles);
    } else if (file.endsWith('.dashboard.sql')) {
      allFiles.push(name);
    }
  }
  return allFiles;
}

function isGte(version, minVersion) {
  if (version === 'latest') return true;
  const v = version.split('-')[0].split('.').map(Number);
  const m = minVersion.split('-')[0].split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    if ((v[i] || 0) > (m[i] || 0)) return true;
    if ((v[i] || 0) < (m[i] || 0)) return false;
  }
  return true;
}

async function execCommand(command, args, cwd, env) {
  console.log(`Running: ${command} ${args.join(' ')} (cwd: ${cwd})`);
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
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
        reject(new Error(`${command} ${args[0]} exited with code ${code}`));
      }
    });
  });
}

async function run() {
  try {
    const apiKey = getInput('api-key');
    const shaperVersionInput = getInput('shaper-version', { default: 'latest' });
    const configFile = getInput('config-file', { default: './shaper.json' });
    const validateOnlyInput = getInput('validate-only', { default: 'false' });
    const workingDirectoryInput = getInput('working-directory', { default: '.' });
    const skipValidateInput = getInput('skip-validate', { default: 'false' });

    // Security: Validate shaper-version to prevent npx injection
    const shaperVersion = String(shaperVersionInput).trim();
    if (shaperVersion !== 'latest' && !/^\d+\.\d+\.\d+(?:-[\w\.]+)?$/.test(shaperVersion)) {
      throw new Error(`Invalid shaper-version: "${shaperVersion}". Must be "latest" or a valid semver (e.g., 0.20.0).`);
    }

    const validateOnly = String(validateOnlyInput).toLowerCase() === 'true';
    const skipValidate = String(skipValidateInput).toLowerCase();

    const workspace = process.env.GITHUB_WORKSPACE || process.cwd();
    const cwd = path.resolve(workspace, workingDirectoryInput || '.');

    const env = { ...process.env };
    if (apiKey && apiKey.trim() !== '') {
      env.SHAPER_DEPLOY_API_KEY = apiKey.trim();
    }

    const MIN_VALIDATE_VERSION = '0.20.0';
    const supportsValidate = isGte(shaperVersion, MIN_VALIDATE_VERSION);

    if (supportsValidate && skipValidate !== 'true') {
      const validateArgs = ['--yes', `@taleshape/shaper@${shaperVersion}`, 'validate'];
      if (configFile && configFile.trim() !== '') {
        validateArgs.push('--config', configFile.trim());
      }

      if (skipValidate !== 'false' && skipValidate !== '') {
        const excludedFiles = skipValidate.split(/[\s,]+/).map(f => path.resolve(cwd, f.trim()));
        const allFiles = getAllDashboardFiles(cwd);
        const filesToValidate = allFiles.filter(f => !excludedFiles.includes(path.resolve(f)));

        if (filesToValidate.length > 0) {
          validateArgs.push(...filesToValidate.map(f => path.relative(cwd, f)));
        } else {
          console.log('No files left to validate after exclusions. Skipping validation.');
        }
      }

      if (skipValidate === 'false' || skipValidate === '' || validateArgs.length > 3) {
        await execCommand('npx', validateArgs, cwd, env);
      }
    }

    if (validateOnly) {
      const deployArgs = ['--yes', `@taleshape/shaper@${shaperVersion}`, 'deploy', '--validate-only'];
      if (configFile && configFile.trim() !== '') {
        deployArgs.push('--config', configFile.trim());
      }
      await execCommand('npx', deployArgs, cwd, env);
      return;
    }

    const deployArgs = ['--yes', `@taleshape/shaper@${shaperVersion}`, 'deploy'];
    if (configFile && configFile.trim() !== '') {
      deployArgs.push('--config', configFile.trim());
    }

    await execCommand('npx', deployArgs, cwd, env);
  } catch (error) {
    console.error(error.message || error);
    process.exit(1);
  }
}

run();
