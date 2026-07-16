const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const frontendDir = path.join(__dirname, 'frontend');

// Remove broken node_modules
const nmPath = path.join(frontendDir, 'node_modules');
if (fs.existsSync(nmPath)) {
  console.log('Removing broken node_modules...');
  fs.rmSync(nmPath, { recursive: true, force: true });
}
const lockPath = path.join(frontendDir, 'package-lock.json');
if (fs.existsSync(lockPath)) fs.rmSync(lockPath);

console.log('Installing packages one by one...');

const packages = [
  // core
  'react@18.3.1',
  'react-dom@18.3.1',
  // vite + plugins
  'vite@5.3.1',
  '@vitejs/plugin-react@4.3.1',
  // css
  'tailwindcss@3.4.4',
  'postcss@8.4.38',
  'autoprefixer@10.4.19',
  // ui libs
  'react-dropzone@14.2.3',
  'react-icons@5.3.0',
  'react-toastify@10.0.5',
];

for (const pkg of packages) {
  console.log(`  Installing ${pkg}...`);
  try {
    execSync(`npm install ${pkg} --no-audit --no-fund --legacy-peer-deps`, {
      cwd: frontendDir,
      stdio: 'pipe',
      timeout: 120000,
    });
    console.log(`  ✓ ${pkg}`);
  } catch (e) {
    console.error(`  ✗ ${pkg}: ${e.message.substring(0, 100)}`);
  }
}

// Verify
console.log('\nVerifying...');
const checks = ['react', 'vite', 'tailwindcss', 'react-toastify'];
for (const c of checks) {
  const exists = fs.existsSync(path.join(nmPath, c));
  console.log(`  ${exists ? '✓' : '✗'} ${c}`);
}

console.log('\nDone!');
