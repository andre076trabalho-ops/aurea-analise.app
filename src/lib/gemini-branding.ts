import axios from 'axios';

export async function geminiExtractBranding({ html, screenshotBuffer, apiKey }) {
  // Converte imagem para base64
  const imageBase64 = screenshotBuffer.toString('base64');

  // Prompt detalhado para extração
  const prompt = `Abaixo está o HTML e uma imagem (screenshot) de uma página de clínica médica. Extraia os seguintes campos exatamente como aparecem:
- Nome da clínica/profissional
- Especialidade
- CRM/RQE
- Serviços
- Localização (bairro, cidade, estado)
- Telefone
- Instagram

HTML:\n${html}\n`;

  const body = {
    contents: [
      {
        parts: [
          { text: prompt },
          {
            inline_data: {
              mime_type: 'image/png',
              data: imageBase64,
            },
          },
        ],
      },
    ],
  };

  const response = await axios.post(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-vision:generateContent?key=${apiKey}`,
    body,
    { headers: { 'Content-Type': 'application/json' } }
  );

  return response.data;
}
