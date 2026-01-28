
import React, { useState, useEffect } from 'react';
import { AdCreative, AspectRatio } from '../types';
import { 
  Download, 
  Trash2, 
  ExternalLink,
  X,
  Maximize2,
  ChevronDown,
  ChevronUp,
  FileText
} from 'lucide-react';
import { jsPDF } from 'jspdf';

interface AdPreviewCardProps {
  creative: AdCreative;
  onDelete?: (id: string) => void;
}

const getAspectRatioClass = (ratio: AspectRatio) => {
  switch (ratio) {
    case '1:1': return 'aspect-square';
    case '9:16': return 'aspect-[9/16]';
    case '16:9': return 'aspect-video';
    case '4:5': return 'aspect-[4/5]';
    case '3:4': return 'aspect-[3/4]';
    case '4:3': return 'aspect-[4/3]';
    default: return 'aspect-square';
  }
};

const AdPreviewCard: React.FC<AdPreviewCardProps> = ({ creative, onDelete }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (isFullscreen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isFullscreen]);

  const fileName = `Criativo ${String(creative.index + 1).padStart(2, '0')} - ${creative.aspectRatio}`;

  const downloadImage = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    const link = document.createElement('a');
    link.download = `${fileName}.png`;
    link.href = creative.imageUrl;
    link.click();
  };

  const downloadPDFPack = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    let yPos = 20;

    // Header
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(79, 70, 229); // Indigo 600
    doc.text("AdStudio Ultra - Creative Pack", margin, yPos);
    yPos += 10;

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`${fileName} | ${creative.platform} Ad`, margin, yPos);
    yPos += 15;

    // Creative Image
    const imgWidth = pageWidth - (margin * 2);
    const imgHeight = (imgWidth / 1); // Simplificado
    doc.addImage(creative.imageUrl, 'PNG', margin, yPos, imgWidth, imgHeight);
    yPos += imgHeight + 15;

    // Hook
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(79, 70, 229);
    doc.text("HOOK DE IMPACTO:", margin, yPos);
    yPos += 7;
    doc.setFont("helvetica", "italic");
    doc.setFontSize(12);
    doc.setTextColor(30);
    doc.text(`"${creative.copy.hook}"`, margin, yPos, { maxWidth: pageWidth - (margin * 2) });
    yPos += 15;

    // Headline
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text("HEADLINE / TÍTULO:", margin, yPos);
    yPos += 7;
    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text(creative.copy.headline.toUpperCase(), margin, yPos, { maxWidth: pageWidth - (margin * 2) });
    yPos += 15;

    // Primary Text
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text("TEXTO PRINCIPAL:", margin, yPos);
    yPos += 7;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(50);
    const splitText = doc.splitTextToSize(creative.copy.primaryText, pageWidth - (margin * 2));
    doc.text(splitText, margin, yPos);
    yPos += (splitText.length * 5) + 10;

    // CTA
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text("CTA (CHAMADA PARA AÇÃO):", margin, yPos);
    yPos += 7;
    doc.setFontSize(12);
    doc.setTextColor(79, 70, 229);
    doc.text(creative.copy.cta.toUpperCase(), margin, yPos);

    doc.save(`${fileName} - Pack.pdf`);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.(creative.id);
  };

  return (
    <>
      <div className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden shadow-sm hover:shadow-2xl transition-all w-full animate-in zoom-in-95 duration-500 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white text-xs font-black shadow-md ${creative.platform === 'Meta' ? 'bg-blue-600' : creative.platform === 'TikTok' ? 'bg-black' : 'bg-red-600'}`}>
              {creative.platform[0]}
            </div>
            <div>
              <h4 className="text-[11px] font-black text-slate-800 uppercase tracking-tighter">Criativo {String(creative.index + 1).padStart(2, '0')}</h4>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{creative.aspectRatio}</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={downloadImage} title="Baixar Imagem Nomeada" className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"><Download className="w-4 h-4" /></button>
            <button onClick={downloadPDFPack} title="Baixar Pack em PDF" className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"><FileText className="w-4 h-4" /></button>
            <button onClick={handleDelete} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"><Trash2 className="w-4 h-4" /></button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex flex-col p-5 space-y-5">
          {/* Responsive Image Container */}
          <div 
            className={`relative rounded-2xl overflow-hidden bg-slate-50 border border-slate-100 group/img cursor-zoom-in shadow-inner w-full ${getAspectRatioClass(creative.aspectRatio)}`}
            onClick={() => setIsFullscreen(true)}
          >
            <img 
              src={creative.imageUrl} 
              className="w-full h-full object-cover transition-transform group-hover/img:scale-105 duration-1000" 
              alt="Ad Visual" 
            />
            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[1px]">
              <div className="bg-white/90 p-3 rounded-full shadow-2xl scale-75 group-hover/img:scale-100 transition-transform duration-500">
                <Maximize2 className="w-5 h-5 text-indigo-600" />
              </div>
            </div>
          </div>

          {/* Copy Area */}
          <div className="space-y-4">
            <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-100/50 relative overflow-hidden">
              <span className="text-[8px] font-black text-indigo-500 uppercase tracking-widest mb-1 block">HOOK DE IMPACTO</span>
              <p className="text-[12px] font-bold text-slate-800 leading-snug italic">"{creative.copy.hook}"</p>
            </div>

            <div className="space-y-3">
               <div>
                 <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 block">TÍTULO</span>
                 <h3 className="text-[15px] font-black text-slate-900 leading-tight uppercase tracking-tight line-clamp-2">{creative.copy.headline}</h3>
               </div>
               
               <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                 <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 block">TEXTO PRINCIPAL</span>
                 <div className={`text-[12px] text-slate-600 leading-relaxed transition-all ${isExpanded ? '' : 'line-clamp-3'}`}>
                   {creative.copy.primaryText}
                 </div>
                 {creative.copy.primaryText.length > 100 && (
                   <button 
                     onClick={() => setIsExpanded(!isExpanded)}
                     className="mt-2 text-indigo-600 text-[9px] font-black uppercase tracking-widest flex items-center gap-1 hover:text-indigo-700"
                   >
                     {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                     {isExpanded ? 'Ver menos' : 'Ver mais'}
                   </button>
                 )}
               </div>
            </div>
          </div>

          <div className="mt-auto pt-2">
            <button className="w-full py-4 bg-slate-900 hover:bg-indigo-600 text-white rounded-xl font-black text-[10px] tracking-widest transition-all flex items-center justify-center gap-3 uppercase shadow-lg active:scale-[0.98] group/btn">
              {creative.copy.cta} <ExternalLink className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>

      {/* Fullscreen Modal */}
      {isFullscreen && (
        <div 
          className="fixed inset-0 z-[100] bg-black/95 flex flex-col items-center justify-center p-4 animate-in fade-in duration-300"
          onClick={() => setIsFullscreen(false)}
        >
          <div className="absolute top-6 right-6 flex gap-4 z-50">
            <button onClick={downloadImage} className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all backdrop-blur-md border border-white/20"><Download className="w-5 h-5" /></button>
            <button onClick={() => setIsFullscreen(false)} className="p-3 bg-white/10 hover:bg-red-500 text-white rounded-full transition-all backdrop-blur-md border border-white/20"><X className="w-5 h-5" /></button>
          </div>
          <div className="relative max-w-4xl w-full max-h-full flex items-center justify-center">
            <img 
              src={creative.imageUrl} 
              className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl animate-in zoom-in-95 duration-500"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default AdPreviewCard;