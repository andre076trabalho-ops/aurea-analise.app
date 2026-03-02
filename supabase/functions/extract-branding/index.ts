import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ── HTML Preprocessing ─────────────────────────────────────────────────────
// Strips noise (scripts, styles, SVGs, base64, comments) so the AI sees only
// visible text + structural markup, and important sections never get truncated.

function preprocessHtml(raw: string): string {
  let html = raw;

  // Remove full tag blocks that carry no visible content
  html = html.replace(/<script[\s\S]*?<\/script>/gi, "");
  html = html.replace(/<style[\s\S]*?<\/style>/gi, "");
  html = html.replace(/<svg[\s\S]*?<\/svg>/gi, "");
  html = html.replace(/<noscript[\s\S]*?<\/noscript>/gi, "");

  // Remove HTML comments
  html = html.replace(/<!--[\s\S]*?-->/g, "");

  // Remove base64 data-URIs (images/fonts encoded inline)
  html = html.replace(/data:[^"'\s)]+/gi, "");

  // Remove inline style attributes (style="...")
  html = html.replace(/\sstyle="[^"]*"/gi, "");
  html = html.replace(/\sstyle='[^']*'/gi, "");

  // Remove class attributes (class="...")
  html = html.replace(/\sclass="[^"]*"/gi, "");
  html = html.replace(/\sclass='[^']*'/gi, "");

  // Remove data-* attributes
  html = html.replace(/\sdata-[a-z0-9-]+="[^"]*"/gi, "");

  // Collapse whitespace
  html = html.replace(/\s{2,}/g, " ");
  html = html.replace(/\n{3,}/g, "\n\n");

  return html.trim();
}

// ── Structured Data Pre-Extraction ──────────────────────────────────────────
// Uses regex to reliably extract data BEFORE the AI call. These act as ground
// truth so the AI doesn't have to guess.

interface PreExtractedData {
  instagramHandles: string[];
  whatsappNumbers: string[];
  phones: string[];
  emails: string[];
  metaDescription: string;
  ogTitle: string;
  ogImage: string;
  jsonLd: string[];
  addresses: string[];
}

function extractStructuredData(html: string, baseUrl: string): PreExtractedData {
  const result: PreExtractedData = {
    instagramHandles: [],
    whatsappNumbers: [],
    phones: [],
    emails: [],
    metaDescription: "",
    ogTitle: "",
    ogImage: "",
    jsonLd: [],
    addresses: [],
  };

  // Instagram handles from links
  const igRegex = /href=["'](?:https?:\/\/)?(?:www\.)?instagram\.com\/([a-zA-Z0-9_.]+)\/?["']/gi;
  let match;
  while ((match = igRegex.exec(html)) !== null) {
    const handle = match[1].toLowerCase();
    if (!["p", "reel", "stories", "explore", "accounts", "about", "developer", "legal"].includes(handle)) {
      const formatted = `@${handle}`;
      if (!result.instagramHandles.includes(formatted)) {
        result.instagramHandles.push(formatted);
      }
    }
  }

  // WhatsApp numbers from wa.me links
  const waRegex = /href=["'](?:https?:\/\/)?(?:api\.)?wa\.me\/(\d+)\/?[^"']*["']/gi;
  while ((match = waRegex.exec(html)) !== null) {
    const num = match[1];
    if (!result.whatsappNumbers.includes(num)) {
      result.whatsappNumbers.push(num);
    }
  }

  // Phone numbers from tel: links
  const telRegex = /href=["']tel:([^"']+)["']/gi;
  while ((match = telRegex.exec(html)) !== null) {
    const phone = match[1].replace(/\s+/g, "").trim();
    if (phone.replace(/\D/g, "").length >= 8 && !result.phones.includes(phone)) {
      result.phones.push(phone);
    }
  }

  // Email from mailto: links
  const mailRegex = /href=["']mailto:([^"'?]+)/gi;
  while ((match = mailRegex.exec(html)) !== null) {
    const email = match[1].trim().toLowerCase();
    if (email.includes("@") && !result.emails.includes(email)) {
      result.emails.push(email);
    }
  }

  // Meta description
  const metaDescMatch = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i)
    || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["']/i);
  if (metaDescMatch) {
    result.metaDescription = metaDescMatch[1].trim();
  }

  // Open Graph title
  const ogTitleMatch = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i)
    || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:title["']/i);
  if (ogTitleMatch) {
    result.ogTitle = ogTitleMatch[1].trim();
  }

  // Open Graph image
  const ogImageMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)
    || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
  if (ogImageMatch) {
    let imgUrl = ogImageMatch[1].trim();
    if (imgUrl.startsWith("/")) {
      try {
        const base = new URL(baseUrl);
        imgUrl = `${base.origin}${imgUrl}`;
      } catch { /* ignore */ }
    }
    result.ogImage = imgUrl;
  }

  // JSON-LD structured data
  const rawJsonLdRegex = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  while ((match = rawJsonLdRegex.exec(html)) !== null) {
    try {
      const parsed = JSON.parse(match[1].trim());
      result.jsonLd.push(JSON.stringify(parsed, null, 2));
    } catch {
      // silently skip invalid JSON-LD
    }
  }

  return result;
}

// ── Priority Section Extraction ──────────────────────────────────────────
// Extracts header, footer, nav, and contact sections separately so they
// always appear in the AI context (even if the body is huge).

function extractPrioritySections(html: string): { priority: string; body: string } {
  const sections: string[] = [];

  // Extract <header>...</header>
  const headerMatch = html.match(/<header[\s\S]*?<\/header>/i);
  if (headerMatch) sections.push(`[HEADER]\n${headerMatch[0]}`);

  // Extract <footer>...</footer>
  const footerMatch = html.match(/<footer[\s\S]*?<\/footer>/i);
  if (footerMatch) sections.push(`[FOOTER]\n${footerMatch[0]}`);

  // Extract <nav>...</nav> (first one)
  const navMatch = html.match(/<nav[\s\S]*?<\/nav>/i);
  if (navMatch) sections.push(`[NAV]\n${navMatch[0]}`);

  // Extract sections containing contact/about keywords
  const contactPatterns = [
    /(<(?:section|div)[^>]*(?:id|class)=["'][^"']*(?:contato|contact|footer|about|sobre)[^"']*["'][^>]*>[\s\S]*?<\/(?:section|div)>)/gi,
  ];
  for (const pattern of contactPatterns) {
    let m;
    while ((m = pattern.exec(html)) !== null) {
      if (m[1].length < 5000) {
        sections.push(`[CONTACT/ABOUT SECTION]\n${m[1]}`);
      }
    }
  }

  const priority = sections.join("\n\n");

  // The body is the cleaned full HTML (the AI still needs it for services, bio, etc.)
  return { priority, body: html };
}

// ── Main Handler ────────────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { url } = await req.json();
    if (!url) {
      return new Response(JSON.stringify({ error: "URL is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    let formattedUrl = url.trim();
    if (!formattedUrl.startsWith("http://") && !formattedUrl.startsWith("https://")) {
      formattedUrl = `https://${formattedUrl}`;
    }

    console.log("Fetching website:", formattedUrl);

    let rawHtml = "";
    try {
      const siteResponse = await fetch(formattedUrl, {
        headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" },
        redirect: "follow",
      });
      rawHtml = await siteResponse.text();
    } catch (fetchError) {
      console.error("Failed to fetch website:", fetchError);
      return new Response(
        JSON.stringify({ error: "Não foi possível acessar o site. Verifique a URL." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Raw HTML length:", rawHtml.length);

    // Step 1: Extract structured data from RAW HTML (before cleaning)
    const structured = extractStructuredData(rawHtml, formattedUrl);
    console.log("Pre-extracted data:", JSON.stringify({
      instagram: structured.instagramHandles,
      whatsapp: structured.whatsappNumbers,
      phones: structured.phones,
      emails: structured.emails,
      hasJsonLd: structured.jsonLd.length > 0,
    }));

    // Step 2: Preprocess HTML (strip noise)
    const cleanedHtml = preprocessHtml(rawHtml);
    console.log("Cleaned HTML length:", cleanedHtml.length);

    // Step 3: Extract priority sections (header, footer, contact areas)
    const { priority, body } = extractPrioritySections(cleanedHtml);

    // Step 4: Build final HTML context — priority sections first, then body
    // Budget: ~40K chars for body + priority always included
    const MAX_BODY = 40000;
    const truncatedBody = body.length > MAX_BODY ? body.substring(0, MAX_BODY) : body;

    // Build pre-extracted data section for the prompt
    const preExtractedSection = [
      structured.instagramHandles.length > 0 ? `Instagram handles found in links: ${structured.instagramHandles.join(", ")}` : "Instagram: NOT found in any link",
      structured.whatsappNumbers.length > 0 ? `WhatsApp numbers found in wa.me links: ${structured.whatsappNumbers.join(", ")}` : "WhatsApp: NOT found in any wa.me link",
      structured.phones.length > 0 ? `Phone numbers found in tel: links: ${structured.phones.join(", ")}` : "Phone: NOT found in any tel: link",
      structured.emails.length > 0 ? `Email addresses found in mailto: links: ${structured.emails.join(", ")}` : "Email: NOT found in any mailto: link",
      structured.metaDescription ? `Meta description: "${structured.metaDescription}"` : "Meta description: NOT found",
      structured.ogTitle ? `OG title: "${structured.ogTitle}"` : "",
      structured.ogImage ? `OG image: ${structured.ogImage}` : "",
      ...structured.jsonLd.map((ld, i) => `JSON-LD #${i + 1}:\n${ld}`),
    ].filter(Boolean).join("\n");

    console.log("Sending to AI for analysis...");

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are a STRICT data extractor. You extract ONLY factual information that EXISTS on the website. You NEVER invent, infer, or guess data.

## CRITICAL RULES:
1. **EMPTY STRING for anything not explicitly found.** If a field's value cannot be confirmed in the HTML or pre-extracted data, return "".
2. **Pre-extracted data is your PRIMARY source.** The PRE-EXTRACTED DATA section contains information reliably parsed from the HTML via regex. USE IT DIRECTLY:
   - If it says "Instagram handles found: @example" → use @example
   - If it says "Instagram: NOT found" → return ""
   - Same for WhatsApp, phone, email
3. **DO NOT fabricate contact info.** Never invent phone numbers, emails, Instagram handles, or addresses. If the pre-extracted data says "NOT found" AND you cannot find it in the HTML text, return "".
4. **Bio must be VERBATIM text from the page.** Copy exact sentences from the hero section, about section, or meta description. Do NOT write your own description.
5. **Services must be EXPLICITLY LISTED on the site.** Only include services mentioned in menus, headings, cards, or lists. Do NOT add services you think the business might offer.
6. **Address and location must appear on the page.** Do NOT guess based on phone area codes or other indirect clues.
7. **Logo URL must be an actual absolute URL** found in the HTML (in <img> tags, usually with "logo" in src/alt/class).
8. **Photos must be actual absolute URLs** from <img> tags. Make URLs absolute using the site domain.

## PRIORITY ORDER FOR EACH FIELD:
1. Pre-extracted data (regex-parsed, most reliable)
2. JSON-LD structured data (if available)
3. Visible text in priority sections (header, footer, contact areas)
4. Visible text in the rest of the HTML body

REMEMBER: Returning "" is ALWAYS better than returning incorrect data.`,
          },
          {
            role: "user",
            content: `Extract brand information from this website. Use the PRE-EXTRACTED DATA as your primary source. Return EMPTY STRING for anything you cannot confirm.

Website URL: ${formattedUrl}

═══ PRE-EXTRACTED DATA (from regex — reliable, use as ground truth) ═══
${preExtractedSection}

═══ PRIORITY SECTIONS (header, footer, contact areas) ═══
${priority || "(none found)"}

═══ HTML BODY (cleaned) ═══
${truncatedBody}`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_site_identity",
              description: "Extract verified brand identity from a website. All fields should be EMPTY STRING if not explicitly found in the HTML or pre-extracted data.",
              parameters: {
                type: "object",
                properties: {
                  primaryColor: { type: "string", description: "Primary brand color in hex format found in CSS/styles (e.g. #10b981). Return #333333 as default if not clearly identifiable." },
                  secondaryColor: { type: "string", description: "Secondary/background color in hex format. Return #f5f5f5 as default." },
                  neutralColor: { type: "string", description: "Neutral/text color in hex format. Return #666666 as default." },
                  logoUrl: { type: "string", description: "Absolute URL to logo image found in HTML, or empty string if not found." },
                  bio: { type: "string", description: "EXACT text from the page describing the business/professional (from about section, hero text, or meta description). Must be verbatim from the page. Empty string if not found." },
                  professionalPhotoUrl: { type: "string", description: "Absolute URL to a headshot/profile photo found in the HTML, or empty string." },
                  businessPhotoUrl: { type: "string", description: "Absolute URL to a photo of the establishment/clinic found in the HTML, or empty string." },
                  services: {
                    type: "array",
                    items: { type: "string" },
                    description: "List of services/procedures EXACTLY as written on the page. Only include services explicitly listed on the site. Empty array if none found."
                  },
                  phone: { type: "string", description: "Phone number from PRE-EXTRACTED DATA or exactly as displayed on the page. Do NOT invent. Empty string if not found." },
                  email: { type: "string", description: "Email from PRE-EXTRACTED DATA or exactly as shown on the page. Empty string if not found." },
                  address: { type: "string", description: "Physical address EXACTLY as written on the page. Empty string if not found." },
                  instagramHandle: { type: "string", description: "Instagram handle from PRE-EXTRACTED DATA (e.g. @username). Must come from an actual link. Empty string if not found." },
                  whatsappNumber: { type: "string", description: "WhatsApp number from PRE-EXTRACTED DATA (wa.me link). Empty string if not found." },
                  businessName: { type: "string", description: "The actual business/brand name as displayed on the site. Empty string if unclear." },
                  niche: { type: "string", description: "Type of business/specialty EXACTLY as described on the site. Empty string if not clear." },
                  location: { type: "string", description: "City/neighborhood ONLY if explicitly mentioned on the page. Empty string if not found — do NOT guess from phone area codes." },
                },
                required: ["primaryColor", "secondaryColor", "neutralColor"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "extract_site_identity" } },
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns segundos." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes. Adicione créditos ao seu workspace." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errorText);
      throw new Error("AI analysis failed");
    }

    const aiData = await aiResponse.json();
    console.log("AI response received");

    let branding;
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      branding = JSON.parse(toolCall.function.arguments);
    } else {
      const content = aiData.choices?.[0]?.message?.content || "";
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        branding = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("Could not parse branding from AI response");
      }
    }

    // ── Post-processing: validate and clean fields ──────────────────────────

    const cleanField = (val: any): string => {
      if (!val || typeof val !== 'string') return '';
      const trimmed = val.trim();
      if (trimmed.toLowerCase().includes('not found') ||
          trimmed.toLowerCase().includes('not available') ||
          trimmed.toLowerCase().includes('n/a') ||
          trimmed.toLowerCase().includes('não encontrado') ||
          trimmed.toLowerCase().includes('não disponível') ||
          trimmed === '-' || trimmed === '—' || trimmed === '""') {
        return '';
      }
      return trimmed;
    };

    const validatePhone = (val: string): string => {
      const cleaned = cleanField(val);
      if (!cleaned) return '';
      const digitsOnly = cleaned.replace(/\D/g, '');
      // A valid phone should have at least 8 digits
      if (digitsOnly.length < 8) return '';
      return cleaned;
    };

    const validateEmail = (val: string): string => {
      const cleaned = cleanField(val);
      if (!cleaned) return '';
      // Basic email validation
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleaned)) return '';
      return cleaned;
    };

    const validateUrl = (val: string): string => {
      const cleaned = cleanField(val);
      if (!cleaned) return '';
      if (!cleaned.startsWith('http://') && !cleaned.startsWith('https://')) return '';
      return cleaned;
    };

    const validateInstagram = (val: string): string => {
      const cleaned = cleanField(val);
      if (!cleaned) return '';
      // Must look like a handle: @something or just a username
      const handle = cleaned.startsWith('@') ? cleaned : `@${cleaned}`;
      if (!/^@[a-zA-Z0-9_.]{1,30}$/.test(handle)) return '';
      return handle;
    };

    // Apply validations
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

    // Clean services array
    if (Array.isArray(branding.services)) {
      branding.services = branding.services.filter((s: string) => s && typeof s === 'string' && s.trim().length > 0);
    } else {
      branding.services = [];
    }

    // ── Cross-validate with pre-extracted data ──────────────────────────────
    // If we found data via regex but the AI returned something different, prefer regex

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
    if (structured.ogImage && !branding.logoUrl && !branding.businessPhotoUrl) {
      branding.businessPhotoUrl = structured.ogImage;
    }

    console.log("Final branding:", JSON.stringify(branding).substring(0, 500));

    return new Response(JSON.stringify({ success: true, branding }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("extract-branding error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
