
import fs from 'fs/promises';
import path from 'path';
import JSZip from 'jszip';

// Directories and files to ignore
const ignoreList = [
  'node_modules',
  '.next',
  '.git',
  'source-code.zip',
  'package-lock.json'
];

async function zipDirectory(sourceDir, outPath) {
  const zip = new JSZip();
  const rootDir = process.cwd();

  async function addFileToZip(filePath) {
    const relativePath = path.relative(rootDir, filePath);
    
    // Skip ignored files and directories
    if (ignoreList.some(item => relativePath.startsWith(item))) {
      return;
    }

    const stats = await fs.stat(filePath);

    if (stats.isDirectory()) {
      const files = await fs.readdir(filePath);
      for (const file of files) {
        await addFileToZip(path.join(filePath, file));
      }
    } else if (stats.isFile()) {
      const content = await fs.readFile(filePath);
      zip.file(relativePath, content);
      console.log(`Zipped: ${relativePath}`);
    }
  }

  await addFileToZip(sourceDir);

  try {
    const content = await zip.generateAsync({ type: 'nodebuffer' });
    await fs.writeFile(outPath, content);
    console.log(`\nSuccessfully created zip file at: ${outPath}`);
  } catch (err) {
    console.error(`Error creating zip file: ${err.message}`);
  }
}

const sourceDirectory = process.cwd();
const outputZipPath = path.join(sourceDirectory, 'source-code.zip');

zipDirectory(sourceDirectory, outputZipPath);
