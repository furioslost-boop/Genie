
import React, { useState, useRef, useEffect } from 'react';
import { AdRequest, Platform, AspectRatio, BrandAssets, CreativeType } from '../types';
import { 
  Globe,
  Zap,
  Sparkles,
  ChevronUp,
  ChevronDown,
  Palette,
  Maximize2,
  Smartphone,
  Monitor,
  Layout,
  Rocket,
  Trash2,
  RefreshCw,
  Upload,
  Search,
  Target,
  PenTool,
  BrainCircuit,
  Camera,
  Brush,
  Type as TypeIcon,
  Utensils,
  UserCheck
} from 'lucide-react';
import { analyzeMoodboard, analyzeBrandPresence } from '../services/geminiService';

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
  const [analyzingURL, setAnalyzingURL] = useState(false);
  
  const menuRef = useRef<HTMLDivElement>(null);
  
  const creativeTypes: { id: CreativeType, label: string, icon: any }[] = [
    { id: 'Ultra-Realista', label: 'Foto Ultra-Realista', icon: Camera },
    { id: 'Apenas Texto (Tipográfico)', label: 'Apenas Texto', icon: TypeIcon },
    { id: 'Híbrido', label: 'Híbrido / Mix (Foto + Texto + Ilus.)', icon: Sparkles }
  ];

  const designConcepts = [
    { id: "Criativo (Eye-catching)", label: "Criativo / Impactante", desc: "Ângulos ousados e cores vivas", icon: Sparkles },
    { id: "Food / Gastronomia", label: "Gastronomia / Food", desc: "Appetite appeal e frescor", icon: Utensils },
    { id: "Lifestyle / Humano", label: "Lifestyle / Real", desc: "Cenas do cotidiano e conexão", icon: UserCheck },
    { id: "Minimalista / Clean", label: "Minimalista", desc: "Espaços amplos e foco total", icon: Layout },
    { id: "Corporativo / Sério", label: "Executivo / Sério", desc: "Elegante e direto", icon: Target }
  ];

  const platforms: Platform[] = ['Meta', 'Google', 'LinkedIn', 'TikTok'];
  const ratios: { label: string; value: AspectRatio; icon: any }[] = [
    { label: 'Feed (1:1)', value: '1:1', icon: Layout },
    { label: 'Instagram (4:5)', value: '4:5', icon: Smartphone },
    { label: 'Reels (9:16)', value: '9:16', icon: Smartphone },
    { label: 'Widescreen (16:9)', value: '16:9', icon: Monitor },
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
      const dna = await analyzeBrandPresence(request.brandAssets.brandUrl);
      const prev = request.brandAssets.extractedStyle || "";
      handleBrandChange('extractedStyle', `DNA DIGITAL: ${dna}\n\n${prev}`.trim());
    } catch (e) {
      console.error(e);
    } finally {
      setAnalyzingURL(false);
    }
  };

  const removeImage = async (index: number) => {
    const current = request.brandAssets?.moodboardImages || [];
    const updated = current.filter((_, i) => i !== index);
    const updatedBrandAssets = handleBrandChange('moodboardImages', updated);
    if (updated.length > 0) {
      const style = await analyzeMoodboard(updated);
      onChange({ ...request, brandAssets: { ...updatedBrandAssets, extractedStyle: style } });
    } else {
      handleBrandChange('extractedStyle', '');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []) as File[];
    if (files.length === 0) return;
    const newPromises = files.map(file => {
      return new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = async () => resolve(await resizeBase64(reader.result as string));
        reader.readAsDataURL(file);
      });
    });
    const newBase64s = await Promise.all(newPromises);
    const current = request.brandAssets?.moodboardImages || [];
    const combined = [...current, ...newBase64s].slice(-10);
    const updated = handleBrandChange('moodboardImages', combined);
    const style = await analyzeMoodboard(combined);
    onChange({ ...request, brandAssets: { ...updated, extractedStyle: style } });
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
      {/* Brand Assets Accordion */}
      <section className="space-y-3">
        <button 
          onClick={() => setShowBrandAssets(!showBrandAssets)}
          className={`w-full py-3 px-4 rounded-xl border flex items-center justify-between transition-all ${
            showBrandAssets ? 'bg-indigo-600/10 border-indigo-500' : 'bg-white/5 border-white/10 hover:border-indigo-500/50'
          }`}
        >
          <div className="flex items-center gap-3">
            <Palette className={`w-4 h-4 ${showBrandAssets ? 'text-indigo-400' : 'text-slate-400'}`} />
            <span className="text-[11px] font-black uppercase tracking-widest text-slate-400">Identidade de Referência</span>
          </div>
          {showBrandAssets ? <ChevronUp className="w-4 h-4 text-indigo-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </button>

        {showBrandAssets && (
          <div className="p-4 bg-white/5 border border-white/5 rounded-2xl space-y-5 animate-in slide-in-from-top-2 duration-300">
            <div className="space-y-2">
               <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">URL da Marca (Opcional)</label>
               <div className="flex gap-2">
                 <input 
                   type="text" 
                   placeholder="Instagram ou Site"
                   value={request.brandAssets?.brandUrl || ''}
                   onChange={(e) => handleBrandChange('brandUrl', e.target.value)}
                   className="flex-1 bg-black/40 border border-white/10 rounded-lg p-2.5 text-[10px] text-white outline-none focus:border-indigo-500"
                 />
                 <button 
                   onClick={handleURLAnalysis}
                   disabled={analyzingURL || !request.brandAssets?.brandUrl}
                   className="px-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 disabled:opacity-50"
                 >
                   <RefreshCw className={`w-3.5 h-3.5 ${analyzingURL ? 'animate-spin' : ''}`} />
                 </button>
               </div>
            </div>

            <div className="space-y-3">
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">Inspirar Cores/Vibe (Até 10)</label>
              <div className="grid grid-cols-5 gap-1.5">
                {request.brandAssets?.moodboardImages?.map((img, idx) => (
                  <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-white/10 group shadow-md">
                    <img src={img} className="w-full h-full object-cover" />
                    <button 
                      onClick={() => removeImage(idx)}
                      className="absolute inset-0 bg-red-600/90 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {(request.brandAssets?.moodboardImages?.length || 0) < 10 && (
                  <label className="aspect-square border-2 border-dashed border-white/10 rounded-lg flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-indigo-500/50 hover:bg-white/5 transition-all">
                    <Upload className="w-4 h-4 text-slate-500" />
                    <input type="file" multiple accept="image/*" onChange={handleFileUpload} className="hidden" />
                  </label>
                )}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Creative Type Selection - MULTISELECT ENABLED */}
      <section className="space-y-3">
        <label className={`text-[10px] font-bold ${colors.label} uppercase tracking-[0.2em] flex items-center gap-2`}>
           <Camera className="w-3.5 h-3.5" /> Técnica de Renderização (Selecione um ou mais)
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {creativeTypes.map(t => {
            const isSelected = request.creativeType.includes(t.id);
            return (
              <button
                key={t.id}
                onClick={() => {
                  const current = request.creativeType || [];
                  const updated = isSelected 
                    ? current.filter(x => x !== t.id) 
                    : [...current, t.id];
                  // Lógica de toggle: se clicar em um selecionado, ele remove. 
                  // Permitimos remover todos aqui, o geminiService lidará com o padrão.
                  handleChange('creativeType', updated);
                }}
                className={`py-3 px-3 text-[9px] font-bold rounded-xl border transition-all flex flex-col items-center gap-2 ${
                  isSelected 
                  ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg scale-[1.02]' 
                  : `${colors.inputBg} ${colors.inputBorder} text-slate-500 hover:border-indigo-500/50`
                }`}
              >
                <t.icon className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-slate-400'}`} />
                <span className="text-center leading-tight">{t.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Design Concept Selection */}
      <section className="space-y-3">
        <label className={`text-[10px] font-bold ${colors.label} uppercase tracking-[0.2em] flex items-center gap-2`}>
           <Layout className="w-3.5 h-3.5" /> Estilo de Layout
        </label>
        <div className="grid grid-cols-1 gap-2">
          {designConcepts.map(s => (
            <button
              key={s.id}
              onClick={() => handleChange('designConcept', s.id)}
              className={`py-3 px-4 text-[10px] font-bold rounded-xl border transition-all text-left flex items-center justify-between ${
                request.designConcept === s.id 
                ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg' 
                : `${colors.inputBg} ${colors.inputBorder} text-slate-500 hover:border-indigo-500/50`
              }`}
            >
              <div className="flex items-center gap-3">
                <s.icon className={`w-4 h-4 ${request.designConcept === s.id ? 'text-white' : 'text-indigo-400'}`} />
                <div>
                  <span className="block font-black">{s.label}</span>
                  <span className={`text-[8px] uppercase tracking-widest ${request.designConcept === s.id ? 'text-white/70' : 'text-slate-400'}`}>{s.desc}</span>
                </div>
              </div>
              {request.designConcept === s.id && <Sparkles className="w-3.5 h-3.5 animate-pulse" />}
            </button>
          ))}
        </div>
      </section>

      {/* Format Options */}
      <div className="grid grid-cols-2 gap-4">
        <section className="space-y-3">
          <label className={`text-[10px] font-bold ${colors.label} uppercase tracking-[0.2em]`}>Rede Social</label>
          <select 
            value={request.platform}
            onChange={(e) => handleChange('platform', e.target.value)}
            className={`w-full py-2.5 px-3 text-[10px] font-bold rounded-xl border ${colors.inputBg} ${colors.inputBorder} ${colors.text} outline-none focus:border-indigo-500`}
          >
            {platforms.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </section>

        <section className="space-y-3">
          <label className={`text-[10px] font-bold ${colors.label} uppercase tracking-[0.2em]`}>Formato</label>
          <select 
            value={request.aspectRatio}
            onChange={(e) => handleChange('aspectRatio', e.target.value)}
            className={`w-full py-2.5 px-3 text-[10px] font-bold rounded-xl border ${colors.inputBg} ${colors.inputBorder} ${colors.text} outline-none focus:border-indigo-500`}
          >
            {ratios.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
        </section>
      </div>

      {/* Master Instruction Prompt */}
      <section className="space-y-3">
        <label className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em] flex items-center gap-2">
          <BrainCircuit className="w-4 h-4" /> Instrução Master da Prompt
        </label>
        <div className="space-y-3">
          <input
            type="text"
            value={request.productName}
            onChange={(e) => handleChange('productName', e.target.value)}
            className={`w-full ${colors.inputBg} border ${colors.inputBorder} focus:border-indigo-500 rounded-xl p-3.5 text-[11px] font-bold ${colors.text} outline-none ${colors.placeholder}`}
            placeholder="Ex: Hambúrguer Artesanal, Consultoria, Curso..."
          />
          <div className="relative">
            <textarea
              value={request.creativeDirection}
              onChange={(e) => handleChange('creativeDirection', e.target.value)}
              rows={6}
              className={`w-full ${colors.promptBg} border ${colors.inputBorder} p-4 text-[11px] ${colors.text} rounded-2xl outline-none focus:border-indigo-500 resize-none leading-relaxed shadow-inner`}
              placeholder="Descreva a cena, o texto que deve estar escrito (100% correto) e os elementos que quer ver. Ex: 'Um hambúrguer suculento com o texto: Sabor Incomparável'."
            />
            <div className="absolute bottom-4 right-4 text-indigo-500 opacity-20">
              <PenTool className="w-8 h-8" />
            </div>
          </div>
        </div>
      </section>

      {/* Generate Action */}
      <div className="pt-4 relative" ref={menuRef}>
        {showQtyMenu && !isLoading && (
          <div className={`absolute bottom-full left-0 w-full mb-2 ${theme === 'dark' ? 'bg-[#1a1a1a] border-[#333]' : 'bg-white border-slate-200'} border rounded-2xl shadow-2xl overflow-hidden z-50`}>
            <div className="grid grid-cols-1 divide-y divide-slate-100 dark:divide-[#333]">
              {[1, 3, 5, 10, 20].map((qty) => (
                <button
                  key={qty}
                  onClick={() => { onGenerate(qty); setShowQtyMenu(false); }}
                  className="w-full px-5 py-4 text-left hover:bg-indigo-600 hover:text-white transition-all flex items-center justify-between group"
                >
                  <span className="text-[10px] font-black uppercase tracking-widest">Explodir {qty} Criativos</span>
                  {qty >= 5 && <Zap className="w-3.5 h-3.5 text-amber-400 fill-current" />}
                </button>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={() => setShowQtyMenu(!showQtyMenu)}
          disabled={isLoading || !request.productName || !request.creativeDirection}
          className="w-full py-5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white font-black rounded-2xl text-[11px] flex items-center justify-center gap-3 transition-all shadow-xl active:scale-[0.98] group uppercase tracking-[0.2em]"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Sincronizando Ortografia...</span>
            </>
          ) : (
            <>
              <Rocket className="w-4 h-4" />
              <span>Gerar Anúncios</span>
              <ChevronUp className="w-4 h-4 opacity-50" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default AdForm;
