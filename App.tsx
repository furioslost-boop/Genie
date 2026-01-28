
import React, { useState, useEffect } from 'react';
import { 
  Rocket, 
  ChevronRight, 
  ChevronLeft, 
  Box,
  Zap,
  Sun,
  Moon,
  AlertCircle,
  Key,
  Layout,
  Menu,
  X
} from 'lucide-react';
import { AdRequest, AdCreative, GenerationStatus, EditorLayer } from './types';
import { generateAdCopy, generateAdImage } from './services/geminiService';
import AdForm from './components/AdForm';
import AdPreviewCard from './components/AdPreviewCard';
import Loader from './components/Loader';
import CreativeEditor from './components/CreativeEditor';

const App: React.FC = () => {
  const [hasKey, setHasKey] = useState<boolean | null>(null);
  const [request, setRequest] = useState<AdRequest>({
    productName: '',
    description: '',
    creativeDirection: '',
    targetAudience: '',
    platform: 'Meta',
    aspectRatio: '1:1',
    ultraSpeed: false,
    tone: 'Ousado',
    goal: 'Vendas',
    quantity: 1,
    brandAssets: {
      colors: ['#4f46e5'], 
    }
  });

  const [creatives, setCreatives] = useState<AdCreative[]>([]);
  const [editingCreative, setEditingCreative] = useState<AdCreative | null>(null);
  const [status, setStatus] = useState<GenerationStatus>(GenerationStatus.IDLE);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 1024);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => { checkApiKey(); }, []);

  const checkApiKey = async () => {
    try {
      const has = await (window as any).aistudio.hasSelectedApiKey();
      setHasKey(has);
    } catch (e) { setHasKey(false); }
  };

  const handleGenerate = async (q = 1) => {
    if (!request.productName) return;
    setStatus(GenerationStatus.LOADING);
    setError(null);
    if (window.innerWidth < 1024) setSidebarOpen(false);
    
    try {
      const batchPromises = Array.from({ length: q }).map(async () => {
        const [copy, imageUrl] = await Promise.all([
          generateAdCopy(request),
          generateAdImage(request)
        ]);

        const primaryColor = request.brandAssets?.colors[0] || '#ffffff';
        const buttonBg = request.brandAssets?.colors[1] || request.brandAssets?.colors[0] || '#4f46e5';

        const initialLayers: EditorLayer[] = [
          {
            id: 'h1-' + Math.random().toString(36).substr(2, 5),
            type: 'text',
            content: copy.headline.toUpperCase(),
            x: 50, y: 25, width: 85, height: 12,
            fontSize: 42, color: primaryColor, 
            fontFamily: 'Bebas Neue', opacity: 100
          },
          {
            id: 'btn-' + Math.random().toString(36).substr(2, 5),
            type: 'button',
            content: copy.cta.toUpperCase(),
            x: 50, y: 82, width: 45, height: 10,
            fontSize: 18, color: '#ffffff', 
            backgroundColor: buttonBg,
            fontFamily: 'Inter', borderRadius: 12, opacity: 100
          }
        ];

        return { 
          id: Math.random().toString(36).substr(2, 9), 
          copy, 
          imageUrl, 
          platform: request.platform, 
          aspectRatio: request.aspectRatio, 
          timestamp: Date.now(), 
          layers: initialLayers 
        } as AdCreative;
      });

      const results = await Promise.all(batchPromises);
      setCreatives(prev => [...results, ...prev]);
      setStatus(GenerationStatus.SUCCESS);
    } catch (err: any) {
      console.error(err);
      setError(err.message === 'API_KEY_NOT_FOUND' ? "Chave Inválida" : "Erro de Conexão");
      setStatus(GenerationStatus.ERROR);
    }
  };

  const uiColors = {
    bg: theme === 'dark' ? 'bg-[#1a1a1a]' : 'bg-white',
    border: theme === 'dark' ? 'border-[#2d2d2d]' : 'border-slate-200',
    text: theme === 'dark' ? 'text-slate-300' : 'text-slate-600',
    textStrong: theme === 'dark' ? 'text-white' : 'text-slate-900',
    panel: theme === 'dark' ? 'bg-[#0F0F0F]' : 'bg-[#f8fafc]',
  };

  if (hasKey === false) {
    return (
      <div className="h-screen w-screen bg-[#0a0a0a] flex items-center justify-center p-6">
        <div className="max-w-sm w-full bg-[#141414] border border-white/5 rounded-[2.5rem] p-8 text-center space-y-8 shadow-2xl">
          <div className="w-16 h-16 bg-indigo-600 rounded-3xl flex items-center justify-center mx-auto shadow-indigo-600/20 shadow-xl"><Key className="w-8 h-8 text-white" /></div>
          <div className="space-y-2">
            <h1 className="text-xl font-black text-white uppercase tracking-tighter">AdStudio Pro v3</h1>
            <p className="text-[12px] text-slate-500 leading-relaxed">Conecte sua chave Gemini para começar a criar sem custos de desenvolvedor.</p>
          </div>
          <button onClick={async () => { await (window as any).aistudio.openSelectKey(); setHasKey(true); }} className="w-full py-4 bg-white text-black font-black rounded-2xl text-[10px] uppercase tracking-widest hover:bg-indigo-500 hover:text-white transition-all">Ativar Chave API</button>
        </div>
      </div>
    );
  }

  if (hasKey === null) return <div className="h-screen w-screen bg-[#0a0a0a] flex items-center justify-center"><Loader /></div>;

  return (
    <div className={`h-screen w-screen flex flex-col ${uiColors.panel} ${uiColors.text} font-sans overflow-hidden transition-colors`}>
      <nav className={`h-16 border-b ${uiColors.border} ${uiColors.bg} flex items-center justify-between px-4 md:px-6 z-[60]`}>
        <div className="flex items-center gap-4">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 bg-white/5 rounded-xl text-slate-400 hover:text-white"><Menu className="w-5 h-5" /></button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-xl flex items-center justify-center"><Box className="w-5 h-5 text-white" /></div>
            <span className={`text-[12px] font-black ${uiColors.textStrong} uppercase tracking-tighter hidden sm:block`}>AdStudio Pro <span className="text-indigo-500">v3</span></span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="p-2.5 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10">{theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}</button>
          <button 
            onClick={() => setRequest({...request, ultraSpeed: !request.ultraSpeed})} 
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[9px] font-black transition-all border ${request.ultraSpeed ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg' : 'bg-white/5 border-white/5 text-slate-500'}`}
          >
            <Zap className={`w-3.5 h-3.5 ${request.ultraSpeed ? 'fill-current' : ''}`} /> ULTRA
          </button>
        </div>
      </nav>

      <div className="flex-1 flex overflow-hidden relative">
        {sidebarOpen && <div className="lg:hidden fixed inset-0 bg-black/80 z-[70]" onClick={() => setSidebarOpen(false)} />}
        
        <aside className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static fixed inset-y-0 left-0 w-80 ${uiColors.bg} border-r ${uiColors.border} flex flex-col transition-transform duration-300 z-[80] shadow-2xl lg:shadow-none`}>
          <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
            <AdForm request={request} onChange={setRequest} onGenerate={handleGenerate} isLoading={status === GenerationStatus.LOADING} theme={theme} />
          </div>
        </aside>

        <main className="flex-1 flex flex-col overflow-hidden bg-[#080808]">
          <div className="flex-1 overflow-y-auto p-6 md:p-12 canvas-bg-dark custom-scrollbar">
            {creatives.length === 0 && status !== GenerationStatus.LOADING ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8">
                <div className="w-24 h-24 bg-indigo-500/5 rounded-[3rem] border border-white/5 flex items-center justify-center mb-8"><Rocket className="w-10 h-10 text-indigo-500/30" /></div>
                <h3 className="text-sm font-black text-slate-300 uppercase tracking-[0.2em] mb-3">Estúdio de Design Ativo</h3>
                <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest max-w-xs leading-loose">Defina os ativos da sua marca e dispare a produção. O motor Gemini 3-Pro criará designs irresistíveis para você.</p>
              </div>
            ) : (
              <div className="max-w-6xl mx-auto space-y-12 pb-24">
                {status === GenerationStatus.LOADING && (
                  <div className="flex flex-col items-center py-20">
                    <Loader />
                    <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.4em] mt-8 animate-pulse">Engajando Motor de Escala...</p>
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16">
                  {creatives.map(c => (
                    <AdPreviewCard 
                      key={c.id} 
                      creative={c} 
                      onUpdate={(u) => setCreatives(prev => prev.map(x => x.id === u.id ? u : x))} 
                      onOpenEditor={setEditingCreative} 
                      onDelete={(id) => setCreatives(prev => prev.filter(x => x.id !== id))} 
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {editingCreative && <CreativeEditor creative={editingCreative} onClose={() => setEditingCreative(null)} onSave={(u) => setCreatives(prev => prev.map(x => x.id === u.id ? u : x))} />}
      
      {status === GenerationStatus.ERROR && (
        <div className="fixed bottom-10 right-10 bg-red-600 text-white px-8 py-5 rounded-[2rem] shadow-2xl flex items-center gap-4 z-[100] animate-in slide-in-from-right-4">
          <AlertCircle className="w-6 h-6" />
          <div className="flex flex-col">
             <span className="text-[11px] font-black uppercase tracking-widest">{error}</span>
             <span className="text-[9px] font-bold opacity-80 uppercase">Tente novamente ou ajuste os ativos.</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
