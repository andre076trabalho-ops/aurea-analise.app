/**
 * Gemini 2.5 API Integration
 * Generates intelligent analysis using Google's Gemini API
 */

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
  }>;
}

export async function generateAnalysisWithGemini(prompt: string): Promise<string> {
  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.statusText}`);
    }

    const data: GeminiResponse = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      throw new Error('No response from Gemini API');
    }

    return text;
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    throw error;
  }
}

export async function analyzeSiteWithAI(
  siteData: any,
  observations: string
): Promise<{ problems: string[]; opportunities: string[]; recommendations: string[] }> {
  const prompt = `Você é um especialista em SEO e análise de presença digital. Analise os dados do site e as observações do auditor, e forneça uma análise estruturada em JSON.

Dados do site:
- PageSpeed Mobile Score: ${siteData.pageSpeed?.mobileScore || 'N/A'}
- PageSpeed Desktop Score: ${siteData.pageSpeed?.desktopScore || 'N/A'}
- Mobile-Friendly: ${siteData.mobileResponsive ? 'Sim' : 'Não'}
- SSL/HTTPS: ${siteData.hasSSL ? 'Sim' : 'Não'}
- Google Analytics: ${siteData.hasGoogleAnalytics ? 'Sim' : 'Não'}
- Blog: ${siteData.hasBlog ? 'Sim' : 'Não'}

Observações do auditor: ${observations || 'Nenhuma'}

Forneça a resposta em JSON válido com este exato formato:
{
  "problems": ["problema 1", "problema 2"],
  "opportunities": ["oportunidade 1", "oportunidade 2"],
  "recommendations": ["recomendação 1", "recomendação 2"]
}

Seja específico e baseado nos dados fornecidos.`;

  try {
    const response = await generateAnalysisWithGemini(prompt);
    const parsed = JSON.parse(response);
    return {
      problems: Array.isArray(parsed.problems) ? parsed.problems : [],
      opportunities: Array.isArray(parsed.opportunities) ? parsed.opportunities : [],
      recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
    };
  } catch (error) {
    console.error('Error analyzing site with AI:', error);
    return { problems: [], opportunities: [], recommendations: [] };
  }
}

export async function analyzeInstagramWithAI(
  igData: any,
  observations: string
): Promise<{ problems: string[]; opportunities: string[]; recommendations: string[] }> {
  const prompt = `Você é um especialista em marketing de redes sociais. Analise os dados do Instagram e as observações do auditor.

Dados do Instagram:
- Seguidores: ${igData.followers || 'N/A'}
- Engajamento: ${igData.engagement || 'N/A'}
- Tem link na bio: ${igData.hasLinkInBio ? 'Sim' : 'Não'}
- Posts regulares: ${igData.postsFrequency || 'N/A'}

Observações do auditor: ${observations || 'Nenhuma'}

Forneça a resposta em JSON válido com este exato formato:
{
  "problems": ["problema 1"],
  "opportunities": ["oportunidade 1"],
  "recommendations": ["recomendação 1"]
}`;

  try {
    const response = await generateAnalysisWithGemini(prompt);
    const parsed = JSON.parse(response);
    return {
      problems: Array.isArray(parsed.problems) ? parsed.problems : [],
      opportunities: Array.isArray(parsed.opportunities) ? parsed.opportunities : [],
      recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
    };
  } catch (error) {
    console.error('Error analyzing Instagram with AI:', error);
    return { problems: [], opportunities: [], recommendations: [] };
  }
}

export async function analyzeGMNWithAI(
  gmnData: any,
  observations: string
): Promise<{ problems: string[]; opportunities: string[]; recommendations: string[] }> {
  const prompt = `Você é um especialista em Google Meu Negócio. Analise os dados do GMN e as observações do auditor.

Dados do GMN:
- Classificação: ${gmnData.rating || 'N/A'}
- Avaliações: ${gmnData.reviewCount || 'N/A'}
- Status de resposta: ${gmnData.responseRate || 'N/A'}
- Fotos: ${gmnData.photoCount || 'N/A'}

Observações do auditor: ${observations || 'Nenhuma'}

Forneça a resposta em JSON válido com este exato formato:
{
  "problems": ["problema 1"],
  "opportunities": ["oportunidade 1"],
  "recommendations": ["recomendação 1"]
}`;

  try {
    const response = await generateAnalysisWithGemini(prompt);
    const parsed = JSON.parse(response);
    return {
      problems: Array.isArray(parsed.problems) ? parsed.problems : [],
      opportunities: Array.isArray(parsed.opportunities) ? parsed.opportunities : [],
      recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
    };
  } catch (error) {
    console.error('Error analyzing GMN with AI:', error);
    return { problems: [], opportunities: [], recommendations: [] };
  }
}

export async function analyzePaidTrafficWithAI(
  paidData: any,
  observations: string
): Promise<{ problems: string[]; opportunities: string[]; recommendations: string[] }> {
  const prompt = `Você é um especialista em publicidade digital. Analise os dados de tráfego pago e as observações do auditor.

Dados de tráfego pago:
- Está ativo: ${paidData.isActive ? 'Sim' : 'Não'}
- Orçamento mensal: ${paidData.monthlyBudget || 'N/A'}
- Retorno: ${paidData.roi || 'N/A'}

Observações do auditor: ${observations || 'Nenhuma'}

Forneça a resposta em JSON válido com este exato formato:
{
  "problems": ["problema 1"],
  "opportunities": ["oportunidade 1"],
  "recommendations": ["recomendação 1"]
}`;

  try {
    const response = await generateAnalysisWithGemini(prompt);
    const parsed = JSON.parse(response);
    return {
      problems: Array.isArray(parsed.problems) ? parsed.problems : [],
      opportunities: Array.isArray(parsed.opportunities) ? parsed.opportunities : [],
      recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
    };
  } catch (error) {
    console.error('Error analyzing Paid Traffic with AI:', error);
    return { problems: [], opportunities: [], recommendations: [] };
  }
}

export async function analyzeCommercialWithAI(
  commercialData: any,
  observations: string
): Promise<{ problems: string[]; opportunities: string[]; recommendations: string[] }> {
  const prompt = `Você é um especialista em estratégia comercial e vendas digitais. Analise os dados comerciais e as observações do auditor.

Dados comerciais:
- CRM integrado: ${commercialData.hasCRM ? 'Sim' : 'Não'}
- WhatsApp integrado: ${commercialData.hasWhatsApp ? 'Sim' : 'Não'}
- Chat ao vivo: ${commercialData.hasLiveChat ? 'Sim' : 'Não'}
- Formulários: ${commercialData.hasForms ? 'Sim' : 'Não'}

Observações do auditor: ${observations || 'Nenhuma'}

Forneça a resposta em JSON válido com este exato formato:
{
  "problems": ["problema 1"],
  "opportunities": ["oportunidade 1"],
  "recommendations": ["recomendação 1"]
}`;

  try {
    const response = await generateAnalysisWithGemini(prompt);
    const parsed = JSON.parse(response);
    return {
      problems: Array.isArray(parsed.problems) ? parsed.problems : [],
      opportunities: Array.isArray(parsed.opportunities) ? parsed.opportunities : [],
      recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
    };
  } catch (error) {
    console.error('Error analyzing Commercial with AI:', error);
    return { problems: [], opportunities: [], recommendations: [] };
  }
}
