import { capturePage } from './scraping';
import { extractTextFromImage } from './ocr';

export async function getPageData(url: string) {
  // Captura HTML e screenshot
  const { html, screenshotBuffer } = await capturePage(url);

  // Extrai texto do screenshot via OCR
  const ocrText = await extractTextFromImage(screenshotBuffer);

  // Retorna ambos para análise da IA
  return { html, ocrText };
}
