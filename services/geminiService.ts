
import { GoogleGenAI, Type } from "@google/genai";
import { AdRequest, AdCopy, BrandAssets } from "../types";

export const getAIClient = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

async function callWithRetry<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
  let lastError: any;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (err: any) {
      lastError = err;
      const msg = err.message || "";
      console.error(`Attempt ${i + 1} failed:`, msg);
      
      if (msg.includes("Requested entity was not found")) {
         throw new Error("API_KEY_NOT_FOUND");
      }
      if (msg.includes("503") || msg.includes("overloaded") || msg.includes("429") || msg.includes("Deadline exceeded")) {
        const waitTime = Math.pow(2, i) * 1000 + Math.random() * 500;
        await delay(waitTime);
        continue;
      }
      throw err;
    }
  }
  throw lastError;
}

export const analyzeMoodboard = async (base64Image: string): Promise<string> => {
  const ai = getAIClient();
  const prompt = `Analise esta imagem de referência de marca (moodboard). 
  Extraia o estilo visual, a paleta de cores predominante, a vibe do design (ex: minimalista, luxuoso, tech) e sugira uma tipografia que combine. 
  Responda de forma concisa em Português para ser usado como instrução de design.`;

  const response = await ai.models.generateContent({
    model: "gemini-flash-lite-latest",
    contents: {
      parts: [
        { inlineData: { mimeType: "image/jpeg", data: base64Image.split(',')[1] } },
        { text: prompt }
      ]
    }
  });
  return response.text || "";
};

export const generateAdCopy = async (req: AdRequest): Promise<AdCopy> => {
  return callWithRetry(async () => {
    const ai = getAIClient();
    const model = req.ultraSpeed ? "gemini-3-flash-preview" : "gemini-3-pro-preview";
    
    const brandContext = req.brandAssets?.extractedStyle ? `ESTILO VISUAL DA MARCA: ${req.brandAssets.extractedStyle}` : 'ESTILO: Design Publicitário Moderno de Alto Nível.';
    const colorContext = req.brandAssets?.colors?.length 
      ? `PALETA DE CORES DA MARCA: ${req.brandAssets.colors.join(', ')}` 
      : 'OBSERVAÇÃO: Use cores que transmitam autoridade, confiança e desejo de compra de acordo com o nicho do produto.';

    const prompt = `VOCÊ É O MAIOR REDATOR PUBLICITÁRIO DO MUNDO, MESTRE EM MARKETING DE RESPOSTA DIRETA (DRM).
    Crie uma copy extremamente persuasiva para ${req.platform} focada em conversão.
    
    PRODUTO: ${req.productName}
    BRIEFING: ${req.creativeDirection}
    TOM: ${req.tone}
    OBJETIVO: ${req.goal}
    ${brandContext}
    ${colorContext}
    
    Instruções Psicológicas:
    - O Hook deve interromper o scroll imediatamente.
    - A Headline deve focar no benefício principal ou em uma curiosidade impossível de ignorar.
    - O Primary Text deve usar a estrutura AIDA ou PAS (Problema, Agitação, Solução).
    
    Retorne um JSON estrito com:
    - hook: frase curta e explosiva.
    - headline: título curto, poderoso e direto.
    - primaryText: texto persuasivo e emocional (2-3 parágrafos curtos).
    - cta: chamada para ação irresistível.`;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            hook: { type: Type.STRING },
            headline: { type: Type.STRING },
            primaryText: { type: Type.STRING },
            cta: { type: Type.STRING },
          },
          required: ["hook", "headline", "primaryText", "cta"]
        }
      }
    });
    
    if (!response.text) throw new Error("Erro na geração da copy.");
    return JSON.parse(response.text.trim()) as AdCopy;
  });
};

export const generateAdImage = async (req: AdRequest): Promise<string> => {
  return callWithRetry(async () => {
    const ai = getAIClient();
    const isPro = !req.ultraSpeed;
    const modelName = isPro ? 'gemini-3-pro-image-preview' : 'gemini-2.5-flash-image';
    
    const brandContext = req.brandAssets?.extractedStyle ? `ESTILO VISUAL: ${req.brandAssets.extractedStyle}.` : 'ESTILO: Fotografia comercial de luxo, estética premium Apple/Nike.';
    const colorContext = req.brandAssets?.colors?.length 
      ? `PALETA: ${req.brandAssets.colors.join(', ')}.` 
      : 'CORES: Crie uma harmonia cromática profissional baseada em cores análogas ou complementares de alto contraste que combinem com o produto.';

    const promptText = `Gere um fundo fotográfico comercial de ultra-qualidade para o produto: "${req.productName}".
    DESCRIÇÃO CRIATIVA: ${req.creativeDirection}
    ${brandContext}
    ${colorContext}

    ESPECIFICAÇÕES TÉCNICAS DE DESIGN:
    - Iluminação de estúdio (Rim lighting, Softbox).
    - Composição de regra dos terços, focada em criar desejo.
    - Renderização fotorrealista com texturas detalhadas e profundidade de campo cinematográfica.
    - Estética limpa, organizada e moderna.
    - REQUISITO ABSOLUTO: SEM TEXTOS, NÚMEROS OU LETRAS DE QUALQUER TIPO. Apenas a imagem visual.
    - O resultado deve parecer um anúncio de revista de luxo ou um post de marca global de tecnologia.`;

    const parts: any[] = [{ text: promptText }];
    
    if (req.brandAssets?.moodboardImage) {
      parts.unshift({
        inlineData: {
          mimeType: "image/jpeg",
          data: req.brandAssets.moodboardImage.split(',')[1]
        }
      });
    }

    const apiAspectRatio = req.aspectRatio === '4:5' ? '3:4' : req.aspectRatio;

    const imageConfig: any = {
      aspectRatio: apiAspectRatio || "1:1",
    };

    if (isPro) {
      imageConfig.imageSize = "1K";
    }

    const response = await ai.models.generateContent({
      model: modelName,
      contents: { parts },
      config: {
        imageConfig,
      }
    });

    const candidate = response.candidates?.[0];
    if (!candidate) throw new Error("A IA não retornou resultados.");
    
    const imagePart = candidate.content.parts.find(p => p.inlineData);
    if (imagePart?.inlineData) {
      return `data:image/png;base64,${imagePart.inlineData.data}`;
    }

    const textPart = candidate.content.parts.find(p => p.text);
    if (textPart?.text) {
      throw new Error(`A geração foi recusada pela IA: ${textPart.text}`);
    }

    throw new Error("Erro desconhecido na geração da imagem.");
  });
};
