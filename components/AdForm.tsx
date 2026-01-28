
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
  AlertCircle
} from 'lucide-react';
import { analyzeMoodboard } from '../services/geminiService';

interface AdFormProps {
  request: AdRequest;
  onChange: (req: AdRequest) => void;
  onGenerate: (qty: number) => void;
  isLoading: boolean;
  theme: 'dark' | 'light';
}

const AdForm: React.FC<AdFormProps> = ({ request, onChange, onGenerate, isLoading, theme }) => {
  const [showQtyMenu, setShowQtyMenu] = useState(false);
  const [showBrandAssets, setShowBrandAssets] = useState(false);
  const [analyzingStyle, setAnalyzingStyle] = useState(false);
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
    onChange({
      ...request,
      brandAssets: {
        ...(request.brandAssets || { colors: [] }),
        [field]: value
      }
    });
  };

  const addColor = () => {
    const currentColors = request.brandAssets?.colors || [];
    if (currentColors.length < 10) {
      handleBrandChange('colors', [...currentColors, '#4f46e5']);
    }
  };

  const removeColor = (index: number) => {
    const currentColors = request.brandAssets?.colors || [];
    const updated = currentColors.filter((_, i) => i !== index);
    handleBrandChange('colors', updated);
  };

  const updateColor = (index: number, color: string) => {
    const currentColors = [...(request.brandAssets?.colors || [])];
    currentColors[index] = color;
    handleBrandChange('colors', currentColors);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      handleBrandChange('moodboardImage', base64);
      
      setAnalyzingStyle(true);
      try {
        const style = await analyzeMoodboard(base64);
        handleBrandChange('extractedStyle', style);
      } catch (err) {
        console.error("Erro ao analisar moodboard:", err);
      } finally {
        setAnalyzingStyle(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const colors = {
    label: 'text-slate-500',
    inputBg: theme === 'dark' ? 'bg-[#2d2d2d]' : 'bg-slate-100',
    inputBorder: theme === 'dark' ? 'border-[#2d2d2d]' : 'border-slate-200',
    text: theme === 'dark' ? 'text-white' : 'text-slate-900',
    placeholder: theme === 'dark' ? 'placeholder:text-slate-600' : 'placeholder:text-slate-400',
    promptBg: theme === 'dark' ? 'bg-[#1e1e1e]' : 'bg-white',
  };

  const currentColors = request.brandAssets?.colors || [];

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
            <span className={`text-[11px] font-black uppercase tracking-widest ${showBrandAssets ? 'text-indigo-400' : 'text-slate-400'}`}>Ativos da Marca</span>
          </div>
          {showBrandAssets ? <ChevronUp className="w-4 h-4 text-indigo-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </button>

        {showBrandAssets && (
          <div className="p-4 bg-white/5 border border-white/5 rounded-2xl space-y-5 animate-in slide-in-from-top-2 duration-300">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Paleta (Até 10 cores)</label>
                {currentColors.length < 10 && (
                  <button onClick={addColor} className="p-1 hover:bg-white/10 rounded-full transition-colors">
                    <Plus className="w-3 h-3 text-indigo-400" />
                  </button>
                )}
              </div>
              
              {currentColors.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {currentColors.map((color, idx) => (
                    <div key={idx} className="relative group/color">
                      <input 
                        type="color" 
                        value={color} 
                        onChange={(e) => updateColor(idx, e.target.value)}
                        className="w-9 h-9 rounded-lg bg-transparent border-none cursor-pointer p-0 shadow-sm"
                      />
                      <button 
                        onClick={() => removeColor(idx)} 
                        className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover/color:opacity-100 transition-opacity"
                      >
                        <X className="w-2 h-2" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-3 border border-dashed border-white/10 rounded-xl flex items-center gap-2 bg-black/20">
                  <AlertCircle className="w-3 h-3 text-amber-500/50" />
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Sem referências de cores</span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Moodboard / Design Referência</label>
              <div className="relative group">
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleFileUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer z-10"
                />
                <div className={`w-full py-6 border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-2 transition-all ${
                  request.brandAssets?.moodboardImage ? 'border-green-500/50 bg-green-500/5' : 'border-white/10 hover:border-indigo-500/50'
                }`}>
                  {request.brandAssets?.moodboardImage ? (
                    <>
                      <img src={request.brandAssets.moodboardImage} className="w-12 h-12 object-cover rounded-lg mb-1" />
                      <span className="text-[9px] font-bold text-green-500 flex items-center gap-1 uppercase tracking-widest"><Check className="w-3 h-3" /> Imagem Ativa</span>
                    </>
                  ) : (
                    <>
                      <ImageIcon className="w-6 h-6 text-slate-500" />
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Subir Referência</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {analyzingStyle && (
              <div className="flex items-center gap-2 px-3 py-2 bg-indigo-500/10 rounded-lg animate-pulse">
                <Sparkles className="w-3 h-3 text-indigo-400" />
                <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest">IA Analisando Estilo...</span>
              </div>
            )}

            {request.brandAssets?.extractedStyle && (
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Estilo Extraído</label>
                <p className="text-[10px] text-slate-300 italic leading-relaxed">"{request.brandAssets.extractedStyle}"</p>
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
            placeholder="Descreva a oferta principal ou briefing visual..."
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
                  <span className="text-[10px] font-black uppercase tracking-widest">Gerar Lote de {qty}</span>
                  {qty >= 5 && <Zap className="w-3.5 h-3.5 text-amber-400 fill-current" />}
                </button>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={() => setShowQtyMenu(!showQtyMenu)}
          disabled={isLoading || !request.productName}
          className={`w-full py-5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white font-black rounded-2xl text-[11px] flex items-center justify-center gap-3 transition-all shadow-xl active:scale-[0.98] group uppercase tracking-[0.2em]`}
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Gerando...</span>
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
