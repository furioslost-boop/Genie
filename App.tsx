
import React, { useState, useEffect } from 'react';
import { Rocket, Box, Zap, Sun, Moon, Key, Sparkles, AlertTriangle } from 'lucide-react';
import { AdRequest, AdCreative, GenerationStatus } from './types';
import { generateCompleteCreative, analyzeBrandPresence } from './services/geminiService';
import AdForm from './components/AdForm';
import AdPreviewCard from './components/AdPreviewCard';
import Loader from './components/Loader';

const App: React.FC = () => {
  const [hasKey, setHasKey] = useState<boolean | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [request, setRequest] = useState<AdRequest>({
    productName: '', 
    description: '', 
    creativeDirection: '', 
    targetAudience: '',
    platform: 'Meta', 
    aspectRatio: '1:1', 
    ultraSpeed: true,
    designConcept: 'Criativo (Eye-catching)',
    creativeType: ['Ultra-Realista'], // Padrão ultra-realista como array
    tone: 'Sofisticado', 
    goal: 'Vendas', 
    quantity: 1, 
    brandAssets: { colors: [], moodboardImages: [], brandUrl: '' }
  });

  const [creatives, setCreatives] = useState<AdCreative[]>([]);
  const [status, setStatus] = useState<GenerationStatus>(GenerationStatus.IDLE);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    const checkKey = async () => {
      try {
        const has = await (window as any).aistudio.hasSelectedApiKey();
        setHasKey(has);
      } catch { setHasKey(false); }
    };
    checkKey();
  }, []);

  const handleGenerate = async (q = 1) => {
    if (!request.productName || !request.creativeDirection) return;
    
    setCreatives([]);
    setErrorMessage(null);
    setStatus(GenerationStatus.LOADING);
    
    try {
      let sharedDna = request.brandAssets?.extractedStyle || "";
      
      if (request.brandAssets?.brandUrl && !sharedDna.includes("DNA DIGITAL")) {
        try {
          const dna = await analyzeBrandPresence(request.brandAssets.brandUrl);
          sharedDna = `DNA DIGITAL: ${dna}\n\n${sharedDna}`.trim();
        } catch (e) { console.warn(e); }
      }

      const updatedRequest = {
        ...request,
        brandAssets: {
          ...(request.brandAssets || { colors: [], moodboardImages: [] }),
          extractedStyle: sharedDna || "Estilo Visual Consistente"
        }
      };

      if (request.ultraSpeed) {
        const tasks = Array.from({ length: q }).map(async (_, i) => {
          // Reduzido para 100ms para uma sincronização ultra-rápida real
          await new Promise(r => setTimeout(r, i * 100)); 
          try {
            const creative = await generateCompleteCreative(updatedRequest, i);
            setCreatives(prev => [...prev, creative]);
            return creative;
          } catch (e) {
            console.error(e);
            return null;
          }
        });
        await Promise.all(tasks);
        setStatus(GenerationStatus.SUCCESS);
      } else {
        for (let i = 0; i < q; i++) {
          const creative = await generateCompleteCreative(updatedRequest, i);
          setCreatives(prev => [...prev, creative]);
        }
        setStatus(GenerationStatus.SUCCESS);
      }
    } catch (err: any) {
      setErrorMessage(err.message || "A Engine Criativa falhou ao processar a prompt.");
      setStatus(GenerationStatus.ERROR);
    }
  };

  const uiColors = {
    bg: theme === 'dark' ? 'bg-[#0a0a0a]' : 'bg-white',
    border: theme === 'dark' ? 'border-white/10' : 'border-slate-200',
    panel: theme === 'dark' ? 'bg-[#111111]' : 'bg-[#f8fafc]',
  };

  if (hasKey === false) {
    return (
      <div className="h-screen w-screen bg-black flex items-center justify-center p-6 text-center">
        <div className="max-w-sm w-full bg-[#111] border border-white/5 rounded-[2.5rem] p-10 space-y-8 shadow-2xl">
          <Key className="w-12 h-12 text-indigo-500 mx-auto" />
          <h1 className="text-xl font-black text-white uppercase tracking-widest text-[12px]">Conectar Engine</h1>
          <button onClick={async () => { await (window as any).aistudio.openSelectKey(); setHasKey(true); }} className="w-full py-4 bg-indigo-600 text-white font-black rounded-2xl uppercase tracking-[0.2em] shadow-lg shadow-indigo-500/20 active:scale-95 transition-all text-[11px]">Ativar API Key</button>
        </div>
      </div>
    );
  }

  return (
    <div className={`h-screen w-screen flex flex-col ${uiColors.panel} font-sans overflow-hidden transition-colors`}>
      <nav className={`h-16 border-b ${uiColors.border} ${uiColors.bg} flex items-center justify-between px-6 z-[60]`}>
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Box className="w-6 h-6 text-white" />
          </div>
          <span className="text-[13px] font-black text-white uppercase tracking-tighter">AdStudio <span className="text-indigo-500">Ultra</span></span>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="p-2.5 bg-white/5 rounded-xl text-slate-400 hover:text-white transition-all">
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <button 
            onClick={() => setRequest({...request, ultraSpeed: !request.ultraSpeed})} 
            className={`px-5 py-2.5 rounded-xl text-[10px] font-black border transition-all ${request.ultraSpeed ? 'bg-indigo-600 border-indigo-500 text-white shadow-[0_0_20px_rgba(79,70,229,0.4)]' : 'bg-white/5 border-white/5 text-slate-500'}`}
          >
            <Zap className={`w-3.5 h-3.5 inline mr-2 ${request.ultraSpeed ? 'fill-current' : ''}`} /> 
            {request.ultraSpeed ? 'SINCRONIA ULTRA' : 'MÁXIMA QUALIDADE'}
          </button>
        </div>
      </nav>

      <div className="flex-1 flex overflow-hidden">
        <aside className={`w-80 ${uiColors.bg} border-r ${uiColors.border} p-6 overflow-y-auto custom-scrollbar shrink-0`}>
          <AdForm request={request} onChange={setRequest} onGenerate={handleGenerate} isLoading={status === GenerationStatus.LOADING} theme={theme} />
        </aside>

        <main className="flex-1 overflow-y-auto p-8 lg:p-12 bg-[#080808] canvas-bg-dark custom-scrollbar relative">
          {status === GenerationStatus.ERROR && errorMessage && (
            <div className="max-w-xl mx-auto mb-12 p-10 bg-red-500/5 border border-red-500/20 rounded-[3rem] text-center shadow-2xl">
              <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-sm font-black text-white uppercase tracking-[0.2em] mb-4">Erro na Prompt Master</h3>
              <p className="text-[11px] text-red-400 font-bold uppercase tracking-[0.15em] mb-8 leading-relaxed max-w-sm mx-auto">{errorMessage}</p>
              <button onClick={() => setStatus(GenerationStatus.IDLE)} className="flex items-center gap-3 mx-auto text-[10px] font-black text-white uppercase tracking-[0.2em] bg-red-500 px-10 py-5 rounded-3xl hover:bg-red-600 transition-all shadow-xl active:scale-95">Revisar Prompt</button>
            </div>
          )}

          {creatives.length === 0 && status !== GenerationStatus.LOADING && status !== GenerationStatus.ERROR ? (
            <div className="h-full flex flex-col items-center justify-center opacity-10">
              <Sparkles className="w-24 h-24 text-indigo-500 mb-8" />
              <h3 className="text-[20px] font-black uppercase tracking-[0.5em] text-white">Pronto para Criar</h3>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-2">Sua prompt dita as regras</p>
            </div>
          ) : (
            <div className="max-w-[1700px] mx-auto space-y-12 pb-24">
              {status === GenerationStatus.LOADING && (
                <div className="flex flex-col items-center py-20 bg-indigo-500/5 rounded-[4rem] border border-indigo-500/10 mb-12 shadow-inner transition-all animate-in fade-in zoom-in duration-700">
                  <Loader />
                  <div className="mt-10 space-y-3 text-center">
                    <p className="text-[13px] font-black text-indigo-400 uppercase tracking-[0.6em] animate-pulse">
                      {request.ultraSpeed ? `SINCRONIZANDO PROMPT (${creatives.length}/${request.quantity})...` : 'RENDERIZANDO CENA CRIATIVA...'}
                    </p>
                    <p className="text-[9px] text-slate-600 font-bold uppercase tracking-widest">Garantindo ortografia 100% precisa nos estilos selecionados</p>
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 lg:gap-12 items-start">
                {creatives.map(c => <AdPreviewCard key={c.id} creative={c} onDelete={(id) => setCreatives(prev => prev.filter(x => x.id !== id))} />)}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default App;
