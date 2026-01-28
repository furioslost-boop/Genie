
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { AdCreative, EditorLayer, AspectRatio, AdTemplate } from '../types';
import { 
  X, 
  Download, 
  Type, 
  Square, 
  MousePointer2, 
  Trash2, 
  Palette,
  ArrowRight,
  Settings,
  Plus,
  ChevronUp,
  ChevronDown,
  GripVertical,
  Layers as LayersIcon,
  Bookmark,
  Save,
  Copy,
  Undo2,
  Redo2
} from 'lucide-react';

interface CreativeEditorProps {
  creative: AdCreative;
  onClose: () => void;
  onSave: (updated: AdCreative) => void;
}

const FONT_FAMILIES = [
  'Inter', 
  'Montserrat', 
  'Bebas Neue', 
  'Playfair Display', 
  'JetBrains Mono', 
  'Impact'
];

const getAspectStyles = (ratio: AspectRatio) => {
  switch (ratio) {
    case '1:1': return 'aspect-[1/1]';
    case '4:5': return 'aspect-[4/5]';
    case '3:4': return 'aspect-[3/4]';
    case '9:16': return 'aspect-[9/16]';
    case '16:9': return 'aspect-[16/9]';
    default: return 'aspect-[1/1]';
  }
};

const CreativeEditor: React.FC<CreativeEditorProps> = ({ creative, onClose, onSave }) => {
  const [layers, setLayers] = useState<EditorLayer[]>(creative.layers || []);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showPropsMobile, setShowPropsMobile] = useState(false);
  const [draggedLayerIndex, setDraggedLayerIndex] = useState<number | null>(null);
  const [savedTemplates, setSavedTemplates] = useState<AdTemplate[]>([]);
  const [activeTab, setActiveTab] = useState<'design' | 'templates'>('design');
  
  // Undo/Redo Logic
  const [history, setHistory] = useState<EditorLayer[][]>([creative.layers || []]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const pushToHistory = useCallback((newLayers: EditorLayer[]) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push([...newLayers.map(l => ({ ...l }))]);
    // Limit history size to 50
    if (newHistory.length > 50) newHistory.shift();
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [history, historyIndex]);

  const undo = () => {
    if (historyIndex > 0) {
      const prevIndex = historyIndex - 1;
      const prevLayers = history[prevIndex];
      setLayers([...prevLayers.map(l => ({ ...l }))]);
      setHistoryIndex(prevIndex);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const nextIndex = historyIndex + 1;
      const nextLayers = history[nextIndex];
      setLayers([...nextLayers.map(l => ({ ...l }))]);
      setHistoryIndex(nextIndex);
    }
  };

  // Carregar templates do localStorage
  useEffect(() => {
    const stored = localStorage.getItem('ad_templates');
    if (stored) {
      try {
        setSavedTemplates(JSON.parse(stored));
      } catch (e) {
        console.error("Erro ao carregar templates", e);
      }
    }
  }, []);

  const saveToTemplates = () => {
    const templateName = prompt("Nome do seu Template:", `Template ${creative.aspectRatio} - ${new Date().toLocaleTimeString()}`);
    if (!templateName) return;

    const newTemplate: AdTemplate = {
      id: Math.random().toString(36).substr(2, 9),
      name: templateName,
      layers: [...layers],
      aspectRatio: creative.aspectRatio
    };

    const updated = [newTemplate, ...savedTemplates];
    setSavedTemplates(updated);
    localStorage.setItem('ad_templates', JSON.stringify(updated));
    alert("Layout salvo como template com sucesso!");
  };

  const applyTemplate = (template: AdTemplate) => {
    if (confirm(`Deseja aplicar o template "${template.name}"? Isso substituirá as camadas atuais.`)) {
      const newLayers = template.layers.map(l => ({ ...l, id: Math.random().toString(36).substr(2, 9) }));
      setLayers(newLayers);
      pushToHistory(newLayers);
      setSelectedId(null);
    }
  };

  const deleteTemplate = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Excluir este template?")) {
      const updated = savedTemplates.filter(t => t.id !== id);
      setSavedTemplates(updated);
      localStorage.setItem('ad_templates', JSON.stringify(updated));
    }
  };

  const addText = () => {
    const newLayer: EditorLayer = {
      id: Math.random().toString(36).substr(2, 9),
      type: 'text',
      content: 'NOVO TEXTO',
      x: 50, y: 40, width: 70, height: 10,
      fontSize: 32, color: '#ffffff', fontFamily: 'Bebas Neue', opacity: 100
    };
    const nextLayers = [...layers, newLayer];
    setLayers(nextLayers);
    pushToHistory(nextLayers);
    setSelectedId(newLayer.id);
    if (window.innerWidth < 768) setShowPropsMobile(true);
  };

  const addButton = () => {
    const newLayer: EditorLayer = {
      id: Math.random().toString(36).substr(2, 9),
      type: 'button',
      content: 'CLIQUE AQUI',
      x: 50, y: 80, width: 50, height: 12,
      fontSize: 20, color: '#ffffff', backgroundColor: '#4f46e5',
      fontFamily: 'Inter', borderRadius: 8, opacity: 100
    };
    const nextLayers = [...layers, newLayer];
    setLayers(nextLayers);
    pushToHistory(nextLayers);
    setSelectedId(newLayer.id);
    if (window.innerWidth < 768) setShowPropsMobile(true);
  };

  const handleInteraction = (id: string, type: 'drag' | 'resize', e: React.MouseEvent | React.TouchEvent) => {
    if (!containerRef.current) return;
    e.stopPropagation();
    setSelectedId(id);
    
    const isTouch = 'touches' in e;
    const clientX = isTouch ? (e as React.TouchEvent).touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = isTouch ? (e as React.TouchEvent).touches[0].clientY : (e as React.MouseEvent).clientY;

    const rect = containerRef.current.getBoundingClientRect();
    const layer = layers.find(l => l.id === id);
    if (!layer) return;

    const initialX = layer.x;
    const initialY = layer.y;
    const initialW = layer.width;
    const initialH = layer.height;

    const moveHandler = (moveEvent: MouseEvent | TouchEvent) => {
      const curX = 'touches' in moveEvent ? (moveEvent as TouchEvent).touches[0].clientX : (moveEvent as MouseEvent).clientX;
      const curY = 'touches' in moveEvent ? (moveEvent as TouchEvent).touches[0].clientY : (moveEvent as MouseEvent).clientY;
      
      const deltaX = ((curX - clientX) / rect.width) * 100;
      const deltaY = ((curY - clientY) / rect.height) * 100;

      if (type === 'drag') {
        setLayers(prev => prev.map(l => l.id === id ? { ...l, x: initialX + deltaX, y: initialY + deltaY } : l));
      } else {
        setLayers(prev => prev.map(l => l.id === id ? { ...l, width: Math.max(5, initialW + deltaX), height: Math.max(2, initialH + deltaY) } : l));
      }
    };

    const upHandler = () => {
      window.removeEventListener('mousemove', moveHandler);
      window.removeEventListener('mouseup', upHandler);
      window.removeEventListener('touchmove', moveHandler);
      window.removeEventListener('touchend', upHandler);
      
      // Save state only on interaction end to avoid history bloat
      setLayers(currentLayers => {
        pushToHistory(currentLayers);
        return currentLayers;
      });
    };

    window.addEventListener('mousemove', moveHandler);
    window.addEventListener('mouseup', upHandler);
    window.addEventListener('touchmove', moveHandler);
    window.addEventListener('touchend', upHandler);
  };

  const onDragStart = (index: number) => {
    setDraggedLayerIndex(index);
  };

  const onDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
  };

  const onDrop = (index: number) => {
    if (draggedLayerIndex === null) return;
    const updatedLayers = [...layers];
    const [draggedItem] = updatedLayers.splice(draggedLayerIndex, 1);
    updatedLayers.splice(index, 0, draggedItem);
    setLayers(updatedLayers);
    pushToHistory(updatedLayers);
    setDraggedLayerIndex(null);
  };

  const updateLayerProp = (id: string, prop: Partial<EditorLayer>) => {
    const nextLayers = layers.map(l => l.id === id ? { ...l, ...prop } : l);
    setLayers(nextLayers);
    pushToHistory(nextLayers);
  };

  const deleteLayer = (id: string) => {
    const nextLayers = layers.filter(l => l.id !== id);
    setLayers(nextLayers);
    pushToHistory(nextLayers);
    setSelectedId(null);
  };

  const download = async () => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = creative.imageUrl;
    img.onload = () => {
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      ctx.drawImage(img, 0, 0);
      layers.forEach(l => {
        ctx.globalAlpha = (l.opacity || 100) / 100;
        ctx.font = `bold ${(l.fontSize / 100) * canvas.height}px ${l.fontFamily}`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        const x = (l.x / 100) * canvas.width;
        const y = (l.y / 100) * canvas.height;
        if (l.type === 'button') {
          ctx.fillStyle = l.backgroundColor || '#000';
          const w = (l.width / 100) * canvas.width;
          const h = (l.height / 100) * canvas.height;
          ctx.beginPath();
          ctx.roundRect(x - w/2, y - h/2, w, h, (l.borderRadius || 0) * (canvas.width/400));
          ctx.fill();
        }
        ctx.fillStyle = l.color;
        ctx.fillText(l.content, x, y);
      });
      const link = document.createElement('a');
      link.download = 'criativo.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    };
  };

  const selectedLayer = layers.find(l => l.id === selectedId);

  return (
    <div className="fixed inset-0 bg-[#0a0a0a] z-[100] flex flex-col md:flex-row overflow-hidden font-sans select-none">
      {/* Toolbar Esquerda */}
      <div className="order-2 md:order-1 w-full md:w-20 bg-[#121212] border-t md:border-t-0 md:border-r border-white/5 flex md:flex-col items-center justify-around md:justify-start py-4 md:py-8 gap-4 z-50 overflow-x-auto md:overflow-x-visible">
        <button onClick={addText} title="Adicionar Texto" className="p-3 text-slate-400 hover:text-white bg-white/5 rounded-xl md:bg-transparent"><Type className="w-5 h-5" /></button>
        <button onClick={addButton} title="Adicionar Botão" className="p-3 text-slate-400 hover:text-white bg-white/5 rounded-xl md:bg-transparent"><Square className="w-5 h-5" /></button>
        
        <div className="hidden md:block w-8 h-px bg-white/5 my-2" />

        <button 
          onClick={undo} 
          disabled={historyIndex === 0}
          title="Desfazer" 
          className={`p-3 rounded-xl md:bg-transparent transition-colors ${historyIndex === 0 ? 'text-slate-700 cursor-not-allowed' : 'text-slate-400 hover:text-white bg-white/5'}`}
        >
          <Undo2 className="w-5 h-5" />
        </button>
        <button 
          onClick={redo} 
          disabled={historyIndex === history.length - 1}
          title="Refazer" 
          className={`p-3 rounded-xl md:bg-transparent transition-colors ${historyIndex === history.length - 1 ? 'text-slate-700 cursor-not-allowed' : 'text-slate-400 hover:text-white bg-white/5'}`}
        >
          <Redo2 className="w-5 h-5" />
        </button>

        <div className="hidden md:block w-8 h-px bg-white/5 my-2" />

        <button onClick={saveToTemplates} title="Salvar como Template" className="p-3 text-amber-500 hover:text-amber-400 bg-white/5 rounded-xl md:bg-transparent"><Bookmark className="w-5 h-5" /></button>
        <button onClick={download} title="Baixar Criativo" className="p-3 text-indigo-400 hover:text-white bg-white/5 rounded-xl md:bg-transparent"><Download className="w-5 h-5" /></button>
        <button onClick={() => setShowPropsMobile(!showPropsMobile)} className="md:hidden p-3 text-slate-400 bg-white/5 rounded-xl"><Settings className="w-5 h-5" /></button>
      </div>

      {/* Area do Canvas */}
      <div className="order-1 md:order-2 flex-1 flex items-center justify-center p-4 md:p-20 relative bg-[#080808] canvas-bg-dark" onClick={() => setSelectedId(null)}>
        <div ref={containerRef} className={`relative shadow-2xl ring-1 ring-white/10 overflow-hidden ${getAspectStyles(creative.aspectRatio)}`} style={{ maxHeight: '75vh', maxWidth: '100%', width: 'auto' }}>
          <img src={creative.imageUrl} className="w-full h-full object-contain pointer-events-none select-none" />
          {layers.map(l => (
            <div 
              key={l.id} 
              onMouseDown={(e) => handleInteraction(l.id, 'drag', e)}
              onTouchStart={(e) => handleInteraction(l.id, 'drag', e as any)}
              className={`absolute flex items-center justify-center cursor-move ${selectedId === l.id ? 'ring-2 ring-indigo-500 z-20' : 'hover:ring-1 hover:ring-white/20'}`}
              style={{ left: `${l.x}%`, top: `${l.y}%`, width: `${l.width}%`, height: `${l.height}%`, transform: 'translate(-50%, -50%)', color: l.color, fontSize: `${l.fontSize}px`, fontFamily: l.fontFamily, backgroundColor: l.type === 'button' ? l.backgroundColor : 'transparent', borderRadius: l.type === 'button' ? `${l.borderRadius}px` : '0', fontWeight: '900', opacity: (l.opacity || 100) / 100, textAlign: 'center' }}
            >
              <span className="w-full pointer-events-none break-words px-2">{l.content}</span>
              {selectedId === l.id && (
                <div 
                  onMouseDown={(e) => handleInteraction(l.id, 'resize', e)}
                  onTouchStart={(e) => handleInteraction(l.id, 'resize', e as any)}
                  className="absolute -bottom-1 -right-1 w-4 h-4 bg-white border-2 border-indigo-500 rounded-full cursor-se-resize" 
                />
              )}
            </div>
          ))}
        </div>
        <canvas ref={canvasRef} className="hidden" />
        <button onClick={onClose} className="absolute top-6 right-6 p-3 bg-white/10 rounded-full text-white hover:bg-red-500 transition-colors hidden md:block"><X className="w-5 h-5" /></button>
      </div>

      {/* Painel Lateral - Designer & Templates */}
      <div className={`order-3 md:w-80 bg-[#121212] border-l border-white/5 flex flex-col fixed md:relative bottom-0 left-0 w-full md:h-auto h-[70vh] transition-transform duration-300 z-[60] ${showPropsMobile || (window.innerWidth >= 768) ? 'translate-y-0' : 'translate-y-full md:translate-y-0'}`}>
        
        {/* Tabs */}
        <div className="flex border-b border-white/5 bg-[#0f0f0f]">
          <button 
            onClick={() => setActiveTab('design')}
            className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'design' ? 'text-indigo-500 border-b-2 border-indigo-500 bg-white/5' : 'text-slate-500 hover:text-white'}`}
          >
            Design
          </button>
          <button 
            onClick={() => setActiveTab('templates')}
            className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'templates' ? 'text-indigo-500 border-b-2 border-indigo-500 bg-white/5' : 'text-slate-500 hover:text-white'}`}
          >
            Templates ({savedTemplates.length})
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
          {activeTab === 'design' ? (
            <>
              {/* Seção de Camadas */}
              <section className="space-y-4">
                 <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2"><LayersIcon className="w-3 h-3" /> Camadas Ativas</label>
                 </div>
                 <div className="space-y-1 bg-white/5 rounded-xl p-2 border border-white/5">
                    {layers.length > 0 ? (
                      layers.slice().reverse().map((l, reverseIndex) => {
                        const actualIndex = layers.length - 1 - reverseIndex;
                        const isSelected = selectedId === l.id;
                        return (
                          <div 
                            key={l.id}
                            draggable
                            onDragStart={() => onDragStart(actualIndex)}
                            onDragOver={(e) => onDragOver(e, actualIndex)}
                            onDrop={() => onDrop(actualIndex)}
                            onClick={() => setSelectedId(l.id)}
                            className={`flex items-center gap-3 p-3 rounded-lg cursor-grab active:cursor-grabbing transition-all ${isSelected ? 'bg-indigo-600 text-white shadow-lg' : 'hover:bg-white/5 text-slate-400'}`}
                          >
                            <GripVertical className="w-3.5 h-3.5 opacity-40 shrink-0" />
                            <div className="w-4 h-4 rounded-sm border border-white/10 flex items-center justify-center bg-black/20 shrink-0">
                               {l.type === 'text' ? <Type className="w-2 h-2" /> : <Square className="w-2 h-2" />}
                            </div>
                            <span className="text-[10px] font-bold truncate flex-1 uppercase tracking-tight">{l.content || 'Sem texto'}</span>
                          </div>
                        );
                      })
                    ) : (
                      <div className="py-8 text-center text-[10px] text-slate-600 font-bold uppercase tracking-widest">Nenhuma camada</div>
                    )}
                 </div>
              </section>

              <div className="h-px bg-white/5" />

              {/* Propriedades da Camada Selecionada */}
              {selectedLayer ? (
                <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Texto do Elemento</label>
                    <textarea value={selectedLayer.content} onChange={(e) => updateLayerProp(selectedId!, { content: e.target.value.toUpperCase() })} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-white font-bold outline-none focus:border-indigo-500" rows={2} />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Tipografia Premium</label>
                    <div className="grid grid-cols-2 gap-2">
                      {FONT_FAMILIES.map(f => (
                        <button key={f} onClick={() => updateLayerProp(selectedId!, { fontFamily: f })} className={`py-2 px-1 text-[10px] rounded border ${selectedLayer.fontFamily === f ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-white/5 border-white/10 text-slate-400'}`} style={{ fontFamily: f }}>{f}</button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Tamanho</label>
                      <input type="number" value={selectedLayer.fontSize} onChange={(e) => updateLayerProp(selectedId!, { fontSize: parseInt(e.target.value) })} className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-xs text-white" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Cor</label>
                      <input type="color" value={selectedLayer.color} onChange={(e) => updateLayerProp(selectedId!, { color: e.target.value })} className="w-full h-9 bg-transparent border-none cursor-pointer" />
                    </div>
                  </div>

                  {selectedLayer.type === 'button' && (
                    <div className="p-4 bg-white/5 rounded-2xl space-y-4">
                      <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Estilo do Botão</label>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-slate-500 uppercase">Fundo</label>
                          <input type="color" value={selectedLayer.backgroundColor} onChange={(e) => updateLayerProp(selectedId!, { backgroundColor: e.target.value })} className="w-full h-8 bg-transparent" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-slate-500 uppercase">Raio</label>
                          <input type="number" value={selectedLayer.borderRadius} onChange={(e) => updateLayerProp(selectedId!, { borderRadius: parseInt(e.target.value) })} className="w-full bg-white/5 border border-white/10 rounded p-1.5 text-xs text-white" />
                        </div>
                      </div>
                    </div>
                  )}

                  <button onClick={() => deleteLayer(selectedId!)} className="w-full py-3 bg-red-500/10 text-red-500 text-[10px] font-black rounded-xl uppercase flex items-center justify-center gap-2 transition-all shadow-sm"><Trash2 className="w-4 h-4" /> Remover Elemento</button>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-center py-20 opacity-20 gap-4">
                  <MousePointer2 className="w-8 h-8" />
                  <p className="text-[10px] font-bold uppercase tracking-widest">Selecione um elemento para editar</p>
                </div>
              )}
            </>
          ) : (
            /* Tab de Templates */
            <div className="space-y-6 animate-in slide-in-from-left-4 duration-300">
               <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Sua Biblioteca</label>
                  <button onClick={saveToTemplates} className="p-1.5 bg-indigo-600 rounded-lg text-white hover:bg-indigo-500"><Plus className="w-4 h-4" /></button>
               </div>

               {savedTemplates.length === 0 ? (
                 <div className="py-20 text-center space-y-4 opacity-30">
                    <Bookmark className="w-10 h-10 mx-auto" />
                    <p className="text-[10px] font-bold uppercase tracking-widest">Nenhum template salvo ainda.</p>
                 </div>
               ) : (
                 <div className="grid grid-cols-1 gap-3">
                   {savedTemplates.map(template => (
                     <div 
                      key={template.id} 
                      onClick={() => applyTemplate(template)}
                      className="group p-4 bg-white/5 border border-white/10 rounded-2xl hover:border-indigo-500 cursor-pointer transition-all relative overflow-hidden"
                     >
                       <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                             <div className="w-8 h-8 bg-indigo-600/20 rounded-lg flex items-center justify-center text-indigo-400">
                                <Copy className="w-4 h-4" />
                             </div>
                             <div>
                                <h4 className="text-[10px] font-black text-white uppercase tracking-tight truncate max-w-[140px]">{template.name}</h4>
                                <span className="text-[8px] text-slate-500 font-bold uppercase tracking-widest">{template.aspectRatio} • {template.layers.length} camadas</span>
                             </div>
                          </div>
                          <button 
                            onClick={(e) => deleteTemplate(template.id, e)}
                            className="p-2 text-slate-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                       </div>
                     </div>
                   ))}
                 </div>
               )}
            </div>
          )}
        </div>

        {/* Footer Painel Lateral */}
        <div className="p-6 bg-[#0f0f0f] border-t border-white/5 flex gap-2">
          <button onClick={() => { onSave({...creative, layers}); onClose(); }} className="flex-1 py-4 bg-indigo-600 text-white text-xs font-black rounded-2xl uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-indigo-500 active:scale-95 transition-all shadow-xl shadow-indigo-600/10"><ArrowRight className="w-4 h-4" /> Finalizar & Aplicar</button>
          <button onClick={onClose} className="p-4 bg-white/5 text-slate-400 rounded-2xl md:hidden"><X className="w-5 h-5" /></button>
        </div>
      </div>
    </div>
  );
};

export default CreativeEditor;
