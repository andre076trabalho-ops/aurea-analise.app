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

    // Fetch the website HTML
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
      // Truncate to avoid token limits - keep head and first part of body
      if (htmlContent.length > 15000) {
        htmlContent = htmlContent.substring(0, 15000);
      }
    } catch (fetchError) {
      console.error("Failed to fetch website:", fetchError);
      return new Response(
        JSON.stringify({ error: "Não foi possível acessar o site. Verifique a URL." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("HTML fetched, sending to AI for analysis...");

    // Use Lovable AI to extract branding
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `You are a brand identity extractor. Analyze the HTML of a website and extract the brand colors and logo URL. Return ONLY a valid JSON object with no markdown formatting, no code blocks, just the raw JSON.`,
          },
          {
            role: "user",
            content: `Analyze this website HTML and extract the brand identity. Look for:
1. Primary color (the main brand color used in buttons, headers, accents)
2. Secondary color (background or complementary color)
3. Neutral color (text or subtle UI color)
4. Logo URL (look for <img> tags with "logo" in src, alt, class, or id; or <link rel="icon">; prefer SVG or PNG)

Return ONLY this JSON (no markdown, no code blocks):
{"primaryColor": "#hex", "secondaryColor": "#hex", "neutralColor": "#hex", "logoUrl": "absolute_url_or_null"}

Make sure all colors are valid hex colors. If the logo URL is relative, prepend the site domain. If you can't find a specific value, use reasonable defaults based on what you can see.

Website URL: ${formattedUrl}

HTML:
${htmlContent}`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_branding",
              description: "Extract brand colors and logo from a website",
              parameters: {
                type: "object",
                properties: {
                  primaryColor: { type: "string", description: "Primary brand color in hex format" },
                  secondaryColor: { type: "string", description: "Secondary/background color in hex format" },
                  neutralColor: { type: "string", description: "Neutral/text color in hex format" },
                  logoUrl: { type: "string", description: "Absolute URL to the company logo, or null if not found" },
                },
                required: ["primaryColor", "secondaryColor", "neutralColor"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "extract_branding" } },
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns segundos." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes. Adicione créditos ao seu workspace." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errorText);
      throw new Error("AI analysis failed");
    }

    const aiData = await aiResponse.json();
    console.log("AI response received");

    // Extract the tool call result
    let branding;
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      branding = JSON.parse(toolCall.function.arguments);
    } else {
      // Fallback: try parsing from content
      const content = aiData.choices?.[0]?.message?.content || "";
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        branding = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("Could not parse branding from AI response");
      }
    }

    console.log("Extracted branding:", branding);

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
