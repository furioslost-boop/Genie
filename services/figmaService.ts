
export const parseFigmaUrl = (url: string) => {
  const fileKeyMatch = url.match(/file\/([a-zA-Z0-9]+)\//);
  const nodeIdMatch = url.match(/node-id=([0-9:-]+)/);
  
  return {
    fileKey: fileKeyMatch ? fileKeyMatch[1] : null,
    nodeId: nodeIdMatch ? nodeIdMatch[1].replace('-', ':') : null
  };
};

export const fetchFigmaFrameImage = async (fileKey: string, nodeId: string, token: string): Promise<string> => {
  try {
    const response = await fetch(`https://api.figma.com/v1/images/${fileKey}?ids=${nodeId}&format=png&scale=2`, {
      headers: {
        'X-Figma-Token': token
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.err || 'Falha ao conectar com Figma');
    }

    const data = await response.json();
    const imageUrl = data.images[nodeId];

    if (!imageUrl) throw new Error('Frame não encontrado no arquivo');

    // Proxy para evitar problemas de CORS e converter para base64 para o Gemini
    const imgResponse = await fetch(imageUrl);
    const blob = await imgResponse.blob();
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error: any) {
    console.error('Figma Sync Error:', error);
    throw error;
  }
};
