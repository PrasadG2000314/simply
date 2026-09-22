const fs = require('fs');
const path = require('path');

const targetInput = (process.argv[2] || '').toLowerCase();

if (!['development', 'dev', 'production', 'prod'].includes(targetInput)) {
  console.error('❌ Usage: node scripts/switch-env.js <dev|prod|development|production>');
  process.exit(1);
}

const isDev = targetInput === 'development' || targetInput === 'dev';
const targetEnv = isDev ? 'DEVELOPMENT' : 'PRODUCTION';

console.log(`\n🔄 Switching environment to: ${targetEnv}...`);

const copyFile = (src, dest) => {
  const rootDir = path.resolve(__dirname, '..');
  const srcPath = path.join(rootDir, src);
  const destPath = path.join(rootDir, dest);

  if (!fs.existsSync(srcPath)) {
    console.warn(`⚠️  Warning: Source file not found: ${src}`);
    return;
  }

  fs.copyFileSync(srcPath, destPath);
  console.log(`  ✓ Copied ${src} -> ${dest}`);
};

if (isDev) {
  copyFile('.env.development', '.env');
  copyFile('backend/.env.development', 'backend/.env');
  copyFile('frontend/.env.development', 'frontend/.env.local');
} else {
  copyFile('.env.production', '.env');
  copyFile('backend/.env.production', 'backend/.env');
  copyFile('frontend/.env.production', 'frontend/.env.local');
}

console.log(`\n✅ Successfully configured active files for ${targetEnv} environment!\n`);
