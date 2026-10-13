// lib/getImages.ts
import fs from 'fs';
import path from 'path';

const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp']);

export function getImages() {
  const imagesDir = path.join(process.cwd(), 'public/image');
  const files = fs.readdirSync(imagesDir);
  const imagePaths = files
    .filter(file => IMAGE_EXTENSIONS.has(path.extname(file).toLowerCase()))
    .sort((a, b) => {
      const numA = parseInt(a.match(/\d+/)?.[0] || '0', 10);
      const numB = parseInt(b.match(/\d+/)?.[0] || '0', 10);
      return numA - numB;
    })
    .map(file => `/image/${file}`);

  return imagePaths;
}
