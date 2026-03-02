import { GoogleGenerativeAI } from '@google/generative-ai';

function preprocessHtml(raw) {
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

function extractStructuredData(html, baseUrl) {
  const result = {
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
  let m;
  while ((m = igRegex.exec(html)) !== null) {
    const handle = m[1].toLowerCase();
    if (!['p', 'reel', 'stories', 'explore', 'accounts', 'about', 'developer', 'legal'].includes(handle)) {
      const h = `@${handle}`;
      if (!result.instagramHandles.includes(h)) result.instagramHandles.push(h);
    }
  }

  const waRegex = /href=["'](?:https?:\/\/)?(?:api\.)?wa\.me\/(\d+)\/?[^"']*["']/gi;
  while ((m = waRegex.exec(html)) !== null) {
    if (!result.whatsappNumbers.includes(m[1])) result.whatsappNumbers.push(m[1]);
  }

  const telRegex = /href=["']tel:([^"']+)["']/gi;
  while ((m = telRegex.exec(html)) !== null) {
    const p = m[1].replace(/\s+/g, '').trim();
    if (p.replace(/\D/g, '').length >= 8 && !result.phones.includes(p)) result.phones.push(p);
  }

  const mailRegex = /href=["']mailto:([^"'?]+)/gi;
  while ((m = mailRegex.exec(html)) !== null) {
    const e = m[1].trim().toLowerCase();
    if (e.includes('@') && !result.emails.includes(e)) result.emails.push(e);
  }

  return result;
}

function extractPrioritySections(html) {
  const sections = [];
  const headerMatch = html.match(/<header[\s\S]*?<\/header>/i);
  if (headerMatch) sections.push(`[HEADER]\n${headerMatch[0]}`);
  const footerMatch = html.match(/<footer[\s\S]*?<\/footer>/i);
  if (footerMatch) sections.push(`[FOOTER]\n${footerMatch[0]}`);
  const navMatch = html.match(/<nav[\s\S]*?<\/nav>/i);
  if (navMatch) sections.push(`[NAV]\n${navMatch[0]}`);
  const contactPattern = /(<(?:section|div)[^>]*(?:id|class)=["'][^"']*(?:contact|contato|footer|about|sobre)[^"']*["'][^>]*>[\s\S]*?<\/(?:section|div)>)/gi;
  let m;
  while ((m = contactPattern.exec(html)) !== null) {
    if (m[1].length < 5000) sections.push(`[CONTACT]\n${m[1]}`);
  }
  return { priority: sections.join('\n\n'), body: html };
}

async function run() {
  const url = process.argv[2] || 'https://www.giovanaromano.com.br/';
  console.log('Testing URL:', url);
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    console.error('GEMINI_API_KEY not set');
    process.exit(1);
  }

  let raw = '';
  try {
    const r = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      redirect: 'follow',
    });
    raw = await r.text();
  } catch (e) {
    console.error('Fetch failed', e);
    process.exit(1);
  }

  console.log('Fetched length:', raw.length);
  const structured = extractStructuredData(raw, url);
  console.log('Pre-extracted:', structured);

  const cleaned = preprocessHtml(raw);
  const { priority, body } = extractPrioritySections(cleaned);
  const MAX_BODY = 40000;
  const truncatedBody = body.length > MAX_BODY ? body.substring(0, MAX_BODY) : body;

  const preExtractedSection = [
    structured.instagramHandles.length > 0
      ? `Instagram: ${structured.instagramHandles.join(', ')}`
      : 'Instagram: NOT found',
    structured.whatsappNumbers.length > 0
      ? `WhatsApp: ${structured.whatsappNumbers.join(', ')}`
      : 'WhatsApp: NOT found',
    structured.phones.length > 0 ? `Phone: ${structured.phones.join(', ')}` : 'Phone: NOT found',
    structured.emails.length > 0 ? `Email: ${structured.emails.join(', ')}` : 'Email: NOT found',
  ].join('\n');

  const promptText = `You are a STRICT data extractor. Extract ONLY factual information from the HTML. NEVER invent data. Return ONLY valid JSON matching this exact structure:
{"primaryColor":"#333333","secondaryColor":"#f5f5f5","neutralColor":"#666666","logoUrl":"","bio":"","professionalPhotoUrl":"","businessPhotoUrl":"","services":[],"phone":"","email":"","address":"","instagramHandle":"","whatsappNumber":"","businessName":"","niche":"","location":""}

CRITICAL RULES:
1. EMPTY STRING "" for anything not explicitly found.
2. USE PRE-EXTRACTED DATA AS GROUND TRUTH.
3. Bio must be VERBATIM text from the page.
Website URL: ${url}
═══ PRE-EXTRACTED DATA ═══\n${preExtractedSection}
═══ PRIORITY SECTIONS (Footer/Header) ═══\n${priority || 'none'}
═══ HTML BODY ═══\n${truncatedBody}`;

  console.log('Calling Gemini with official SDK...');

  try {
    const genAI = new GoogleGenerativeAI(key);
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: { responseMimeType: 'application/json', temperature: 0.1 },
    });

    const geminiRes = await model.generateContent(promptText);
    const resultText = geminiRes.response.text() || '{}';
    console.log('Gemini response received. Text preview:', resultText.substring(0, 500));

    let branding = JSON.parse(resultText);
    console.log('✓ Branding extracted successfully!');
    console.log('Branding result:', JSON.stringify(branding, null, 2));
  } catch (error) {
    console.error('❌ Error calling Gemini:', error.message);
    process.exit(1);
  }
}

run();
