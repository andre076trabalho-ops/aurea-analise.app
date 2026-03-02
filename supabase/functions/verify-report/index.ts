import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { url, branding, reportData } = await req.json();
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

    // Fetch site HTML for verification
    let htmlContent = "";
    try {
      const siteResponse = await fetch(formattedUrl, {
        headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" },
        redirect: "follow",
      });
      htmlContent = await siteResponse.text();
      if (htmlContent.length > 50000) {
        htmlContent = htmlContent.substring(0, 50000);
      }
    } catch {
      console.error("Could not fetch site for verification");
      // If we can't fetch, return branding as-is but flag as unverified
      return new Response(JSON.stringify({ 
        success: true, 
        verified: false, 
        branding: branding || {},
        corrections: [],
        message: "Não foi possível acessar o site para verificação." 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Verifying branding data against site HTML...");

    const brandingJson = JSON.stringify(branding || {}, null, 2);
    const reportJson = reportData ? JSON.stringify(reportData, null, 2) : "Não fornecido";

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
            content: `You are a data verification agent. You compare extracted brand data against actual website HTML to find and correct errors.

## YOUR JOB:
1. Compare each field in the "extracted branding data" against what's ACTUALLY in the HTML.
2. For each field, determine if the extracted value matches the site.
3. If a value is WRONG, provide the correct value from the HTML.
4. If a value CANNOT be verified (not found in HTML), mark it for removal (set to empty string).
5. NEVER invent new data. Only correct with data that EXISTS in the HTML.

## SPECIFIC CHECKS:
- **instagramHandle**: Find actual instagram.com links in the HTML and extract the exact username. If no instagram link exists, set to empty string.
- **phone**: Find actual phone numbers displayed on the page. Must match exactly. Check for tel: links and visible text.
- **whatsappNumber**: Find wa.me links in the HTML. Extract the exact number.
- **location/address**: Find actual address text on the page. Do NOT infer from phone area codes.
- **services**: Compare against actual services/procedures listed on the page (menus, headings, cards).
- **businessName**: Must match what's displayed as the brand name.
- **bio**: Must be actual text from the page, not generated.`,
          },
          {
            role: "user",
            content: `Verify this extracted branding data against the actual website HTML. Fix any incorrect fields.

Website URL: ${formattedUrl}

EXTRACTED BRANDING DATA:
${brandingJson}

WEBSITE HTML:
${htmlContent}`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "verify_branding",
              description: "Return the verified/corrected branding data",
              parameters: {
                type: "object",
                properties: {
                  corrections: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        field: { type: "string", description: "Field name that was corrected" },
                        oldValue: { type: "string", description: "The incorrect value" },
                        newValue: { type: "string", description: "The corrected value from the HTML, or empty string if should be removed" },
                        reason: { type: "string", description: "Why this was corrected (in Portuguese)" },
                      },
                      required: ["field", "oldValue", "newValue", "reason"],
                      additionalProperties: false,
                    },
                    description: "List of corrections made. Empty array if all data is correct.",
                  },
                  verifiedBranding: {
                    type: "object",
                    properties: {
                      primaryColor: { type: "string" },
                      secondaryColor: { type: "string" },
                      neutralColor: { type: "string" },
                      logoUrl: { type: "string" },
                      bio: { type: "string" },
                      professionalPhotoUrl: { type: "string" },
                      businessPhotoUrl: { type: "string" },
                      services: { type: "array", items: { type: "string" } },
                      phone: { type: "string" },
                      email: { type: "string" },
                      address: { type: "string" },
                      instagramHandle: { type: "string" },
                      whatsappNumber: { type: "string" },
                      businessName: { type: "string" },
                      niche: { type: "string" },
                      location: { type: "string" },
                    },
                    required: ["primaryColor", "secondaryColor", "neutralColor"],
                    additionalProperties: false,
                    description: "The complete branding data after verification and corrections",
                  },
                },
                required: ["corrections", "verifiedBranding"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "verify_branding" } },
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns segundos." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await aiResponse.text();
      console.error("AI verify error:", aiResponse.status, errorText);
      // Return unverified if AI fails
      return new Response(JSON.stringify({ 
        success: true, verified: false, branding: branding || {}, corrections: [] 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall?.function?.arguments) {
      return new Response(JSON.stringify({ 
        success: true, verified: false, branding: branding || {}, corrections: [] 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = JSON.parse(toolCall.function.arguments);
    console.log("Verification complete. Corrections:", result.corrections?.length || 0);
    if (result.corrections?.length > 0) {
      console.log("Corrections:", JSON.stringify(result.corrections));
    }

    return new Response(JSON.stringify({
      success: true,
      verified: true,
      branding: result.verifiedBranding,
      corrections: result.corrections || [],
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("verify-report error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
