import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function extractTextFromImageOCRSpace(imageBase64: string) {
  const response = await fetch("https://api.ocr.space/parse/image", {
    method: "POST",
    headers: {
      "apikey": "K84262785988957",
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: `base64Image=data:image/png;base64,${imageBase64}&language=por`,
  });
  const result = await response.json();
  return result.ParsedResults?.[0]?.ParsedText || "";
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { url, html, imageBase64 } = await req.json();
    if (!url) {
      return new Response(JSON.stringify({ error: "URL is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let htmlContent = html || "";
    if (!htmlContent) {
      const siteResponse = await fetch(url);
      htmlContent = await siteResponse.text();
      if (htmlContent.length > 50000) {
        htmlContent = htmlContent.substring(0, 50000);
      }
    }

    let ocrText = "";
    if (imageBase64) {
      ocrText = await extractTextFromImageOCRSpace(imageBase64);
    }

    let promptHtml = htmlContent;
    if (ocrText && ocrText.length > 20) {
      promptHtml += `\n\n---\nTexto extraído da imagem (OCR):\n${ocrText}`;
    }

    console.log("Fetching website:", url);

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
            content: `You are a STRICT data extractor. You analyze website HTML to extract factual brand information.

## CRITICAL RULES — READ CAREFULLY:
1. **NEVER INVENT OR GUESS DATA.** If a piece of information is NOT explicitly present in the HTML, return an EMPTY STRING for that field. Do NOT infer, deduce, or make up values.
2. **Phone numbers**: Extract EXACTLY as written on the page (e.g., "(41) 3618-1878"). Do NOT reformat or change country codes. If there's no phone visible in the HTML, return empty string.
3. **Instagram handle**: Look for actual Instagram URLs (instagram.com/USERNAME). Extract the exact username from the URL path. Do NOT guess based on the business name. If no Instagram URL exists in the HTML, return empty string.
4. **WhatsApp number**: Only extract if there's an explicit wa.me link or WhatsApp icon with a number. Extract exactly as shown. Do NOT guess.
5. **Location/Address**: Only extract if explicitly written on the page. Look for address text, city names in footer, contact sections. Do NOT guess the city based on phone area codes.
6. **Bio/About**: Only use text that actually appears on the page. Do NOT write your own description of the business.
7. **Services/Procedures**: Only list services that are explicitly mentioned on the page (in menus, headings, cards, lists). Do NOT add services that aren't there.
8. **Logo URL**: Must be an actual absolute URL found in the HTML. Prefer <img> tags with "logo" in src/alt/class.
9. **Photos**: Only extract actual image URLs found in the HTML. Make all URLs absolute using the site domain.
10. **Business Name**: Extract the actual displayed business name, not the domain name.
11. **Niche**: Only state what's explicitly described on the page. If the site says "Cirurgia Plástica", use that exact text.
12. **Email**: Only extract if explicitly shown on the page.

## HOW TO SEARCH THE HTML:
- Check <nav>, <header>, <footer> sections for contact info, social links, and navigation
- Check <a href="...instagram.com/..."> for the EXACT Instagram username
- Check <a href="...wa.me/..."> for WhatsApp numbers
- Check text content near phone icons, location icons for contact details
- Check menu items, h2/h3 headings, card titles for services/procedures
- Check meta tags for description (can be used for bio if it's descriptive of the business)
- Check structured data (JSON-LD) if present for business info

REMEMBER: It is ALWAYS better to return an empty string than to return incorrect information.`,
          },
          {
            role: "user",
            content: `Extract brand information from this website HTML. Remember: return EMPTY STRING for anything you're not 100% certain about. Never guess.

Website URL: ${url}

HTML:
${htmlContent}`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_site_identity",
              description: "Extract verified brand identity from a website. All fields should be EMPTY STRING if not explicitly found in the HTML.",
              parameters: {
                type: "object",
                properties: {
                  primaryColor: { type: "string", description: "Primary brand color in hex format found in CSS/styles (e.g. #10b981). Return #333333 as default if not clearly identifiable." },
                  secondaryColor: { type: "string", description: "Secondary/background color in hex format. Return #f5f5f5 as default." },
                  neutralColor: { type: "string", description: "Neutral/text color in hex format. Return #666666 as default." },
                  logoUrl: { type: "string", description: "Absolute URL to logo image found in HTML, or empty string if not found." },
                  bio: { type: "string", description: "EXACT text from the page describing the business/professional (from about section, hero text, or meta description). Must be verbatim or very close to original. Empty string if not found." },
                  professionalPhotoUrl: { type: "string", description: "Absolute URL to a headshot/profile photo found in the HTML, or empty string." },
                  businessPhotoUrl: { type: "string", description: "Absolute URL to a photo of the establishment/clinic found in the HTML, or empty string." },
                  services: {
                    type: "array",
                    items: { type: "string" },
                    description: "List of services/procedures EXACTLY as written on the page. Only include services explicitly listed on the site. Empty array if none found."
                  },
                  phone: { type: "string", description: "Phone number EXACTLY as displayed on the page (e.g. '(41) 3618-1878'). Do NOT reformat. Empty string if not found." },
                  email: { type: "string", description: "Email address exactly as shown on the page. Empty string if not found." },
                  address: { type: "string", description: "Physical address EXACTLY as written on the page. Empty string if not found." },
                  instagramHandle: { type: "string", description: "Instagram handle extracted from an instagram.com URL found in the HTML (e.g. @dra.giovanaromano). Must come from an actual link. Empty string if no Instagram link found." },
                  whatsappNumber: { type: "string", description: "WhatsApp number extracted from a wa.me link or explicit WhatsApp reference. Keep original format. Empty string if not found." },
                  businessName: { type: "string", description: "The actual business/brand name as displayed on the site. Empty string if unclear." },
                  niche: { type: "string", description: "Type of business/specialty EXACTLY as described on the site. Empty string if not clear." },
                  location: { type: "string", description: "City/neighborhood ONLY if explicitly mentioned on the page. Empty string if not found." },
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

    // Post-processing: clean empty/uncertain fields
    const cleanField = (val: any): string => {
      if (!val || typeof val !== 'string') return '';
      const trimmed = val.trim();
      // Remove fields that look like AI made them up
      if (trimmed.toLowerCase().includes('not found') || 
          trimmed.toLowerCase().includes('not available') ||
          trimmed.toLowerCase().includes('n/a') ||
          trimmed === '-' || trimmed === '—') {
        return '';
      }
      return trimmed;
    };

    // Clean all string fields
    branding.bio = cleanField(branding.bio);
    branding.phone = cleanField(branding.phone);
    branding.email = cleanField(branding.email);
    branding.address = cleanField(branding.address);
    branding.instagramHandle = cleanField(branding.instagramHandle);
    branding.whatsappNumber = cleanField(branding.whatsappNumber);
    branding.businessName = cleanField(branding.businessName);
    branding.niche = cleanField(branding.niche);
    branding.location = cleanField(branding.location);
    branding.logoUrl = cleanField(branding.logoUrl);
    branding.professionalPhotoUrl = cleanField(branding.professionalPhotoUrl);
    branding.businessPhotoUrl = cleanField(branding.businessPhotoUrl);

    // Clean services array
    if (Array.isArray(branding.services)) {
      branding.services = branding.services.filter((s: string) => s && typeof s === 'string' && s.trim().length > 0);
    } else {
      branding.services = [];
    }

    console.log("Extracted branding:", JSON.stringify(branding).substring(0, 500));

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
