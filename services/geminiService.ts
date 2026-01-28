
import { GoogleGenAI, Type } from "@google/genai";
import { AdRequest, AdCopy, AdCreative } from "../types";

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
      const msg = (err.message || "").toLowerCase();
      const isRetryable = msg.includes("429") || msg.includes("503") || msg.includes("overloaded") || msg.includes("unavailable");
      if (isRetryable && i < maxRetries - 1) {
        await delay(500 + Math.random() * 500);
        continue;
      }
      break;
    }
  }
  throw lastError;
}

const VARIETY_STYLES = [
  "Fotografia comercial de estúdio, iluminação natural.",
  "Minimalismo elegante, render 3D clean.",
  "Estilo editorial premium, cores sóbrias.",
  "Design gráfico corporativo moderno.",
  "Composição fotográfica nítida.",
  "Layout publicitário contemporâneo."
];

/**
 * Analisa a presença online de uma marca para extrair o DNA visual.
 */
export const analyzeBrandPresence = async (url: string): Promise<string> => {
  return callWithRetry(async () => {
    const ai = getAIClient();
    const prompt = `Analise o site ou perfil social: ${url}. 
    Descreva detalhadamente a IDENTIDADE VISUAL da marca (paleta de cores predominante, estilo de fotografia, iluminação, tom de voz visual). 
    Seja específico para que um designer possa replicar o estilo. 
    Não use termos genéricos. Foque no que torna a marca única.`;

    const res = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }]
      }
    });
    return res.text || "Estilo Premium e Moderno";
  });
};

/**
 * Gera um criativo completo garantindo consistência de identidade visual.
 */
export const generateCompleteCreative = async (req: AdRequest, index: number): Promise<AdCreative> => {
  return callWithRetry(async () => {
    const ai = getAIClient();
    const style = VARIETY_STYLES[index % VARIETY_STYLES.length];
    const brandDna = req.brandAssets?.extractedStyle || "Estilo Moderno";
    
    // Prompt focado em CONSISTÊNCIA e IDENTIDADE COMPARTILHADA
    const prompt = `DIRETOR DE ARTE: Gere o criativo #${index + 1} para a marca "${req.productName}".
    
    IDENTIDADE VISUAL COMPARTILHADA (MANDATÓRIO):
    - DNA Visual da Marca: ${brandDna}
    - Referência Visual: Utilize as cores, texturas e luzes da imagem anexada.
    - TODOS os anúncios deste lote devem parecer parte da mesma campanha.
    
    RESTRIÇÃO DE DESIGN: 
    - NUNCA use elementos neon, luzes fluorescentes ou estética neon.
    - Mantenha um visual profissional, limpo e de alta conversão.
    - Estilo da Imagem: ${style}. Cena: ${req.creativeDirection}.
       
    COPY (PORTUGUÊS BRASIL): Zero erros gramaticais.
    JSON: {"hook":"frase","headline":"titulo","primaryText":"texto","cta":"acao"}
    
    Envie Imagem + JSON.`;

    const parts: any[] = [];
    if (req.brandAssets?.moodboardImages?.length) {
      // Usamos apenas a primeira imagem como âncora principal de estilo para economizar tokens e garantir foco
      const imgBase64 = req.brandAssets.moodboardImages[0];
      parts.push({ 
        inlineData: { 
          mimeType: "image/jpeg", 
          data: imgBase64.includes(',') ? imgBase64.split(',')[1] : imgBase64 
        } 
      });
    }
    parts.push({ text: prompt });

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts },
      config: {
        imageConfig: { 
          aspectRatio: req.aspectRatio === '4:5' ? '3:4' : req.aspectRatio 
        },
        systemInstruction: "Você é um especialista em Branding. Sua missão é garantir que cada imagem gerada siga RIGOROSAMENTE a identidade visual da marca descrita, criando uma unidade estética entre todos os criativos. Ortografia perfeita em PT-BR é obrigatória."
      }
    });

    const candidate = response.candidates?.[0];
    if (!candidate) throw new Error("A Engine não retornou dados.");

    let imageUrl = '';
    let copy: AdCopy = { hook: '', headline: '', primaryText: '', cta: '' };

    for (const part of candidate.content.parts) {
      if (part.inlineData) {
        imageUrl = `data:image/png;base64,${part.inlineData.data}`;
      } else if (part.text) {
        const jsonMatch = part.text.match(/{.*}/s);
        if (jsonMatch) {
          try { 
            const parsed = JSON.parse(jsonMatch[0]);
            copy = {
              hook: parsed.hook || '',
              headline: parsed.headline || '',
              primaryText: parsed.primaryText || '',
              cta: parsed.cta || ''
            };
          } catch (e) { /* ignore */ }
        }
      }
    }

    if (!imageUrl) imageUrl = await generateAdImage(req, copy, index);
    if (!imageUrl) throw new Error("Falha ao gerar visual.");

    return {
      id: Math.random().toString(36).substr(2, 9),
      copy,
      imageUrl,
      platform: req.platform,
      aspectRatio: req.aspectRatio,
      timestamp: Date.now()
    };
  });
};

export const generateAdCopy = async (req: AdRequest): Promise<AdCopy> => {
  return callWithRetry(async () => {
    const ai = getAIClient();
    const res = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Gere copy em PT-BR para: "${req.productName}". DNA Visual: ${req.brandAssets?.extractedStyle}. JSON: {"hook":"str","headline":"str","primaryText":"str","cta":"str"}`,
      config: { responseMimeType: "application/json" }
    });
    return JSON.parse(res.text.trim());
  });
};

export const generateAdImage = async (req: AdRequest, copy: AdCopy, styleIndex: number = 0): Promise<string> => {
  return callWithRetry(async () => {
    const ai = getAIClient();
    const style = VARIETY_STYLES[styleIndex % VARIETY_STYLES.length];
    const dna = req.brandAssets?.extractedStyle || "Estilo Premium";
    const prompt = `Campaign Ad. DNA: ${dna}. Subject: ${req.creativeDirection}. Style: ${style}. NO NEON. Clean. High Res.`;
    const parts: any[] = [];
    if (req.brandAssets?.moodboardImages?.length) {
      const img = req.brandAssets.moodboardImages[0];
      parts.push({ inlineData: { mimeType: "image/jpeg", data: img.includes(',') ? img.split(',')[1] : img } });
    }
    parts.push({ text: prompt });
    const res = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts },
      config: { imageConfig: { aspectRatio: req.aspectRatio === '4:5' ? '3:4' : req.aspectRatio } }
    });
    const imgPart = res.candidates?.[0]?.content?.parts.find(p => p.inlineData);
    return imgPart ? `data:image/png;base64,${imgPart.inlineData.data}` : '';
  });
};

export const analyzeMoodboard = async (imagesBase64: string[]): Promise<string> => {
  return callWithRetry(async () => {
    const ai = getAIClient();
    const parts = imagesBase64.slice(0, 1).map(b => ({ 
      inlineData: { data: b.includes(',') ? b.split(',')[1] : b, mimeType: "image/jpeg" } 
    }));
    parts.push({ text: "Descreva o DNA visual desta marca (cores, iluminação, estilo) em 20 palavras." } as any);
    const res = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: { parts } });
    return res.text?.trim() || "Estilo Visual Premium";
  });
};
