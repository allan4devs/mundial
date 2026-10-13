// app/api/images/route.ts
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  const imagesDir = path.join(process.cwd(), 'public/image');
  let files;
  try {
    files = fs.readdirSync(imagesDir);
  } catch {
    return NextResponse.json({ images: [], error: 'Directory not found' }, { status: 500 });
  }

  const imagePaths = files
    .filter(file => file.toLowerCase().endsWith('.jpg'))
    .sort((a, b) => {
      const numA = parseInt(a.match(/\d+/)?.[0] || '0', 10);
      const numB = parseInt(b.match(/\d+/)?.[0] || '0', 10);
      return numA - numB;
    })
    .map(file => `/image/${file}`);

  console.log('Fetched image paths:', imagePaths);

  return NextResponse.json({ images: imagePaths });
}