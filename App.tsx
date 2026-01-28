
import React, { useState, useEffect } from 'react';
import { Rocket, Box, Zap, Sun, Moon, Key, Sparkles, AlertTriangle, Menu, X, Download, Package, ChevronLeft, ChevronRight } from 'lucide-react';
import { AdRequest, AdCreative, GenerationStatus } from './types';
import { generateCompleteCreative, analyzeBrandPresence } from './services/geminiService';
import AdForm from './components/AdForm';
import AdPreviewCard from './components/AdPreviewCard';
import Loader from './components/Loader';
import JSZip from 'jszip';
import { jsPDF } from 'jspdf';

const App: React.FC = () => {
  const [hasKey, setHasKey] = useState<boolean | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isZipping, setIsZipping] = useState(false);
  
  const [request, setRequest] = useState<AdRequest>({
    productName: '', 
    description: '', 
    creativeDirection: '', 
    targetAudience: '',
    platform: 'Meta', 
    aspectRatio: '1:1', 
    ultraSpeed: true,
    designConcept: 'Criativo (Eye-catching)',
    creativeType: ['Ultra-Realista'], 
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

    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  }, []);

  const handleGenerate = async (q = 1) => {
    if (!request.productName || !request.creativeDirection) return;
    
    setCreatives([]);
    setErrorMessage(null);
    setStatus(GenerationStatus.LOADING);
    
    if (window.innerWidth < 1024) setSidebarOpen(false);

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

  const handleDownloadAll = async () => {
    if (creatives.length === 0) return;
    setIsZipping(true);
    
    const zip = new JSZip();
    const campaignName = `Campanha_${request.productName.replace(/\s+/g, '_')}_${Date.now()}`;
    const folder = zip.folder(campaignName);

    for (const creative of creatives) {
      const baseName = `Criativo_${String(creative.index + 1).padStart(2, '0')}_${creative.aspectRatio.replace(':', '-')}`;
      
      // Add Image
      const imageData = creative.imageUrl.split(',')[1];
      folder?.file(`${baseName}.png`, imageData, { base64: true });

      // Create PDF using robust pagination logic
      const doc = new jsPDF();
      const margin = 20;
      const contentWidth = 170;
      let yPos = 20;

      const checkBreak = (h: number) => {
        if (yPos + h > 280) { doc.addPage(); yPos = 20; return true; }
        return false;
      };

      doc.setFontSize(22);
      doc.setTextColor(79, 70, 229);
      doc.text("Ad Pack - Copy Review", margin, yPos);
      yPos += 15;

      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text("HEADLINE:", margin, yPos);
      yPos += 7;
      doc.setFontSize(14);
      doc.setTextColor(0);
      const hLines = doc.splitTextToSize(creative.copy.headline.toUpperCase(), contentWidth);
      doc.text(hLines, margin, yPos);
      yPos += (hLines.length * 8) + 10;

      checkBreak(15);
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text("TEXTO PRINCIPAL:", margin, yPos);
      yPos += 7;
      doc.setFontSize(11);
      doc.setTextColor(50);
      const pLines = doc.splitTextToSize(creative.copy.primaryText, contentWidth);
      for (const line of pLines) {
        if (checkBreak(7)) {
            doc.setFontSize(11);
            doc.setTextColor(50);
        }
        doc.text(line, margin, yPos);
        yPos += 6.5;
      }

      const pdfBlob = doc.output('blob');
      folder?.file(`${baseName}_Pack.pdf`, pdfBlob);
    }

    const content = await zip.generateAsync({ type: "blob" });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(content);
    link.download = `${campaignName}.zip`;
    link.click();
    setIsZipping(false);
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
      {/* Navbar Global */}
      <nav className={`h-16 border-b ${uiColors.border} ${uiColors.bg} flex items-center justify-between px-4 lg:px-6 z-[60] shrink-0`}>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 bg-white/5 rounded-xl text-slate-400 hover:text-white transition-all active:scale-90"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <div className="flex items-center gap-2 lg:gap-4 ml-1">
            <div className="w-8 h-8 lg:w-9 lg:h-9 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Box className="w-5 h-5 text-white" />
            </div>
            <span className="text-[12px] font-black text-white uppercase tracking-tighter hidden xs:block">AdStudio <span className="text-indigo-500">Ultra</span></span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {creatives.length > 0 && (
            <button 
              onClick={handleDownloadAll}
              disabled={isZipping}
              className="px-4 py-2 bg-emerald-600/10 border border-emerald-500/20 hover:bg-emerald-600 text-emerald-500 hover:text-white rounded-xl font-black text-[9px] flex items-center gap-2 transition-all uppercase tracking-widest"
            >
              {isZipping ? <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" /> : <Package className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{isZipping ? 'Processando...' : 'Baixar ZIP'}</span>
            </button>
          )}

          <div className="h-6 w-px bg-white/10 mx-1 hidden sm:block" />

          <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="p-2 bg-white/5 rounded-xl text-slate-400 hover:text-white transition-all">
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          
          <button 
            onClick={() => setRequest({...request, ultraSpeed: !request.ultraSpeed})} 
            className={`px-3 lg:px-4 py-2 rounded-xl text-[9px] font-black border transition-all flex items-center gap-2 ${request.ultraSpeed ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg' : 'bg-white/5 border-white/5 text-slate-500'}`}
          >
            <Zap className={`w-3.5 h-3.5 ${request.ultraSpeed ? 'fill-current' : ''}`} /> 
            <span className="hidden md:inline">{request.ultraSpeed ? 'TURBO' : 'QUALIDADE'}</span>
          </button>
        </div>
      </nav>

      <div className="flex-1 flex overflow-hidden relative">
        {/* Mobile Backdrop */}
        <div 
          className={`fixed inset-0 bg-black/60 z-[50] lg:hidden backdrop-blur-sm transition-opacity duration-300 ${sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
          onClick={() => setSidebarOpen(false)}
        />

        {/* Sidebar - Collapsible Universal */}
        <aside 
          className={`fixed lg:static inset-y-0 left-0 z-[55] ${uiColors.bg} border-r ${uiColors.border} overflow-y-auto custom-scrollbar sidebar-transition ${sidebarOpen ? 'w-80 translate-x-0 p-6' : 'w-0 -translate-x-full lg:translate-x-0 lg:p-0 lg:border-r-0'}`}
        >
          <div className={`${!sidebarOpen && 'opacity-0 invisible'} transition-all duration-300 w-68`}>
            <AdForm request={request} onChange={setRequest} onGenerate={handleGenerate} isLoading={status === GenerationStatus.LOADING} theme={theme} />
          </div>
        </aside>

        {/* Workspace Canvas */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-12 bg-[#080808] canvas-bg-dark custom-scrollbar relative">
          {status === GenerationStatus.ERROR && errorMessage && (
            <div className="max-w-xl mx-auto mb-12 p-10 bg-red-500/5 border border-red-500/20 rounded-[3rem] text-center shadow-2xl animate-in zoom-in-95">
              <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-6" />
              <h3 className="text-sm font-black text-white uppercase tracking-widest mb-4">Falha na Engine</h3>
              <p className="text-[11px] text-red-400 font-bold uppercase mb-8 leading-relaxed">{errorMessage}</p>
              <button onClick={() => setStatus(GenerationStatus.IDLE)} className="bg-red-500 text-white px-10 py-5 rounded-3xl font-black uppercase text-[10px] tracking-widest hover:bg-red-600 transition-all shadow-xl active:scale-95">Ajustar Prompt</button>
            </div>
          )}

          {creatives.length > 0 && (
            <div className="max-w-[1700px] mx-auto mb-12 flex flex-col sm:flex-row items-center justify-between gap-6 animate-in slide-in-from-top-4">
              <div>
                <h2 className="text-white font-black text-xl lg:text-2xl uppercase tracking-tighter">Sua Campanha <span className="text-indigo-500">Pronta</span></h2>
                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.3em] mt-1">{creatives.length} criativos de alta performance gerados</p>
              </div>
              <button 
                onClick={handleDownloadAll}
                disabled={isZipping}
                className="w-full sm:w-auto px-8 py-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black text-[11px] flex items-center justify-center gap-3 transition-all shadow-2xl shadow-indigo-900/40 active:scale-95 uppercase tracking-widest"
              >
                {isZipping ? <Loader /> : <Package className="w-4 h-4" />}
                <span>{isZipping ? 'Compactando...' : 'Baixar Campanha Completa (ZIP)'}</span>
              </button>
            </div>
          )}

          {creatives.length === 0 && status !== GenerationStatus.LOADING && status !== GenerationStatus.ERROR ? (
            <div className="h-full flex flex-col items-center justify-center opacity-10 select-none">
              <Sparkles className="w-24 h-24 text-indigo-500 mb-8" />
              <h3 className="text-[20px] font-black uppercase tracking-[0.5em] text-white text-center">Engine Criativa Ociosa</h3>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-2">Configure os parâmetros na barra lateral</p>
            </div>
          ) : (
            <div className="max-w-[1700px] mx-auto space-y-12 pb-32">
              {status === GenerationStatus.LOADING && (
                <div className="flex flex-col items-center py-20 bg-indigo-500/5 rounded-[4rem] border border-indigo-500/10 mb-12 shadow-inner transition-all animate-in fade-in zoom-in duration-700">
                  <Loader />
                  <div className="mt-10 text-center px-6">
                    <p className="text-[13px] font-black text-indigo-400 uppercase tracking-[0.6em] animate-pulse">
                      {request.ultraSpeed ? `RENDERIZAÇÃO ACELERADA (${creatives.length}/${request.quantity})` : 'CRIANDO OBRA PRIMA VISUAL...'}
                    </p>
                    <p className="text-[9px] text-slate-600 font-bold uppercase tracking-widest mt-3">Refinando ortografia e equilíbrio cromático</p>
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
