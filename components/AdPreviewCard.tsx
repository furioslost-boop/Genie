
import React, { useState } from 'react';
import { AdCreative, AdCopy } from '../types';
import { 
  Download, 
  Edit2, 
  Trash2, 
  Palette, 
  Maximize2, 
  Save, 
  ExternalLink,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface AdPreviewCardProps {
  creative: AdCreative;
  onUpdate?: (updated: AdCreative) => void;
  onOpenEditor?: (creative: AdCreative) => void;
  onDelete?: (id: string) => void;
}

const AdPreviewCard: React.FC<AdPreviewCardProps> = ({ creative, onUpdate, onOpenEditor, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempCopy, setTempCopy] = useState<AdCopy>(creative.copy);
  const [expanded, setExpanded] = useState(false);

  const handleSave = () => {
    if (onUpdate) onUpdate({ ...creative, copy: tempCopy });
    setIsEditing(false);
  };

  const download = () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = creative.imageUrl;
    img.onload = () => {
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      ctx.drawImage(img, 0, 0);
      creative.layers?.forEach(l => {
        ctx.globalAlpha = (l.opacity || 100) / 100;
        ctx.font = `bold ${(l.fontSize / 100) * canvas.height}px ${l.fontFamily}`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        const x = (l.x / 100) * canvas.width;
        const y = (l.y / 100) * canvas.height;
        if (l.type === 'button') {
          ctx.fillStyle = l.backgroundColor || '#000';
          const w = (l.width / 100) * canvas.width;
          const h = (l.height / 100) * canvas.height;
          ctx.beginPath(); ctx.roundRect(x - w/2, y - h/2, w, h, (l.borderRadius || 0) * (canvas.width/400)); ctx.fill();
        }
        ctx.fillStyle = l.color;
        ctx.fillText(l.content, x, y);
      });
      const link = document.createElement('a');
      link.download = `criativo-${creative.id}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    };
  };

  return (
    <div className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl transition-all border-b-4 border-b-indigo-500/20 w-full animate-in zoom-in-95 duration-500">
      {/* Header do Card - Sem backdrop-blur */}
      <div className="p-4 md:p-5 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-white text-xs font-black shadow-lg ${creative.platform === 'Meta' ? 'bg-blue-600' : creative.platform === 'TikTok' ? 'bg-black' : 'bg-red-600'}`}>
            {creative.platform[0]}
          </div>
          <div>
            <h4 className="text-[12px] font-black text-slate-800 uppercase tracking-tighter">{creative.platform} Ad</h4>
            <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">{creative.aspectRatio}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={download} className="p-2 text-slate-400 hover:text-indigo-600 rounded-lg"><Download className="w-4 h-4" /></button>
          <button onClick={() => onOpenEditor?.(creative)} className="p-2 bg-indigo-50 text-indigo-600 rounded-lg flex items-center gap-2"><Palette className="w-4 h-4" /><span className="text-[8px] font-black uppercase hidden md:block">Editar</span></button>
          <button onClick={() => onDelete?.(creative.id)} className="p-2 text-slate-300 hover:text-red-500 rounded-lg"><Trash2 className="w-4 h-4" /></button>
        </div>
      </div>

      <div className="p-5 md:p-6 space-y-6">
        <div className="relative rounded-[1.5rem] overflow-hidden bg-slate-100 border border-slate-100 group/img cursor-pointer" onClick={() => onOpenEditor?.(creative)}>
          <img src={creative.imageUrl} className="w-full h-auto object-cover transition-transform group-hover/img:scale-105 duration-700" />
          {creative.layers?.map(l => (
            <div key={l.id} className="absolute pointer-events-none font-black flex items-center justify-center text-center" style={{ left: `${l.x}%`, top: `${l.y}%`, width: `${l.width}%`, height: `${l.height}%`, color: l.color, fontSize: `${l.fontSize * 0.4}px`, fontFamily: l.fontFamily, backgroundColor: l.type === 'button' ? l.backgroundColor : 'transparent', borderRadius: l.type === 'button' ? `${l.borderRadius! * 0.4}px` : '0', transform: 'translate(-50%, -50%)', opacity: (l.opacity || 100) / 100 }}>{l.content}</div>
          ))}
          <div className="absolute inset-0 bg-indigo-900/10 opacity-0 group-hover/img:opacity-100 transition-all flex items-center justify-center">
             <div className="bg-white px-3 py-1.5 rounded-full text-[10px] font-black text-indigo-600 uppercase tracking-widest shadow-xl flex items-center gap-2">
               <Maximize2 className="w-3 h-3" /> Canvas Pro
             </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100 relative group/hook">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[9px] font-black text-indigo-500 uppercase tracking-[0.15em]">O Gatilho (Hook)</span>
              <button onClick={() => setIsEditing(!isEditing)} className="p-1 hover:bg-white rounded"><Edit2 className="w-3 h-3 text-indigo-500" /></button>
            </div>
            {isEditing ? (
              <textarea value={tempCopy.hook} onChange={(e) => setTempCopy({...tempCopy, hook: e.target.value})} className="w-full bg-white border border-indigo-200 rounded-xl p-3 text-xs font-bold text-slate-800 outline-none" rows={2} />
            ) : (
              <p className="text-[13px] font-bold text-slate-800 leading-relaxed italic">"{creative.copy.hook}"</p>
            )}
          </div>

          <div className="space-y-3">
             <div>
               <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Título (Headline)</span>
               {isEditing ? (
                 <input value={tempCopy.headline} onChange={(e) => setTempCopy({...tempCopy, headline: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-black text-slate-900 outline-none" />
               ) : (
                 <h3 className="text-lg font-black text-slate-900 leading-tight uppercase">{creative.copy.headline}</h3>
               )}
             </div>
             
             <div className="relative">
               <div className="flex items-center justify-between mb-1">
                 <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Texto Principal (Copy)</span>
                 <button onClick={() => setExpanded(!expanded)} className="text-indigo-500">{expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}</button>
               </div>
               {isEditing ? (
                 <textarea value={tempCopy.primaryText} onChange={(e) => setTempCopy({...tempCopy, primaryText: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-700 outline-none" rows={4} />
               ) : (
                 <p className={`text-[12px] text-slate-600 leading-relaxed ${expanded ? '' : 'line-clamp-2'} transition-all`}>{creative.copy.primaryText}</p>
               )}
             </div>
          </div>
        </div>

        <div className="pt-2 flex flex-col gap-2">
          {isEditing && <button onClick={handleSave} className="w-full py-3 bg-green-600 text-white rounded-xl font-bold text-[10px] uppercase flex items-center justify-center gap-2"><Save className="w-4 h-4" /> Salvar Alterações</button>}
          <button className="w-full py-4 bg-slate-900 hover:bg-indigo-600 text-white rounded-2xl font-black text-[11px] tracking-[0.2em] transition-all flex items-center justify-center gap-3 uppercase shadow-lg active:scale-95 group/btn">
            {creative.copy.cta} <ExternalLink className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdPreviewCard;
