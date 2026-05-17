import React, { useEffect, useRef, useState } from 'react';
import { Stage, Layer, Line, Image as KonvaImage } from 'react-konva';
import { v4 as uuidv4 } from 'uuid';
import { Stroke } from '../types';
import { Pencil, Eraser, Trash2, Download, MousePointer2, Settings2, Info, ChevronRight, Activity, Brush, Palette, LayoutGrid } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

const useImage = (url: string) => {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  useEffect(() => {
    if (!url) return;
    const img = new Image();
    img.src = url;
    img.onload = () => setImage(img);
  }, [url]);
  return image;
};

interface DrawingBoardProps {
  strokes: Stroke[];
  onAddStroke: (stroke: Stroke) => void;
  onClear: () => void;
  userId: string;
  userName: string;
  isConnected: boolean;
  backgroundUrl?: string;
}

export const DrawingBoard: React.FC<DrawingBoardProps> = ({
  strokes,
  onAddStroke,
  onClear,
  userId,
  userName,
  isConnected,
  backgroundUrl = '/background.png'
}) => {
  const [tool, setTool] = useState<'pen' | 'eraser'>('pen');
  const [color, setColor] = useState('#4f46e5');
  const [width, setWidth] = useState(4);
  const [isDrawing, setIsDrawing] = useState(false);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [bgError, setBgError] = useState(false);
  
  const stageRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasWrapperRef = useRef<HTMLDivElement>(null);
  const bgImage = useImage(backgroundUrl);

  const [currentPoints, setCurrentPoints] = useState<number[]>([]);

  useEffect(() => {
    if (bgImage) setBgError(false);
    else if (backgroundUrl) {
      const img = new Image();
      img.src = backgroundUrl;
      img.onerror = () => setBgError(true);
    }
  }, [backgroundUrl, bgImage]);

  useEffect(() => {
    const handleResize = () => {
      if (canvasWrapperRef.current) {
        setDimensions({
          width: canvasWrapperRef.current.clientWidth,
          height: canvasWrapperRef.current.clientHeight
        });
      }
    };
    const observer = new ResizeObserver(handleResize);
    if (canvasWrapperRef.current) {
      observer.observe(canvasWrapperRef.current);
    }
    handleResize();
    return () => observer.disconnect();
  }, []);

  const handleMouseDown = (e: any) => {
    setIsDrawing(true);
    const pos = e.target.getStage().getPointerPosition();
    setCurrentPoints([pos.x, pos.y]);
  };

  const handleMouseMove = (e: any) => {
    if (!isDrawing) return;
    const stage = e.target.getStage();
    const point = stage.getPointerPosition();
    setCurrentPoints(prev => [...prev, point.x, point.y]);
  };

  const handleMouseUp = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    
    if (currentPoints.length > 2) {
      const newStroke: Stroke = {
        id: uuidv4(),
        points: currentPoints,
        color: tool === 'eraser' ? '#ffffff' : color,
        width: width,
        tool: tool,
        userId: userId,
        timestamp: new Date().toISOString(),
      };
      onAddStroke(newStroke);
    }
    setCurrentPoints([]);
  };

  const downloadImage = () => {
    if (!stageRef.current) return;
    const uri = stageRef.current.toDataURL();
    const link = document.createElement('a');
    link.download = `collaboration-${new Date().getTime()}.png`;
    link.href = uri;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 font-sans overflow-hidden" ref={containerRef}>
      {/* Header */}
      <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shadow-sm z-20 shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-100">
            <LayoutGrid size={24} strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-lg font-extrabold text-slate-900 leading-tight">협업 전략 캔버스</h1>
            <div className="flex items-center gap-2">
              <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">기업교육: 리더십 커뮤니케이션 워크숍</p>
              <div className={cn(
                "w-2 h-2 rounded-full animate-pulse",
                isConnected ? "bg-emerald-500" : "bg-red-500"
              )} />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex -space-x-3 items-center mr-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-500 ring-2 ring-slate-100">
                U{i}
              </div>
            ))}
            <div className="w-8 h-8 rounded-full border-2 border-white bg-indigo-50 flex items-center justify-center text-[10px] font-bold text-indigo-600 ring-2 ring-indigo-50">
              +{Math.max(0, strokes.length)}
            </div>
          </div>
          <button 
            onClick={downloadImage}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all"
          >
            <Download size={16} />
            결과 저장
          </button>
        </div>
      </header>

      <div className="flex flex-1 relative overflow-hidden">
        {/* Left Toolbar Sidebar */}
        <aside className="w-20 bg-white border-r border-slate-200 flex flex-col items-center py-8 gap-8 shadow-[1px_0_10px_rgba(0,0,0,0.02)] z-10">
          <div className="flex flex-col gap-3">
            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest text-center mb-1">Tools</span>
            <button
              onClick={() => setTool('pen')}
              className={cn(
                "p-3 rounded-2xl transition-all duration-300 transform",
                tool === 'pen' ? "bg-indigo-600 text-white shadow-xl shadow-indigo-100 scale-110" : "bg-slate-50 text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              )}
            >
              <Pencil size={20} strokeWidth={2.5} />
            </button>
            <button
              onClick={() => setTool('eraser')}
              className={cn(
                "p-3 rounded-2xl transition-all duration-300 transform",
                tool === 'eraser' ? "bg-indigo-600 text-white shadow-xl shadow-indigo-100 scale-110" : "bg-slate-50 text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              )}
            >
              <Eraser size={20} strokeWidth={2.5} />
            </button>
          </div>

          <div className="w-8 h-px bg-slate-100" />

          <div className="flex flex-col gap-4 items-center">
             <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest text-center">Color</span>
             {[
               { hex: '#4f46e5', label: 'Indigo' },
               { hex: '#ef4444', label: 'Red' },
               { hex: '#10b981', label: 'Emerald' },
               { hex: '#f59e0b', label: 'Amber' },
               { hex: '#0f172a', label: 'Slate' }
             ].map((c) => (
               <button
                 key={c.hex}
                 onClick={() => { setColor(c.hex); setTool('pen'); }}
                 className={cn(
                   "w-6 h-6 rounded-full transition-all duration-300 border-2",
                   color === c.hex ? "ring-4 ring-indigo-50 border-white scale-125 shadow-md" : "border-transparent hover:scale-110"
                 )}
                 style={{ backgroundColor: c.hex }}
               />
             ))}
             <input
              type="color"
              value={color}
              onChange={(e) => { setColor(e.target.value); setTool('pen'); }}
              className="w-8 h-8 rounded-full border-0 p-0 cursor-pointer overflow-hidden shadow-sm"
            />
          </div>

          <div className="mt-auto mb-4 flex flex-col items-center gap-6">
            <button
              onClick={onClear}
              className="p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all"
              title="Clear Board"
            >
              <Trash2 size={22} />
            </button>
            <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 font-bold text-[10px]">
              {userName.substring(0, 2).toUpperCase()}
            </div>
          </div>
        </aside>

        {/* Main Canvas Area */}
        <main className="flex-1 p-8 flex items-center justify-center relative bg-dot-pattern">
          <div 
            className="w-full h-full bg-white rounded-[2rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.08)] border border-slate-200 relative overflow-hidden flex flex-col"
            ref={canvasWrapperRef}
          >
            {/* Background Template Watermark */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none flex items-center justify-center">
              <h2 className="text-[15vw] font-black text-slate-900 rotate-[-20deg] select-none tracking-tighter">CANVAS</h2>
            </div>

            <Stage
              width={dimensions.width}
              height={dimensions.height}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onTouchStart={handleMouseDown}
              onTouchMove={handleMouseMove}
              onTouchEnd={handleMouseUp}
              ref={stageRef}
              className="cursor-crosshair"
            >
              <Layer>
                {/* Background Image */}
                {bgImage && (
                  <KonvaImage
                    image={bgImage}
                    width={dimensions.width}
                    height={dimensions.height}
                    listening={false}
                  />
                )}
                
                {/* Existing Strokes */}
                {strokes.map((stroke) => (
                  <Line
                    key={stroke.id}
                    points={stroke.points}
                    stroke={stroke.color}
                    strokeWidth={stroke.width}
                    tension={0.5}
                    lineCap="round"
                    lineJoin="round"
                    globalCompositeOperation={
                      stroke.tool === 'eraser' ? 'destination-out' : 'source-over'
                    }
                  />
                ))}
                
                {/* Current Active Stroke */}
                {isDrawing && (
                  <Line
                    points={currentPoints}
                    stroke={tool === 'eraser' ? '#ffffff' : color}
                    strokeWidth={width}
                    tension={0.5}
                    lineCap="round"
                    lineJoin="round"
                    globalCompositeOperation={
                      tool === 'eraser' ? 'destination-out' : 'source-over'
                    }
                  />
                )}
              </Layer>
            </Stage>

            {bgError && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="bg-white/90 backdrop-blur-xl p-10 rounded-[2.5rem] border border-slate-100 shadow-2xl max-w-sm text-center pointer-events-auto mx-4">
                  <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm">
                    <Palette size={32} strokeWidth={2.5} />
                  </div>
                  <h3 className="text-xl font-black text-slate-900 mb-3 tracking-tight">배경 이미지가 비어있습니다</h3>
                  <p className="text-slate-500 text-sm leading-relaxed mb-8">
                    워크스페이스에 <code className="bg-slate-100 px-1.5 py-0.5 rounded text-indigo-600 font-mono text-xs">background.png</code> 파일을 업로드해 주세요. 학습자들을 위한 템플릿이 표시됩니다.
                  </p>
                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">
                    Collaboration Canvas Mode
                  </div>
                </div>
              </div>
            )}
            
            {/* Legend / Info Overlay */}
            <div className="absolute bottom-6 left-6 p-4 bg-white/70 backdrop-blur-md border border-slate-100 rounded-2xl shadow-lg pointer-events-none">
               <div className="flex items-center gap-3">
                 <div className="flex items-center gap-1">
                   <div className="w-3 h-3 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.4)]" />
                   <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">LIVE</span>
                 </div>
                 <div className="h-3 w-px bg-slate-300" />
                 <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{userName} 님 세션 활성</span>
               </div>
            </div>
          </div>
        </main>

        {/* Right Info Sidebar */}
        <aside className="hidden xl:flex w-72 bg-white border-l border-slate-200 p-8 flex-col gap-10 shadow-[-1px_0_10px_rgba(0,0,0,0.02)]">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-[11px] font-black text-slate-300 uppercase tracking-[0.2em]">Workshop Meta</h3>
              <Settings2 size={14} className="text-slate-300" />
            </div>
            <div className="space-y-4">
              <div className="p-5 bg-indigo-50/50 rounded-2xl border border-indigo-50">
                <p className="text-[11px] font-bold text-indigo-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Activity size={14} /> 진행 프로세스
                </p>
                <div className="h-2 w-full bg-indigo-100 rounded-full overflow-hidden shadow-inner">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: '45%' }}
                    className="h-full bg-indigo-600 rounded-full"
                  />
                </div>
                <div className="mt-3 flex justify-between text-[10px] font-bold text-indigo-700">
                  <span>문제 정의</span>
                  <span>45%</span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6 flex-1 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between">
              <h3 className="text-[11px] font-black text-slate-300 uppercase tracking-[0.2em]">Activity Feed</h3>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
            </div>
            <div className="space-y-6 text-xs overflow-y-auto pr-2 scrollbar-hide">
              {strokes.slice(-5).reverse().map((s, idx) => (
                <div key={s.id} className="flex gap-4 group">
                  <div className="w-8 h-8 shrink-0 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 font-bold shadow-sm group-hover:bg-indigo-50 group-hover:text-indigo-500 transition-colors">
                    {s.userId.substring(0, 1)}
                  </div>
                  <div>
                    <p className="font-black text-slate-800 leading-tight">Anonymous User</p>
                    <p className="text-slate-500 mt-0.5 flex items-center gap-1.5">
                      <Brush size={10} /> 드로잉 브러시 액션
                    </p>
                    <p className="text-[9px] text-slate-300 font-bold mt-1 uppercase">Just Now</p>
                  </div>
                </div>
              ))}
              {strokes.length === 0 && (
                <div className="text-center py-10 opacity-30 select-none">
                  <Info size={40} className="mx-auto mb-4" />
                  <p className="font-bold text-[11px] uppercase tracking-widest leading-loose">No activity detected yet<br />Start drawing to begin</p>
                </div>
              )}
            </div>
          </div>

          <div className="mt-auto p-5 bg-slate-900 rounded-[2rem] text-white shadow-2xl shadow-indigo-100">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center">
                <Info size={16} />
              </div>
              <p className="text-xs font-black tracking-tight leading-tight">Instructor Tip</p>
            </div>
            <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
              왼쪽 툴바의 도구를 사용하여 배경 템플릿 위에 전략 로드맵을 그려보세요. 모든 참여자들과 실시간으로 공유됩니다.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
};
