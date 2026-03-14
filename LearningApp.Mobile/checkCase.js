const fs = require('fs');
const path = require('path');

function checkDir(dir) {
  const files = fs.readdirSync(dir, { withFileTypes: true });
  for (const file of files) {
    const fullPath = path.join(dir, file.name);
    if (file.isDirectory()) {
      checkDir(fullPath);
    } else if (fullPath.endsWith('.js') || fullPath.endsWith('.ts') || fullPath.endsWith('.jsx') || fullPath.endsWith('.tsx')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      
      const importRegex = /import\s+(?:.*?\s+from\s+)?['"](.*?)['"]/g;
      let match;
      while ((match = importRegex.exec(content)) !== null) {
        checkImport(fullPath, match[1]);
      }
      
      const requireRegex = /require\(['"](.*?)['"]\)/g;
      while ((match = requireRegex.exec(content)) !== null) {
        checkImport(fullPath, match[1]);
      }
    }
  }
}

function checkImport(sourceFilePath, importPath) {
  if (!importPath.startsWith('.')) return; 
  
  const sourceDir = path.dirname(sourceFilePath);
  let resolvedPath = path.resolve(sourceDir, importPath);
  
  const extensions = ['', '.js', '.jsx', '.ts', '.tsx', '/index.js', '/index.ts'];
  let found = false;
  
  for (const ext of extensions) {
    const testPath = resolvedPath + ext;
    if (fs.existsSync(testPath)) {
      found = true;
      
      const basename = path.basename(testPath);
      const dirname = path.dirname(testPath);
      
      try {
        const actualFiles = fs.readdirSync(dirname);
        if (!actualFiles.includes(basename)) {
           console.log(`[CASE MISMATCH] in ${sourceFilePath}:`);
           console.log(`    Import: '${importPath}'`);
           console.log(`    Actual file casing is different!\n`);
        }
      } catch (e) {
        // Handle dir not found if somehow resolvedPath is weird
      }
      break;
    }
  }
  
  if (!found) {
    console.log(`[MISSING FILE] in ${sourceFilePath}:`);
    console.log(`    Import: '${importPath}'\n`);
  }
}

console.log('--- Starting Case Mismatch Check ---');
checkDir(path.join(__dirname, 'src'));
console.log('--- Finished Case Mismatch Check ---');
