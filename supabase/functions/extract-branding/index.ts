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

    // Gemini removido: apenas retorna HTML + texto OCR
    return new Response(JSON.stringify({ success: true, promptHtml }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
