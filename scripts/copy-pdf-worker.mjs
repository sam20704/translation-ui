// scripts/copy-pdf-worker.mjs
import fs from 'fs/promises';
import path from 'path';

const sourcePath = path.resolve('node_modules/pdfjs-dist/build/pdf.worker.mjs');
const destDir = path.resolve('public');
const destPath = path.join(destDir, 'pdf.worker.mjs');

async function copyWorkerFile() {
  try {
    // Ensure the public directory exists
    await fs.mkdir(destDir, { recursive: true });

    // Copy the worker file
    await fs.copyFile(sourcePath, destPath);

    console.log('✅ Successfully copied pdf.worker.mjs to public directory.');
  } catch (error) {
    console.error('❌ Failed to copy pdf.worker.mjs:', error);
    process.exit(1); // Exit with an error code
  }
}

copyWorkerFile();