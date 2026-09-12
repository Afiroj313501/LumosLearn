import { parseOffice } from 'officeparser';
import path from 'path';
import fs from 'fs';
import os from 'os';
import crypto from 'crypto';

const SUPPORTED_EXTENSIONS = ['.pdf', '.docx', '.doc', '.pptx', '.ppt'];

export async function extractTextFromFile(fileUrl) {
  const ext = path.extname(fileUrl).toLowerCase();
  if (!SUPPORTED_EXTENSIONS.includes(ext)) {
    return '';
  }

  let tempPath;
  const filePath = path.join(process.cwd(), fileUrl.replace(/^\//, ''));

  try {
    const response = await fetch(fileUrl);
    if (!response.ok) throw new Error(`Failed to download file: ${response.status}`);
    const buffer = Buffer.from(await response.arrayBuffer());

    tempPath = path.join(os.tmpdir(), `${crypto.randomUUID()}${ext}`);
    fs.writeFileSync(tempPath, buffer);

    const ast = await parseOffice(tempPath);
    return ast.toText() || '';
  } catch (err) {
    console.error(`Failed to extract text from ${fileUrl}:`, err.message);
    return '';
  } finally {
    if (tempPath && fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
  }
}