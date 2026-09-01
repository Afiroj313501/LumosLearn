import { parseOffice } from 'officeparser';
import path from 'path';

const SUPPORTED_EXTENSIONS = ['.pdf', '.docx', '.doc', '.pptx', '.ppt'];

export async function extractTextFromFile(fileUrl) {
  const ext = path.extname(fileUrl).toLowerCase();
  if (!SUPPORTED_EXTENSIONS.includes(ext)) {
    return ''; // unsupported type (e.g. image, zip) - just skip silently
  }

  const filePath = path.join(process.cwd(), fileUrl.replace(/^\//, ''));

  try {
    const ast = await parseOffice(filePath);
    return ast.toText() || '';
  } catch (err) {
    console.error(`Failed to extract text from ${fileUrl}:`, err.message);
    return '';
  }
}