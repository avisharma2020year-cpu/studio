import fs from 'fs/promises';
import path from 'path';
import JSZip from 'jszip';

// List of files and directories to ignore
const ignoreList = [
  'node_modules',
  '.next',
  '.git',
  'source-code.zip',
  'package-lock.json',
  '.DS_Store',
];

async function addFilesToZip(zip, dirPath) {
  const dirents = await fs.readdir(dirPath, { withFileTypes: true });

  for (const dirent of dirents) {
    const fullPath = path.join(dirPath, dirent.name);
    
    // Skip ignored files and directories
    if (ignoreList.includes(dirent.name)) {
      continue;
    }

    if (dirent.isDirectory()) {
      // Recurse into subdirectories
      await addFilesToZip(zip.folder(dirent.name), fullPath);
    } else {
      // Add files to the zip
      const content = await fs.readFile(fullPath);
      zip.file(dirent.name, content);
    }
  }
}

async function createZip() {
  const zip = new JSZip();
  const rootDir = process.cwd();

  console.log('Starting to zip the project directory...');
  await addFilesToZip(zip, rootDir);

  console.log('Generating zip file...');
  const content = await zip.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE',
    compressionOptions: {
      level: 9,
    },
  });

  const outputPath = path.join(rootDir, 'source-code.zip');
  await fs.writeFile(outputPath, content);
  console.log(`✅ Successfully created source-code.zip at ${outputPath}`);
}

createZip().catch((err) => {
  console.error('❌ Failed to create zip file:', err);
  process.exit(1);
});
