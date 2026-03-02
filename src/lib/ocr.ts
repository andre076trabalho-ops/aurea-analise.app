import Tesseract from 'tesseract.js';

export async function extractTextFromImage(imageBuffer: Buffer) {
  const { data: { text } } = await Tesseract.recognize(imageBuffer, 'por');
  return text;
}
