import fs from 'fs/promises';
import path from 'path';
import { PDFParse } from 'pdf-parse';

export async function extractTextFromPDF(fileUrl) {
  const filePath = path.join(process.cwd(), fileUrl.replace(/^\//, ''));
  const buffer = await fs.readFile(filePath);
  const parser = new PDFParse({ data: buffer });
  try {
    const result = await parser.getText();
    return result.text;
  } finally {
    await parser.destroy();
  }
}