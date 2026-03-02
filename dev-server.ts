import express, { Request, Response } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// CORS headers middleware
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  next();
});

function preprocessHtml(raw: string): string {
  let html = raw;
  html = html.replace(/<script[\s\S]*?<\/script>/gi, '');
  html = html.replace(/<style[\s\S]*?<\/style>/gi, '');
  html = html.replace(/<svg[\s\S]*?<\/svg>/gi, '');
  html = html.replace(/<noscript[\s\S]*?<\/noscript>/gi, '');
  html = html.replace(/<!--[\s\S]*?-->/g, '');
  html = html.replace(/data:[^"'\s)]+/gi, '');
  html = html.replace(/\sstyle="[^"]*"/gi, '');
  html = html.replace(/\sstyle='[^']*'/gi, '');
  html = html.replace(/\sclass="[^"]*"/gi, '');
  html = html.replace(/\sclass='[^']*'/gi, '');
  html = html.replace(/\sdata-[a-z0-9-]+="[^"]*"/gi, '');
  html = html.replace(/\s{2,}/g, ' ');
  html = html.replace(/\n{3,}/g, '\n\n');
  return html.trim();
}

interface PreExtractedData {
  instagramHandles: string[];
  whatsappNumbers: string[];
  phones: string[];
  emails: string[];
  metaDescription: string;
  ogTitle: string;
  ogImage: string;
  jsonLd: string[];
}

function extractStructuredData(html: string, baseUrl: string): PreExtractedData {
  const result: PreExtractedData = {
    instagramHandles: [],
    whatsappNumbers: [],
    phones: [],
    emails: [],
    metaDescription: '',
    ogTitle: '',
    ogImage: '',
    jsonLd: [],
  };

  const igRegex = /href=["'](?:https?:\/\/)?(?:www\.)?instagram\.com\/([a-zA-Z0-9_.]+)\/?["']/gi;
  let match;
  while ((match = igRegex.exec(html)) !== null) {
    const handle = match[1].toLowerCase();
    if (!['p', 'reel', 'stories', 'explore', 'accounts', 'about', 'developer', 'legal'].includes(handle)) {
      const formatted = `@${handle}`;
      if (!result.instagramHandles.includes(formatted)) result.instagramHandles.push(formatted);
    }
  }

  const waRegex = /href=["'](?:https?:\/\/)?(?:api\.)?wa\.me\/(\d+)\/?[^"']*["']/gi;
  while ((match = waRegex.exec(html)) !== null) {
    if (!result.whatsappNumbers.includes(match[1])) result.whatsappNumbers.push(match[1]);
  }

  const telRegex = /href=["']tel:([^"']+)["']/gi;
  while ((match = telRegex.exec(html)) !== null) {
    const phone = match[1].replace(/\s+/g, '').trim();
    if (phone.replace(/\D/g, '').length >= 8 && !result.phones.includes(phone)) result.phones.push(phone);
  }

  const mailRegex = /href=["']mailto:([^"'?]+)/gi;
  while ((match = mailRegex.exec(html)) !== null) {
    const email = match[1].trim().toLowerCase();
    if (email.includes('@') && !result.emails.includes(email)) result.emails.push(email);
  }

  return result;
}

function extractPrioritySections(html: string): { priority: string; body: string } {
  const sections: string[] = [];
  const headerMatch = html.match(/<header[\s\S]*?<\/header>/i);
  if (headerMatch) sections.push(`[HEADER]\n${headerMatch[0]}`);
  const footerMatch = html.match(/<footer[\s\S]*?<\/footer>/i);
  if (footerMatch) sections.push(`[FOOTER]\n${footerMatch[0]}`);
  const navMatch = html.match(/<nav[\s\S]*?<\/nav>/i);
  if (navMatch) sections.push(`[NAV]\n${navMatch[0]}`);
  const contactPatterns = [/(<(?:section|div)[^>]*(?:id|class)=["'][^"']*(?:contato|contact|footer|about|sobre)[^"']*["'][^>]*>[\s\S]*?<\/(?:section|div)>)/gi];
  for (const pattern of contactPatterns) {
    let m;
    while ((m = pattern.exec(html)) !== null) {
      if (m[1].length < 5000) sections.push(`[CONTACT/ABOUT SECTION]\n${m[1]}`);
    }
  }
  return { priority: sections.join('\n\n'), body: html };
}

app.get('/', (req: Request, res: Response) => {
  res.json({
    message: '🚀 Extract Branding API',
    endpoints: {
      health: 'GET /health',
      extract: 'POST /api/extract-branding',
    },
    example: {
      method: 'POST',
      url: 'http://localhost:3000/api/extract-branding',
      body: '{"url":"https://example.com"}',
    },
  });
});

app.post('/api/extract-branding', async (req: Request, res: Response) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: 'URL is required' });

    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    if (!GEMINI_API_KEY) {
      return res.status(500).json({ error: 'GEMINI_API_KEY environment variable is not set.' });
    }

    let formattedUrl = String(url).trim();
    if (!formattedUrl.startsWith('http')) formattedUrl = `https://${formattedUrl}`;

    console.log(`\n📡 Extracting branding from: ${formattedUrl}`);

    const siteResponse = await fetch(formattedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
      },
    });
    const rawHtml = await siteResponse.text();
    console.log(`✓ Fetched ${rawHtml.length} chars`);

    const structured = extractStructuredData(rawHtml, formattedUrl);
    console.log(`✓ Pre-extracted: Instagram=${structured.instagramHandles.length}, WhatsApp=${structured.whatsappNumbers.length}, Phone=${structured.phones.length}, Email=${structured.emails.length}`);

    const cleanedHtml = preprocessHtml(rawHtml);
    const { priority, body } = extractPrioritySections(cleanedHtml);
    const truncatedBody = body.length > 40000 ? body.substring(0, 40000) : body;

    const preExtractedSection = [
      structured.instagramHandles.length > 0 ? `Instagram: ${structured.instagramHandles.join(', ')}` : 'Instagram: NOT found',
      structured.whatsappNumbers.length > 0 ? `WhatsApp: ${structured.whatsappNumbers.join(', ')}` : 'WhatsApp: NOT found',
      structured.phones.length > 0 ? `Phone: ${structured.phones.join(', ')}` : 'Phone: NOT found',
      structured.emails.length > 0 ? `Email: ${structured.emails.join(', ')}` : 'Email: NOT found',
    ].join('\n');

    const promptText = `You are a STRICT data extractor. Extract ONLY factual information from the HTML. NEVER invent data. Return ONLY valid JSON matching this exact structure:
{"primaryColor":"#333333","secondaryColor":"#f5f5f5","neutralColor":"#666666","logoUrl":"","bio":"","professionalPhotoUrl":"","businessPhotoUrl":"","services":[],"phone":"","email":"","address":"","instagramHandle":"","whatsappNumber":"","businessName":"","niche":"","location":""}

CRITICAL RULES:
1. EMPTY STRING "" for anything not explicitly found.
2. USE PRE-EXTRACTED DATA AS GROUND TRUTH.
3. Bio must be VERBATIM text from the page.
Website URL: ${formattedUrl}
═══ PRE-EXTRACTED DATA ═══
${preExtractedSection}
═══ PRIORITY SECTIONS (Footer/Header) ═══
${priority || 'none'}
═══ HTML BODY ═══
${truncatedBody}`;

    console.log('🤖 Calling Gemini API...');
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: { responseMimeType: 'application/json', temperature: 0.1 },
    });

    const geminiRes = await model.generateContent(promptText);
    const resultText = geminiRes.response.text() || '{}';
    let branding = JSON.parse(resultText);
    console.log('✓ Gemini response received');

    // Cross-validation with regex data
    if (structured.instagramHandles.length > 0 && !branding.instagramHandle) {
      branding.instagramHandle = structured.instagramHandles[0];
    }
    if (structured.whatsappNumbers.length > 0 && !branding.whatsappNumber) {
      branding.whatsappNumber = structured.whatsappNumbers[0];
    }
    if (structured.phones.length > 0 && !branding.phone) {
      branding.phone = structured.phones[0];
    }
    if (structured.emails.length > 0 && !branding.email) {
      branding.email = structured.emails[0];
    }

    console.log('✓ Branding extracted successfully');
    return res.status(200).json({ success: true, branding });
  } catch (error: any) {
    console.error('❌ API Error:', error.message);
    return res.status(500).json({ error: error?.message || 'Unknown error' });
  }
});

app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`\n🚀 Server running at http://localhost:${PORT}`);
  console.log(`📡 POST http://localhost:${PORT}/api/extract-branding`);
  console.log(`   Body: { "url": "https://example.com" }`);
  console.log(`\n⚠️  Make sure GEMINI_API_KEY is set in your environment\n`);
});
