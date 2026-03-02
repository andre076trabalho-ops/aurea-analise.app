import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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

    let htmlContent = "";
    try {
      const siteResponse = await fetch(formattedUrl, {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; BrandExtractor/1.0)" },
      });
      htmlContent = await siteResponse.text();
      if (htmlContent.length > 30000) {
        htmlContent = htmlContent.substring(0, 30000);
      }
    } catch (fetchError) {
      console.error("Failed to fetch website:", fetchError);
      return new Response(
        JSON.stringify({ error: "Não foi possível acessar o site. Verifique a URL." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("HTML fetched, sending to AI for deep analysis...");

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
            content: `You are a website brand identity and content extractor. You analyze website HTML to extract comprehensive brand information including colors, logo, bio/about text, services, images, contact information and social links. Return structured data via function calling.`,
          },
          {
            role: "user",
            content: `Analyze this website HTML thoroughly and extract ALL of the following:

1. **Brand Colors**: Primary color (buttons, headers, accents), secondary color (backgrounds), neutral color (text)
2. **Logo URL**: Look for <img> with "logo" in src/alt/class/id, or <link rel="icon">. Prefer SVG/PNG. Make URLs absolute.
3. **Bio/About**: Find the main description or "about" text of the business/professional. Look in about sections, hero text, meta description, or any descriptive paragraphs about who they are, what they do, experience, etc.
4. **Professional Photo**: Find a photo of the professional/owner (headshot, profile photo). Look for images near bio/about sections, team sections, or hero sections with a person. Make URL absolute.
5. **Business/Clinic Photo**: Find a photo of the establishment (clinic, office, storefront, interior). Look for hero images, gallery, or background images. Make URL absolute.
6. **Services/Procedures**: List the main services or procedures offered. Look in menus, service sections, cards, lists.
7. **Contact Info**: Extract phone number, email, physical address if available.
8. **Social Links**: Find Instagram handle/URL, Facebook, WhatsApp number if present.
9. **Business Name**: The actual business/brand name (may differ from domain).
10. **Niche/Specialty**: What type of business this is (e.g., "Harmonização Orofacial", "Odontologia", "Advocacia")
11. **Location**: City, neighborhood if mentioned.

Website URL: ${formattedUrl}

HTML:
${htmlContent}`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_site_identity",
              description: "Extract comprehensive brand identity and content from a website",
              parameters: {
                type: "object",
                properties: {
                  primaryColor: { type: "string", description: "Primary brand color in hex format (e.g. #10b981)" },
                  secondaryColor: { type: "string", description: "Secondary/background color in hex format" },
                  neutralColor: { type: "string", description: "Neutral/text color in hex format" },
                  logoUrl: { type: "string", description: "Absolute URL to the company logo, or empty string if not found" },
                  bio: { type: "string", description: "Main about/bio text of the business or professional (2-4 sentences)" },
                  professionalPhotoUrl: { type: "string", description: "Absolute URL to the professional/owner headshot photo, or empty string" },
                  businessPhotoUrl: { type: "string", description: "Absolute URL to a photo of the establishment/clinic, or empty string" },
                  services: {
                    type: "array",
                    items: { type: "string" },
                    description: "List of main services or procedures offered (up to 10)"
                  },
                  phone: { type: "string", description: "Phone number if found, or empty string" },
                  email: { type: "string", description: "Email address if found, or empty string" },
                  address: { type: "string", description: "Physical address if found, or empty string" },
                  instagramHandle: { type: "string", description: "Instagram handle (e.g. @drarenata) or URL, or empty string" },
                  whatsappNumber: { type: "string", description: "WhatsApp number in international format if found, or empty string" },
                  businessName: { type: "string", description: "The business/brand name" },
                  niche: { type: "string", description: "Type of business / specialty area" },
                  location: { type: "string", description: "City and neighborhood if mentioned, or empty string" },
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
