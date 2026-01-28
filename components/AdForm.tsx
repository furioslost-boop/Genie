
import React, { useState, useRef, useEffect } from 'react';
import { AdRequest, Platform, AspectRatio, BrandAssets } from '../types';
import { 
  Globe,
  Zap,
  Sparkles,
  ChevronUp,
  Palette,
  Maximize2,
  Smartphone,
  Monitor,
  Layout,
  Rocket,
  Image as ImageIcon,
  Check,
  ChevronDown,
  Plus,
  Trash2,
  X,
  AlertCircle,
  RefreshCw,
  Upload,
  Instagram,
  Search
} from 'lucide-react';
import { analyzeMoodboard, analyzeBrandPresence } from '../services/geminiService';
import { parseFigmaUrl, fetchFigmaFrameImage } from '../services/figmaService';

interface AdFormProps {
  request: AdRequest;
  onChange: (req: AdRequest) => void;
  onGenerate: (qty: number) => void;
  isLoading: boolean;
  theme: 'dark' | 'light';
}

const resizeBase64 = (base64Str: string, maxWidth = 800, maxHeight = 800): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;
      if (width > height) {
        if (width > maxWidth) {
          height *= maxWidth / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width *= maxHeight / height;
          height = maxHeight;
        }
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', 0.8));
    };
  });
};

