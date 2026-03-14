const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

try {
  // Only run on macOS and Linux (EAS Builder)
  if (process.platform === 'win32') process.exit(0);

  const OS_NAMES = ['linux64-bin', 'osx-bin'];
  
  for (const osName of OS_NAMES) {
    const srcDir = path.join(__dirname, 'node_modules', 'hermes-compiler', 'hermesc', osName);
    const destDir = path.join(__dirname, 'node_modules', 'react-native', 'sdks', 'hermesc', osName);
    const srcFile = path.join(srcDir, 'hermesc');
    const destFile = path.join(destDir, 'hermesc');

    if (fs.existsSync(srcFile)) {
      if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
      }
      fs.copyFileSync(srcFile, destFile);
      execSync(`chmod +x ${destFile}`);
      console.log(`[fix-hermes] Patched legacy hermesc binary for ${osName}`);
    }
  }
} catch(e) {
  console.error('[fix-hermes] error:', e);
}
