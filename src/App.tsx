import React, { useState, useEffect } from 'react';
import { DrawingBoard } from './components/DrawingBoard';
import { useBoardSocket } from './lib/socket';
import { User, LogIn, LayoutGrid, CheckCircle2, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { v4 as uuidv4 } from 'uuid';

const BOARD_ID = 'corporate-training-1'; 

export default function App() {
  const [userName, setUserName] = useState<string>(localStorage.getItem('trainer_user_name') || '');
  const [userSubmitted, setUserSubmitted] = useState(!!userName);
  const [userId] = useState<string>(() => {
    let id = localStorage.getItem('trainer_user_id');
    if (!id) {
      id = uuidv4();
      localStorage.setItem('trainer_user_id', id);
    }
    return id;
  });

  const { strokes, addStroke, clearStrokes, isConnected } = useBoardSocket(BOARD_ID);

  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (userName.trim()) {
      localStorage.setItem('trainer_user_name', userName);
      setUserSubmitted(true);
    }
  };

  if (!userSubmitted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 bg-dot-pattern">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-2xl p-10 max-w-md w-full border border-slate-200"
        >
          <div className="flex justify-center mb-8">
            <div className="w-20 h-20 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl rotate-3">
              <LayoutGrid size={40} strokeWidth={2.5} />
            </div>
          </div>
          
          <div className="text-center mb-10">
            <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">협업 전략 캔버스</h1>
            <p className="text-slate-500 font-medium">기업교육: 리더십 커뮤니케이션 워크숍</p>
          </div>
          
          <form onSubmit={handleNameSubmit} className="space-y-6">
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-3 ml-1">참여자 성함</label>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="홍길동"
                className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 focus:bg-white outline-none transition-all placeholder:text-slate-300 font-semibold text-lg"
                autoFocus
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold text-lg hover:bg-indigo-700 active:scale-[0.98] transition-all shadow-xl shadow-indigo-100 flex items-center justify-center gap-3 group"
            >
              워크숍 입장
              <LogIn size={22} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </form>
          
          <div className="mt-12 pt-8 border-t border-slate-100 flex justify-between items-center px-2">
            <div className="flex items-center gap-2.5 text-slate-400">
              <Users size={16} />
              <span className="text-[11px] font-bold uppercase tracking-widest">Real-time</span>
            </div>
            <div className="flex items-center gap-2.5 text-slate-400">
              <CheckCircle2 size={16} />
              <span className="text-[11px] font-bold uppercase tracking-widest">Autosave</span>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full flex flex-col bg-slate-50">
      <DrawingBoard
        strokes={strokes}
        onAddStroke={addStroke}
        onClear={clearStrokes}
        userId={userId}
        userName={userName}
        isConnected={isConnected}
        backgroundUrl="/background.png"
      />
    </div>
  );
}
