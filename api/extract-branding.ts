import type { VercelRequest, VercelResponse } from '@vercel/node';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

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
  let m;
  while ((m = igRegex.exec(html)) !== null) {
    const h = `@${m[1].toLowerCase()}`;
    if (!result.instagramHandles.includes(h)) result.instagramHandles.push(h);
  }

  const waRegex = /href=["'](?:https?:\/\/)?(?:api\.)?wa\.me\/(\d+)\/?[^"']*["']/gi;
  while ((m = waRegex.exec(html)) !== null) {
    const n = m[1];
    if (!result.whatsappNumbers.includes(n)) result.whatsappNumbers.push(n);
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

  const metaDescMatch = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i)
    || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["']/i);
  if (metaDescMatch) result.metaDescription = metaDescMatch[1].trim();

  const ogTitleMatch = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i)
    || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:title["']/i);
  if (ogTitleMatch) result.ogTitle = ogTitleMatch[1].trim();

  const ogImageMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)
    || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
  if (ogImageMatch) {
    let img = ogImageMatch[1].trim();
    if (img.startsWith('/')) {
      try { img = new URL(baseUrl).origin + img; } catch {}
    }
    result.ogImage = img;
  }

  const rawJsonLdRegex = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  while ((m = rawJsonLdRegex.exec(html)) !== null) {
    try { const parsed = JSON.parse(m[1].trim()); result.jsonLd.push(JSON.stringify(parsed, null, 2)); } catch {}
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
  const contactPattern = /(<(?:section|div)[^>]*(?:id|class)=["'][^"']*(?:contact|contato|footer|about|sobre)[^"']*["'][^>]*>[\s\S]*?<\/(?:section|div)>)/gi;
  let m;
  while ((m = contactPattern.exec(html)) !== null) {
    if (m[1].length < 5000) sections.push(`[CONTACT]\n${m[1]}`);
  }
  return { priority: sections.join('\n\n'), body: html };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') return res.status(204).setHeader('Access-Control-Allow-Origin', '*').end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { url } = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    if (!url) return res.status(400).json({ error: 'URL is required' });

    const geminiKey = process.env.GEMINI_API_KEY;
    if (!geminiKey) return res.status(500).json({ error: 'GEMINI_API_KEY not configured' });

    let formattedUrl = String(url).trim();
    if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) formattedUrl = `https://${formattedUrl}`;

    let raw = '';
    try {
      const r = await fetch(formattedUrl, { headers: { 'User-Agent': 'Mozilla/5.0' }, redirect: 'follow' });
      raw = await r.text();
    } catch (err) {
      return res.status(400).json({ error: 'Não foi possível acessar o site. Verifique a URL.' });
    }

    const structured = extractStructuredData(raw, formattedUrl);
    const cleaned = preprocessHtml(raw);
    const { priority, body } = extractPrioritySections(cleaned);
    const MAX_BODY = 40000;
    const truncatedBody = body.length > MAX_BODY ? body.substring(0, MAX_BODY) : body;

    const preExtractedSection = [
      structured.instagramHandles.length > 0 ? `Instagram handles found in links: ${structured.instagramHandles.join(', ')}` : 'Instagram: NOT found in any link',
      structured.whatsappNumbers.length > 0 ? `WhatsApp numbers found in wa.me links: ${structured.whatsappNumbers.join(', ')}` : 'WhatsApp: NOT found in any wa.me link',
      structured.phones.length > 0 ? `Phone numbers found in tel: links: ${structured.phones.join(', ')}` : 'Phone: NOT found in any tel: link',
      structured.emails.length > 0 ? `Email addresses found in mailto: links: ${structured.emails.join(', ')}` : 'Email: NOT found in any mailto: link',
      structured.metaDescription ? `Meta description: "${structured.metaDescription}"` : 'Meta description: NOT found',
      structured.ogTitle ? `OG title: "${structured.ogTitle}"` : '',
      structured.ogImage ? `OG image: ${structured.ogImage}` : '',
      ...structured.jsonLd.map((ld, i) => `JSON-LD #${i + 1}:\n${ld}`),
    ].filter(Boolean).join('\n');

    const prompt = `You are a STRICT data extractor. Return ONLY valid JSON. NEVER invent data. Use the PRE-EXTRACTED DATA as ground truth and prefer it. If a field cannot be confirmed, return an empty string "".\n\nPRE-EXTRACTED DATA:\n${preExtractedSection}\n\nPRIORITY SECTIONS (header/footer/nav/contact):\n${priority || '(none)'}\n\nHTML BODY (cleaned, truncated):\n${truncatedBody}\n\nReturn a single JSON object with the following fields: primaryColor, secondaryColor, neutralColor, logoUrl, bio, professionalPhotoUrl, businessPhotoUrl, services (array), phone, email, address, instagramHandle, whatsappNumber, businessName, niche, location.`;

    const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        temperature: 0,
        candidate_count: 1,
        max_output_tokens: 1024,
        input: { text: prompt },
      }),
    });

    if (!geminiRes.ok) {
      const t = await geminiRes.text();
      console.error('Gemini error:', geminiRes.status, t);
      return res.status(502).json({ error: 'AI analysis failed' });
    }

    const geminiJson = await geminiRes.json();
    let textOutput = '';
    try {
      textOutput = geminiJson.candidates?.[0]?.content?.[0]?.text || geminiJson.candidates?.[0]?.output || geminiJson.candidates?.[0]?.content || JSON.stringify(geminiJson);
      if (Array.isArray(textOutput)) textOutput = textOutput.join('\n');
    } catch (e) { textOutput = JSON.stringify(geminiJson); }

    const jsonMatch = String(textOutput).match(/\{[\s\S]*\}/);
    let branding: any = {};
    if (jsonMatch) {
      try { branding = JSON.parse(jsonMatch[0]); } catch (e) { branding = {}; }
    }

    const cleanField = (val: any): string => {
      if (!val || typeof val !== 'string') return '';
      const t = val.trim();
      if (!t) return '';
      if (/not found|not available|n\/a|não encontrado|não disponível/i.test(t)) return '';
      if (t === '-' || t === '—' || t === '""') return '';
      return t;
    };

    const validatePhone = (v: any): string => {
      const c = cleanField(v);
      if (!c) return '';
      const digits = c.replace(/\D/g, '');
      return digits.length >= 8 ? c : '';
    };

    const validateEmail = (v: any): string => {
      const c = cleanField(v);
      if (!c) return '';
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c) ? c : '';
    };

    const validateUrl = (v: any): string => {
      const c = cleanField(v);
      if (!c) return '';
      return c.startsWith('http://') || c.startsWith('https://') ? c : '';
    };

    const validateInstagram = (v: any): string => {
      const c = cleanField(v);
      if (!c) return '';
      const handle = c.startsWith('@') ? c : `@${c}`;
      return /^@[a-zA-Z0-9_.]{1,30}$/.test(handle) ? handle : '';
    };

    branding = branding || {};
    branding.bio = cleanField(branding.bio);
    branding.phone = validatePhone(branding.phone);
    branding.email = validateEmail(branding.email);
    branding.address = cleanField(branding.address);
    branding.instagramHandle = validateInstagram(branding.instagramHandle);
    branding.whatsappNumber = validatePhone(branding.whatsappNumber);
    branding.businessName = cleanField(branding.businessName);
    branding.niche = cleanField(branding.niche);
    branding.location = cleanField(branding.location);
    branding.logoUrl = validateUrl(branding.logoUrl);
    branding.professionalPhotoUrl = validateUrl(branding.professionalPhotoUrl);
    branding.businessPhotoUrl = validateUrl(branding.businessPhotoUrl);
    if (!Array.isArray(branding.services)) branding.services = [];
    else branding.services = branding.services.filter((s: any) => typeof s === 'string' && s.trim().length > 0);

    // Fallback to regex extracted values if AI returned empty
    if (!branding.instagramHandle && structured.instagramHandles.length > 0) branding.instagramHandle = structured.instagramHandles[0];
    if (!branding.whatsappNumber && structured.whatsappNumbers.length > 0) branding.whatsappNumber = structured.whatsappNumbers[0];
    if (!branding.phone && structured.phones.length > 0) branding.phone = structured.phones[0];
    if (!branding.email && structured.emails.length > 0) branding.email = structured.emails[0];
    if (!branding.businessPhotoUrl && structured.ogImage) branding.businessPhotoUrl = structured.ogImage;

    return res.status(200).setHeader('Content-Type', 'application/json').json({ success: true, branding });
  } catch (e: any) {
    console.error('extract-branding error:', e);
    return res.status(500).json({ error: e?.message || 'Unknown error' });
  }
}
