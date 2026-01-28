
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

export const analyzeMoodboard = async (imagesBase64: string[]): Promise<string> => {
  return callWithRetry(async () => {
    const ai = getAIClient();
    const parts = imagesBase64.slice(0, 3).map(b => ({ 
      inlineData: { data: b.includes(',') ? b.split(',')[1] : b, mimeType: "image/jpeg" } 
    }));
    
    const prompt = `Analise tecnicamente estas referências para extrair a ESSÊNCIA VISUAL:
    1. PALETA: Quais as cores dominantes?
    2. ESTILO: É minimalista, carregado, rústico ou high-tech?
    3. ILUMINAÇÃO: Direção da luz e contraste.
    
    Retorne apenas dados técnicos para que a nova imagem herde esta IDENTIDADE PARCIAL.`;

    const res = await ai.models.generateContent({ 
      model: 'gemini-3-flash-preview', 
      contents: { parts: [...parts, { text: prompt } as any] } 
    });
    return res.text?.trim() || "Estilo base capturado.";
  });
};

export const generateCompleteCreative = async (req: AdRequest, index: number): Promise<AdCreative> => {
  return callWithRetry(async () => {
    const ai = getAIClient();
    const brandDna = req.brandAssets?.extractedStyle || "Estilo Visual Harmonizado";
    
    // 1. Planejamento Criativo e Copy (Raciocínio Pro)
    const copyPrompt = `Você é um Diretor de Criação premiado. 
    INSTRUÇÃO DO USUÁRIO: "${req.creativeDirection}"
    CONCEITO ESCOLHIDO: ${req.designConcept}
    PRODUTO: ${req.productName}
    TOM: ${req.tone}

    Sua tarefa é planejar o copy do anúncio. O texto DEVE estar 100% correto ortograficamente em PT-BR.
    Se o usuário especificou um texto para a imagem na instrução master, inclua-o no campo 'headline'.

    Responda apenas em JSON:
    {"hook":"uma frase de abertura impossível de ignorar","headline":"O TÍTULO EXATO SOLICITADO PELO USUÁRIO","primaryText":"texto persuasivo detalhado","cta":"chamada para ação curta"}`;

    const copyRes = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: copyPrompt,
      config: { responseMimeType: "application/json" }
    });
    
    const copy: AdCopy = JSON.parse(copyRes.text);

    // 2. Renderização da Imagem (Foco em Ortografia e Estilo)
    const activeTypes = req.creativeType.length > 0 ? req.creativeType : ['Ultra-Realista'];
    let styleBase = "ESTILOS VISUAIS SELECIONADOS: " + activeTypes.join(", ") + ". ";
    
    if (activeTypes.includes('Ultra-Realista')) {
      styleBase += "PHOTOREALISTIC 8K, cinematic lighting, shot on Sony A7R IV, high-end commercial photography, depth of field, sharp focus. ";
    } 
    if (activeTypes.includes('Apenas Texto (Tipográfico)')) {
      styleBase += "TYPOGRAPHIC DESIGN, focus 100% on text layout, elegant fonts, creative graphic design. TEXT TO WRITE: '" + copy.headline + "'. ENSURE 100% CORRECT SPELLING. ";
    }
    if (activeTypes.includes('Híbrido')) {
      styleBase += "HYBRID FUSION: A seamless blend of PHOTOREALISTIC 8K textures, ARTISTIC DIGITAL ILLUSTRATION elements, and BOLD TYPOGRAPHIC design. Mix reality with creative graphics. ";
    }

    // Se for Food/Gastronomia, adicionar instruções específicas
    if (req.designConcept.includes("Food")) {
      styleBase += " APPETIZING, steam, condensation, professional food styling, vibrant fresh ingredients, macro food details.";
    }

    const imagePrompt = `PUBLICITY CREATIVE MASTER:
    ${styleBase}
    
    CENA SOLICITADA PELO USUÁRIO: "${req.creativeDirection}"
    OBJETIVO: Renderizar exatamente o que o usuário pediu, usando a referência de cores: ${brandDna}.
    
    REGRAS DE OURO:
    1. Se houver texto, ele DEVE estar escrito corretamente: '${copy.headline}'. Não aceite erros ortográficos.
    2. Respeite o conceito de layout: ${req.designConcept}.
    3. Se o estilo 'Ultra-Realista' estiver selecionado, a qualidade deve ser fotográfica extrema.
    4. No estilo 'Híbrido', integre harmoniosamente elementos reais, ilustrações e tipografia moderna.
    5. Integre a identidade visual da referência apenas se fizer sentido para a cena solicitada.`;

    const imageParts: any[] = [];
    if (req.brandAssets?.moodboardImages?.length) {
      const refImg = req.brandAssets.moodboardImages[0];
      imageParts.push({ 
        inlineData: { mimeType: "image/jpeg", data: refImg.includes(',') ? refImg.split(',')[1] : refImg } 
      });
    }
    imageParts.push({ text: imagePrompt });

    const imageRes = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: imageParts },
      config: {
        imageConfig: { aspectRatio: req.aspectRatio === '4:5' ? '3:4' : req.aspectRatio }
      }
    });

    const imgPart = imageRes.candidates?.[0]?.content?.parts.find(p => p.inlineData);
    const imageUrl = imgPart ? `data:image/png;base64,${imgPart.inlineData.data}` : '';

    return {
      id: Math.random().toString(36).substr(2, 9),
      index: index,
      copy,
      imageUrl,
      platform: req.platform,
      aspectRatio: req.aspectRatio,
      timestamp: Date.now()
    };
  });
};

export const analyzeBrandPresence = async (url: string): Promise<string> => {
  return callWithRetry(async () => {
    const ai = getAIClient();
    const prompt = `Analise o estilo visual de: ${url}. Foque em cores, tipografia e se é estilo Food, Lifestyle ou Corporativo. 30 palavras.`;
    const res = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: { tools: [{ googleSearch: {} }] }
    });
    return res.text || "Estilo base detectado.";
  });
};