const AdForm: React.FC<AdFormProps> = ({ request, onChange, onGenerate, isLoading, theme }) => {
  const [showQtyMenu, setShowQtyMenu] = useState(false);
  const [showBrandAssets, setShowBrandAssets] = useState(false);
  const [analyzingStyle, setAnalyzingStyle] = useState(false);
  const [syncingFigma, setSyncingFigma] = useState(false);
  const [analyzingURL, setAnalyzingURL] = useState(false);
  
  const menuRef = useRef<HTMLDivElement>(null);
  
  const platforms: Platform[] = ['Meta', 'Google', 'LinkedIn', 'TikTok'];
  const ratios: { label: string; value: AspectRatio; icon: any }[] = [
    { label: 'Feed (1:1)', value: '1:1', icon: Layout },
    { label: 'Instagram (4:5)', value: '4:5', icon: Smartphone },
    { label: 'Portrait (3:4)', value: '3:4', icon: Smartphone },
    { label: 'Reels (9:16)', value: '9:16', icon: Smartphone },
    { label: 'Horizontal (16:9)', value: '16:9', icon: Monitor },
  ];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowQtyMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleChange = (field: keyof AdRequest, value: any) => {
    onChange({ ...request, [field]: value });
  };

  const handleBrandChange = (field: keyof BrandAssets, value: any) => {
    const updatedBrandAssets = {
      ...(request.brandAssets || { colors: [], moodboardImages: [] }),
      [field]: value
    };
    onChange({ ...request, brandAssets: updatedBrandAssets });
    return updatedBrandAssets;
  };

  const handleURLAnalysis = async () => {
    if (!request.brandAssets?.brandUrl) return;
    setAnalyzingURL(true);
    try {
      const styleDna = await analyzeBrandPresence(request.brandAssets.brandUrl);
      const currentDna = request.brandAssets.extractedStyle || "";
      handleBrandChange('extractedStyle', `${currentDna}\n\nDNA ONLINE: ${styleDna}`.trim());
    } catch (e) {
      console.error("Erro na análise de URL:", e);
    } finally {
      setAnalyzingURL(false);
    }
  };

  const handleFigmaSync = async () => {
    const url = request.brandAssets?.figmaUrl;
    const token = request.brandAssets?.figmaToken;
    if (!url || !token) return;
    setSyncingFigma(true);
    try {
      const { fileKey, nodeId } = parseFigmaUrl(url);
      if (!fileKey || !nodeId) throw new Error("Link inválido");
      const rawImage = await fetchFigmaFrameImage(fileKey, nodeId, token);
      const optimizedImage = await resizeBase64(rawImage);
      const currentImages = request.brandAssets?.moodboardImages || [];
      const newImages = [...currentImages, optimizedImage].slice(-5);
      const updated = handleBrandChange('moodboardImages', newImages);
      const style = await analyzeMoodboard(newImages);
      onChange({ ...request, brandAssets: { ...updated, extractedStyle: style } });
    } catch (err) {
      console.error(err);
    } finally {
      setSyncingFigma(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []) as File[];
    if (files.length === 0) return;
    setAnalyzingStyle(true);
    const newImagePromises = files.map(file => {
      return new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = async () => {
          const resized = await resizeBase64(reader.result as string);
          resolve(resized);
        };
        reader.readAsDataURL(file);
      });
    });
    const newBase64s = await Promise.all(newImagePromises);
    const currentImages = request.brandAssets?.moodboardImages || [];
    const combined = [...currentImages, ...newBase64s].slice(-5);
    const updatedBrandAssets = handleBrandChange('moodboardImages', combined);
    try {
      const style = await analyzeMoodboard(combined);
      onChange({ ...request, brandAssets: { ...updatedBrandAssets, extractedStyle: style } });
    } finally {
      setAnalyzingStyle(false);
    }
  };

  const colors = {
    label: 'text-slate-500',
    inputBg: theme === 'dark' ? 'bg-[#2d2d2d]' : 'bg-slate-100',
    inputBorder: theme === 'dark' ? 'border-[#2d2d2d]' : 'border-slate-200',
    text: theme === 'dark' ? 'text-white' : 'text-slate-900',
    placeholder: theme === 'dark' ? 'placeholder:text-slate-600' : 'placeholder:text-slate-400',
    promptBg: theme === 'dark' ? 'bg-[#1e1e1e]' : 'bg-white',
  };

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <button 
          onClick={() => setShowBrandAssets(!showBrandAssets)}
          className={`w-full py-3 px-4 rounded-xl border flex items-center justify-between transition-all ${
            showBrandAssets ? 'bg-indigo-600/10 border-indigo-500' : 'bg-white/5 border-white/10 hover:border-indigo-500/50'
          }`}
        >
          <div className="flex items-center gap-3">
            <Palette className={`w-4 h-4 ${showBrandAssets ? 'text-indigo-400' : 'text-slate-400'}`} />
            <span className={`text-[11px] font-black uppercase tracking-widest ${showBrandAssets ? 'text-indigo-400' : 'text-slate-400'}`}>DNA de Marca & Estilo</span>
          </div>
          {showBrandAssets ? <ChevronUp className="w-4 h-4 text-indigo-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </button>

        {showBrandAssets && (
          <div className="p-4 bg-white/5 border border-white/5 rounded-2xl space-y-5 animate-in slide-in-from-top-2 duration-300">
            {/* URL/Instagram Analysis */}
            <div className="space-y-3 p-3 bg-indigo-500/5 rounded-xl border border-indigo-500/10">
              <div className="flex items-center gap-2 mb-1">
                <Search className="w-3.5 h-3.5 text-indigo-400" />
                <span className="text-[10px] font-black text-white uppercase tracking-widest">Análise de Site/Insta</span>
              </div>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="https://marca.com ou @usuario"
                  value={request.brandAssets?.brandUrl || ''}
                  onChange={(e) => handleBrandChange('brandUrl', e.target.value)}
                  className="flex-1 bg-black/40 border border-white/10 rounded-lg p-2.5 text-[10px] text-white outline-none focus:border-indigo-500"
                />
                <button 
                  onClick={handleURLAnalysis}
                  disabled={analyzingURL || !request.brandAssets?.brandUrl}
                  className="px-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 disabled:opacity-50 transition-all"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${analyzingURL ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {/* Figma Sync */}
            <div className="space-y-3 p-3 bg-black/20 rounded-xl border border-white/5">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-4 h-4 bg-[#F24E1E] rounded-md flex items-center justify-center">
                   <svg width="8" height="12" viewBox="0 0 38 57" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M19 28.5C19 25.9834 20.0009 23.57 21.7825 21.7885C23.5641 20.0069 25.9774 19.006 28.494 19.006C31.0106 19.006 33.424 20.0069 35.2055 21.7885C36.9871 23.57 37.988 25.9834 37.988 28.5Z" fill="#1ABCFE"/><path d="M0 47.494C0 44.9774 1.00089 42.5641 2.78249 40.7825C4.56408 39.0009 6.97739 38 9.494 38H19V47.494C19 50.0106 17.9991 52.424 16.2175 54.2055C14.4359 55.9871 12.0226 56.988 9.494 56.988C6.97739 56.988 4.56408 55.9871 2.78249 54.2055C1.00089 52.424 0 50.0106 0 47.494Z" fill="#0ACF83"/><path d="M0 28.5C0 25.9834 1.00089 23.57 2.78249 21.7885C4.56408 20.0069 6.97739 19.006 9.494 19.006H19V38H9.494C6.97739 38 4.56408 36.9991 2.78249 35.2175C1.00089 33.4359 0 31.0226 0 28.5Z" fill="#A259FF"/><path d="M0 9.5C0 6.98343 1.00089 4.57005 2.78249 2.78846C4.56408 1.00687 6.97739 0.00601244 9.494 0.00601244H19V19H9.494C6.97739 19 4.56408 17.9991 2.78249 16.2175C1.00089 14.4359 0 12.0226 0 9.5Z" fill="#F24E1E"/><path d="M19 0.00601244H28.5C31.0166 0.00601244 33.43 1.00687 35.2115 2.78846C36.9931 4.57005 37.994 6.98343 37.994 9.5C37.994 12.0166 36.9931 14.43 35.2115 16.2115C33.43 17.9931 31.0166 18.994 28.5 18.994H19V0.00601244Z" fill="#FF7262"/></svg>
                </div>
                <span className="text-[10px] font-black text-white uppercase tracking-widest">Figma Canvas Sync</span>
              </div>
              <div className="space-y-2">
                <input 
                  type="text" 
                  placeholder="URL do Frame"
                  value={request.brandAssets?.figmaUrl || ''}
                  onChange={(e) => handleBrandChange('figmaUrl', e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-[10px] text-white outline-none focus:border-[#F24E1E]/50"
                />
                <button 
                  onClick={handleFigmaSync}
                  disabled={syncingFigma}
                  className="w-full py-2.5 bg-[#F24E1E]/10 hover:bg-[#F24E1E]/20 text-[#F24E1E] border border-[#F24E1E]/30 rounded-lg text-[9px] font-black uppercase flex items-center justify-center gap-2 transition-all"
                >
                  <RefreshCw className={`w-3 h-3 ${syncingFigma ? 'animate-spin' : ''}`} />
                  {syncingFigma ? 'Sincronizando...' : 'Capturar Referência Figma'}
                </button>
              </div>
            </div>

            {/* Moodboard */}
            <div className="space-y-3">
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Galeria de Referências (Moodboard)</label>
              <div className="grid grid-cols-5 gap-1.5">
                {request.brandAssets?.moodboardImages?.map((img, idx) => (
                  <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-white/10 group/img shadow-md">
                    <img src={img} className="w-full h-full object-cover" />
                  </div>
                ))}
                {(request.brandAssets?.moodboardImages?.length || 0) < 5 && (
                  <label className="aspect-square border-2 border-dashed border-white/10 rounded-lg flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-indigo-500/50 hover:bg-white/5 transition-all">
                    <Upload className="w-4 h-4 text-slate-500" />
                    <input type="file" multiple accept="image/*" onChange={handleFileUpload} className="hidden" />
                  </label>
                )}
              </div>
            </div>

            {/* Extracted DNA Info */}
            {request.brandAssets?.extractedStyle && (
              <div className="p-3 bg-black/40 rounded-xl border border-white/5 space-y-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  <span className="text-[9px] font-black text-amber-400 uppercase tracking-widest">DNA Visual Identificado</span>
                </div>
                <p className="text-[10px] text-slate-400 italic leading-relaxed line-clamp-3">
                  {request.brandAssets.extractedStyle}
                </p>
              </div>
            )}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <label className={`text-[10px] font-bold ${colors.label} uppercase tracking-[0.2em] flex items-center gap-2`}>
           <Globe className="w-3 h-3" /> Plataforma
        </label>
        <div className="grid grid-cols-2 gap-1.5">
          {platforms.map(p => (
            <button
              key={p}
              onClick={() => handleChange('platform', p)}
              className={`py-2 px-3 text-[10px] font-bold rounded border transition-all ${
                request.platform === p 
                ? 'bg-indigo-600 border-indigo-500 text-white shadow-sm' 
                : `${colors.inputBg} ${colors.inputBorder} text-slate-500 hover:border-slate-400`
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <label className={`text-[10px] font-bold ${colors.label} uppercase tracking-[0.2em] flex items-center gap-2`}>
           <Maximize2 className="w-3 h-3" /> Formato
        </label>
        <div className="grid grid-cols-2 gap-2">
          {ratios.map(r => (
            <button
              key={r.label}
              onClick={() => handleChange('aspectRatio', r.value)}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 text-[9px] font-bold rounded border transition-all ${
                request.aspectRatio === r.value 
                ? 'bg-indigo-600 border-indigo-500 text-white' 
                : `${colors.inputBg} ${colors.inputBorder} text-slate-500`
              }`}
            >
              <r.icon className="w-3.5 h-3.5" />
              {r.label}
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <label className={`text-[10px] font-bold text-indigo-500 uppercase tracking-[0.2em]`}>Objetivo e Produto</label>
        <div className="space-y-2">
          <input
            type="text"
            value={request.productName}
            onChange={(e) => handleChange('productName', e.target.value)}
            className={`w-full ${colors.inputBg} border ${colors.inputBorder} focus:border-indigo-500 rounded-xl p-3.5 text-[11px] font-bold ${colors.text} outline-none ${colors.placeholder}`}
            placeholder="Nome do produto"
          />
          <textarea
            value={request.creativeDirection}
            onChange={(e) => handleChange('creativeDirection', e.target.value)}
            rows={4}
            className={`w-full ${colors.promptBg} border ${colors.inputBorder} p-4 text-[11px] ${colors.text} rounded-xl outline-none focus:border-indigo-500 resize-none leading-relaxed`}
            placeholder="Descreva a oferta ou o que deseja na imagem..."
          />
        </div>
      </section>

      <div className="pt-4 relative" ref={menuRef}>
        {showQtyMenu && !isLoading && (
          <div className={`absolute bottom-full left-0 w-full mb-2 ${theme === 'dark' ? 'bg-[#1a1a1a] border-[#333]' : 'bg-white border-slate-200'} border rounded-2xl shadow-2xl overflow-hidden z-50`}>
            <div className="grid grid-cols-1 divide-y divide-slate-100 dark:divide-[#333]">
              {[1, 3, 5, 10].map((qty) => (
                <button
                  key={qty}
                  onClick={() => { onGenerate(qty); setShowQtyMenu(false); }}
                  className="w-full px-5 py-4 text-left hover:bg-indigo-600 hover:text-white transition-all flex items-center justify-between group"
                >
                  <span className="text-[10px] font-black uppercase tracking-widest">Gerar {qty} criativos</span>
                  {qty >= 5 && <Zap className="w-3.5 h-3.5 text-amber-400 fill-current" />}
                </button>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={() => setShowQtyMenu(!showQtyMenu)}
          disabled={isLoading || !request.productName}
          className="w-full py-5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white font-black rounded-2xl text-[11px] flex items-center justify-center gap-3 transition-all shadow-xl active:scale-[0.98] group uppercase tracking-[0.2em]"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Sincronizando Identidade...</span>
            </>
          ) : (
            <>
              <Rocket className="w-4 h-4" />
              <span>Explodir Vendas</span>
              <ChevronUp className="w-4 h-4 opacity-50" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default AdForm;
