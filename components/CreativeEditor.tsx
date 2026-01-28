
import React, { useState, useRef, useEffect } from 'react';
import { AdCreative, EditorLayer, AspectRatio } from '../types';
import { X, Type, Square, MousePointer2, Trash2, Save } from 'lucide-react';

interface CreativeEditorProps {
  creative: AdCreative;
  onClose: () => void;
  onSave: (updated: AdCreative) => void;
}

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
  const containerRef = useRef<HTMLDivElement>(null);
  const [canvasWidth, setCanvasWidth] = useState(0);

  useEffect(() => {
    if (containerRef.current) {
      setCanvasWidth(containerRef.current.offsetWidth);
      const resizeObserver = new ResizeObserver(entries => {
        if (entries[0]) setCanvasWidth(entries[0].contentRect.width);
      });
      resizeObserver.observe(containerRef.current);
      return () => resizeObserver.disconnect();
    }
  }, []);

  const handleInteraction = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedId(id);
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const layer = layers.find(l => l.id === id);
    if (!layer) return;

    const startX = e.clientX;
    const startY = e.clientY;
    const initialX = layer.x;
    const initialY = layer.y;

    const moveHandler = (moveEvent: MouseEvent) => {
      const deltaX = ((moveEvent.clientX - startX) / rect.width) * 100;
      const deltaY = ((moveEvent.clientY - startY) / rect.height) * 100;
      setLayers(prev => prev.map(l => l.id === id ? { ...l, x: initialX + deltaX, y: initialY + deltaY } : l));
    };

    const upHandler = () => {
      window.removeEventListener('mousemove', moveHandler);
      window.removeEventListener('mouseup', upHandler);
    };

    window.addEventListener('mousemove', moveHandler);
    window.addEventListener('mouseup', upHandler);
  };

  const selectedLayer = layers.find(l => l.id === selectedId);

  return (
    <div className="fixed inset-0 bg-[#0a0a0a] z-[100] flex flex-col md:flex-row overflow-hidden font-sans">
      {/* Sidebar de Ferramentas Simples */}
      <div className="w-full md:w-20 bg-[#121212] border-r border-white/5 flex md:flex-col items-center py-6 gap-6">
        <button 
          onClick={() => {
            const newId = 'L' + Math.random().toString(36).substr(2, 5);
            setLayers([...layers, { id: newId, type: 'text', content: 'NOVO TEXTO', x: 50, y: 50, width: 60, height: 10, fontSize: 30, color: '#ffffff', fontFamily: 'Inter', opacity: 100 } as EditorLayer]);
            setSelectedId(newId);
          }} 
          className="p-3 bg-white/5 rounded-xl text-slate-400 hover:text-white"
          title="Novo Texto"
        >
          <Type className="w-5 h-5" />
        </button>
      </div>

      {/* Workspace */}
      <div className="flex-1 flex items-center justify-center p-8 bg-[#080808]" onMouseDown={() => setSelectedId(null)}>
        <div 
          ref={containerRef} 
          className={`relative shadow-2xl ring-1 ring-white/10 overflow-hidden ${getAspectStyles(creative.aspectRatio)}`} 
          style={{ maxHeight: '80vh', maxWidth: '95%', width: 'auto' }} 
        >
          <img src={creative.imageUrl} className="w-full h-full object-contain pointer-events-none select-none" />
          {layers.map(l => (
            <div 
              key={l.id} 
              onMouseDown={e => handleInteraction(l.id, e)}
              className={`absolute flex items-center justify-center cursor-move select-none ${selectedId === l.id ? 'ring-2 ring-indigo-500 z-20' : ''}`}
              style={{ 
                left: `${l.x}%`, 
                top: `${l.y}%`, 
                width: `${l.width}%`, 
                height: `${l.height}%`, 
                transform: 'translate(-50%, -50%)', 
                color: l.color, 
                fontSize: `${(l.fontSize / 1000) * canvasWidth}px`, 
                fontFamily: l.fontFamily, 
                backgroundColor: l.type === 'button' ? l.backgroundColor : 'transparent', 
                borderRadius: l.type === 'button' ? `${l.borderRadius}px` : '0', 
                fontWeight: '900', 
                opacity: (l.opacity || 100) / 100, 
                textAlign: 'center'
              }}
            >
              <span className="w-full pointer-events-none break-words px-2 uppercase">{l.content}</span>
            </div>
          ))}
        </div>
        <button onClick={onClose} className="absolute top-6 right-6 p-3 bg-white/5 rounded-full text-white hover:bg-red-500"><X className="w-5 h-5" /></button>
      </div>

      {/* Painel de Propriedades Direto */}
      <div className={`w-full md:w-80 bg-[#121212] border-l border-white/5 flex flex-col`}>
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {selectedLayer ? (
            <div className="space-y-6 animate-in fade-in duration-300">
              <h3 className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Ajuste de Canvas</h3>
              
              <div className="space-y-2 p-4 bg-white/5 rounded-xl border border-white/5">
                <label className="text-[9px] font-black text-slate-500 uppercase block mb-1">Escala do Elemento</label>
                <input 
                  type="range" min="5" max="150" 
                  value={selectedLayer.fontSize} 
                  onChange={e => setLayers(prev => prev.map(l => l.id === selectedId ? { ...l, fontSize: parseInt(e.target.value) } : l))} 
                  className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-indigo-500" 
                />
              </div>

              <div className="flex gap-4">
                <div className="flex-1 space-y-2 p-3 bg-white/5 rounded-xl border border-white/5">
                  <label className="text-[9px] font-black text-slate-500 uppercase block">Cor da Fonte</label>
                  <input 
                    type="color" 
                    value={selectedLayer.color} 
                    onChange={e => setLayers(prev => prev.map(l => l.id === selectedId ? { ...l, color: e.target.value } : l))} 
                    className="w-full h-10 bg-transparent cursor-pointer rounded overflow-hidden" 
                  />
                </div>
              </div>

              <button 
                onClick={() => { setLayers(layers.filter(l => l.id !== selectedId)); setSelectedId(null); }} 
                className="w-full py-3 bg-red-500/10 text-red-500 text-[10px] font-black rounded-xl uppercase hover:bg-red-500/20 transition-all"
              >
                <Trash2 className="w-4 h-4 inline mr-2" /> Remover Elemento
              </button>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-30 py-20">
              <MousePointer2 className="w-8 h-8 mb-4 text-white" />
              <p className="text-[10px] font-black uppercase text-white tracking-widest leading-relaxed">Arraste os elementos no canvas<br/>para ajustar o posicionamento</p>
            </div>
          )}
        </div>

        <div className="p-6 bg-[#0c0c0c] border-t border-white/5">
          <button 
            onClick={() => { onSave({ ...creative, layers }); onClose(); }} 
            className="w-full py-4 bg-indigo-600 text-white text-[11px] font-black rounded-2xl uppercase tracking-[0.2em] hover:bg-indigo-500 transition-all flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" /> Exportar Mudanças
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreativeEditor;
