import fs from 'fs';
import path from 'path';
import JSZip from 'jszip';

const projectRoot = process.cwd();
const outputZipPath = path.join(projectRoot, 'source-code.zip');

const filesToInclude = [
  '.env',
  'README.md',
  'apphosting.yaml',
  'components.json',
  'firebase.json',
  'next.config.ts',
  'package.json',
  'src',
  'tailwind.config.ts',
  'tsconfig.json'
];

// Folders to explicitly exclude from the zip
const foldersToExclude = new Set([
  'node_modules',
  '.next',
  '.git',
]);

const zip = new JSZip();

function addFileToZip(filePath, zipFolder) {
  const fullPath = path.join(projectRoot, filePath);
  if (!fs.existsSync(fullPath)) return;

  const stat = fs.statSync(fullPath);

  if (stat.isDirectory()) {
    if (foldersToExclude.has(path.basename(fullPath))) {
      return; // Skip excluded folders
    }
    const dirName = path.basename(filePath);
    const newZipFolder = zipFolder ? zipFolder.folder(dirName) : zip.folder(dirName);
    const files = fs.readdirSync(fullPath);
    files.forEach(file => {
      addFileToZip(path.join(filePath, file), newZipFolder);
    });
  } else {
    const fileName = path.basename(filePath);
    const fileContent = fs.readFileSync(fullPath);
    zipFolder.file(fileName, fileContent);
  }
}

console.log('Starting to zip project source...');

filesToInclude.forEach(fileOrDir => {
    const fullPath = path.join(projectRoot, fileOrDir);
    if (!fs.existsSync(fullPath)) {
        console.warn(`Warning: Path not found, skipping: ${fileOrDir}`);
        return;
    }

    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
        const dirName = path.basename(fileOrDir);
        const zipFolder = zip.folder(dirName);
        const files = fs.readdirSync(fullPath);
        files.forEach(file => {
            addFileToZip(path.join(fileOrDir, file), zipFolder);
        });
    } else {
        const fileName = path.basename(fileOrDir);
        const fileContent = fs.readFileSync(fullPath);
        zip.file(fileName, fileContent);
    }
});


zip.generateAsync({ type: 'nodebuffer' })
  .then(content => {
    fs.writeFileSync(outputZipPath, content);
    console.log(`✅ Project source code successfully zipped to ${outputZipPath}`);
  })
  .catch(err => {
    console.error('❌ Error creating zip file:', err);
  });
