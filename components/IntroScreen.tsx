import React, { useEffect, useState } from 'react';
import { ambientEngine } from '../utils/audioEngine';
import ThreeIntroScene from './ThreeIntroScene';

interface IntroScreenProps {
  onEnter: () => void;
}

const IntroScreen: React.FC<IntroScreenProps> = ({ onEnter }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);

  useEffect(() => {
    // Fake loading progress for "Lab Initialization"
    const interval = setInterval(() => {
        setLoadingProgress(prev => {
            if (prev >= 100) {
                clearInterval(interval);
                return 100;
            }
            return prev + Math.floor(Math.random() * 5) + 1;
        });
    }, 50);
    return () => clearInterval(interval);
  }, []);

  const handleEnter = () => {
    ambientEngine.playSFX('activate');
    setIsVisible(false);
    setTimeout(onEnter, 800); // Wait for exit animation
  };

  return (
    <div className={`fixed inset-0 z-[100] bg-[#050510] overflow-y-auto overflow-x-hidden transition-all duration-800 ${isVisible ? 'opacity-100' : 'opacity-0 scale-110 pointer-events-none'}`}>
      
      {/* --- 3D BACKGROUND LAYER --- */}
      <div className="fixed inset-0 z-0 opacity-60">
          <ThreeIntroScene />
      </div>

      {/* CRT Scanline Overlay */}
      <div className="fixed inset-0 z-[1] pointer-events-none opacity-20 bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>
      <div className="fixed inset-0 z-[1] pointer-events-none opacity-10" style={{ background: 'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06))', backgroundSize: '100% 2px, 3px 100%' }}></div>

      {/* Scrollable Content Container (UI Overlay) */}
      <div className="min-h-full flex flex-col items-center justify-center p-4 md:p-8 relative z-10">
        <div className="max-w-6xl w-full flex flex-col gap-8 my-8">
            
            {/* HEADER - "Better" */}
            <div className="flex flex-col items-center justify-center relative mt-12 md:mt-4">
                <div className="absolute top-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-50"></div>
                
                <div className="flex items-center gap-6 mb-4 animate-in fade-in zoom-in duration-1000">
                    {/* Animated Beaker Icon */}
                    <div className="relative w-16 h-16 md:w-20 md:h-20 bg-[#0a0a12] border border-cyan-500/30 rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(6,182,212,0.3)] overflow-hidden group">
                        <div className="absolute inset-0 bg-cyan-900/20 group-hover:bg-cyan-900/40 transition-colors"></div>
                        {/* Bubbles */}
                        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-8 h-8 bg-cyan-500/20 rounded-full animate-ping"></div>
                        <div className="relative z-10 text-4xl">🧪</div>
                        {/* Progress Bar Bottom */}
                        <div className="absolute bottom-0 left-0 h-1 bg-cyan-500 transition-all duration-300" style={{ width: `${loadingProgress}%` }}></div>
                    </div>

                    <div className="text-left">
                        <div className="flex items-baseline gap-2">
                             <h1 className="text-5xl md:text-8xl font-bold font-[Rajdhani] uppercase tracking-tighter text-white drop-shadow-[0_0_15px_rgba(6,182,212,0.5)]">
                                Robot <span className="text-cyan-400 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">Talk</span>
                            </h1>
                        </div>
                        <p className="text-cyan-200/60 font-mono text-xs md:text-sm uppercase tracking-[0.4em] pl-1">
                            Periodic Table of Prompt Engineering
                        </p>
                    </div>
                </div>

                <div className="absolute bottom-0 w-full h-px bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-50"></div>
            </div>

            {/* BENTO GRID INFOGRAPHIC */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mt-4">
                
                {/* PANEL 1: WHAT IS THIS? (Left Large) */}
                <div className="md:col-span-7 bg-[#0a0a12]/80 backdrop-blur-xl border border-gray-800 rounded-3xl p-8 relative overflow-hidden group hover:border-cyan-500/50 transition-all duration-500">
                    <div className="absolute -right-10 -top-10 w-40 h-40 bg-cyan-500/10 rounded-full blur-3xl group-hover:bg-cyan-500/20 transition-all"></div>
                    
                    <div className="flex items-start gap-4">
                        <div className="p-3 rounded-xl bg-cyan-900/30 border border-cyan-500/30 text-cyan-400">
                             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white mb-2 uppercase tracking-wide">
                                Become a <span className="text-cyan-400">Robot Whisperer</span>
                            </h2>
                            <p className="text-gray-400 text-sm leading-relaxed mb-6">
                                This isn't magic—it's engineering. Mix instructions like chemical elements to build powerful AI prompts.
                            </p>
                            <div className="flex gap-3">
                                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/40 border border-gray-700 text-xs font-mono text-gray-300">
                                    <span className="w-2 h-2 rounded-full bg-red-500"></span>
                                    NO MAGIC
                                </div>
                                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/40 border border-cyan-500/30 text-xs font-mono text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.1)]">
                                    <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse"></span>
                                    PURE LOGIC
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* PANEL 2: THE ELEMENTS (Right Top - "Too SIMPLE" Fix) */}
                <div className="md:col-span-5 bg-[#0a0a12]/80 backdrop-blur-xl border border-gray-800 rounded-3xl p-6 relative overflow-hidden group hover:border-green-500/50 transition-all">
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10"></div>
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-sm font-bold text-gray-300 uppercase tracking-widest flex items-center gap-2">
                           <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span> The Elements
                        </h2>
                        <span className="text-[10px] font-mono text-green-500 bg-green-900/20 px-2 py-0.5 rounded border border-green-500/30">v3.2 ACTIVE</span>
                    </div>
                    
                    {/* Animated Mini Grid */}
                    <div className="flex gap-3 justify-center">
                        {[
                            { s: 'Cl', name: 'Clarity', c: 'text-green-400', b: 'border-green-500/50', bg: 'bg-green-900/20' },
                            { s: 'Vid', name: 'Video', c: 'text-purple-400', b: 'border-purple-500/50', bg: 'bg-purple-900/20' },
                            { s: 'Gm', name: 'Think', c: 'text-pink-400', b: 'border-pink-500/50', bg: 'bg-pink-900/20' },
                        ].map((el, i) => (
                            <div key={i} className={`w-20 h-20 rounded-xl border ${el.b} ${el.bg} flex flex-col items-center justify-center relative group/card cursor-default hover:scale-105 transition-transform`}>
                                <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity"></div>
                                <span className={`text-2xl font-bold font-mono ${el.c}`}>{el.s}</span>
                                <span className="text-[9px] uppercase text-gray-400 mt-1">{el.name}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* PANEL 3: REACTION CHAMBER (Left Bottom - "nothing Visible" Fix) */}
                <div className="md:col-span-5 bg-[#0a0a12]/80 backdrop-blur-xl border border-gray-800 rounded-3xl p-6 relative overflow-hidden group hover:border-purple-500/50 transition-all">
                     <h2 className="text-sm font-bold text-gray-300 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-purple-500 rounded-full"></span> Reaction Chamber
                     </h2>
                     
                     {/* Animated Simulation */}
                     <div className="bg-black/60 rounded-xl border border-gray-700 p-4 relative">
                        {/* Connecting Lines */}
                        <div className="absolute top-1/2 left-4 right-4 h-0.5 bg-gray-800 -z-0"></div>
                        
                        <div className="flex items-center justify-between relative z-10">
                            {/* Input 1 */}
                            <div className="w-10 h-10 rounded border border-cyan-500/50 bg-cyan-900/20 flex items-center justify-center animate-pulse">
                                <div className="w-6 h-6 border border-cyan-500 opacity-50"></div>
                            </div>
                            {/* Particle Stream */}
                            <div className="flex-1 h-0.5 relative overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-400 to-transparent w-1/2 animate-[shimmer_1.5s_infinite]"></div>
                            </div>
                            {/* Core */}
                            <div className="w-12 h-12 rounded-full border border-purple-500 bg-purple-900/20 flex items-center justify-center relative">
                                <div className="absolute inset-0 border border-purple-400 rounded-full animate-ping opacity-20"></div>
                                <span className="text-xs">⚡</span>
                            </div>
                             {/* Particle Stream */}
                             <div className="flex-1 h-0.5 relative overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-400 to-transparent w-1/2 animate-[shimmer_1.5s_infinite_0.5s]"></div>
                            </div>
                            {/* Output */}
                            <div className="w-10 h-10 rounded border border-green-500/50 bg-green-900/20 flex items-center justify-center">
                                <div className="w-2 h-2 bg-green-500 rounded-full shadow-[0_0_10px_currentColor]"></div>
                            </div>
                        </div>
                        
                        <div className="mt-3 text-center">
                            <span className="text-[10px] font-mono text-purple-300 bg-purple-900/30 px-2 py-0.5 rounded animate-pulse">
                                SYSTEM ACTIVE
                            </span>
                        </div>
                     </div>
                </div>

                {/* PANEL 4: ROBOT TUTOR (Right Bottom - "only animation" Fix) */}
                <div className="md:col-span-7 bg-[#0a0a12]/80 backdrop-blur-xl border border-gray-800 rounded-3xl p-6 relative overflow-hidden group hover:border-orange-500/50 transition-all flex items-center justify-between">
                    <div className="z-10">
                         <h2 className="text-sm font-bold text-gray-300 uppercase tracking-widest mb-2 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-orange-500 rounded-full"></span> The Robot Tutor
                         </h2>
                         <div className="text-gray-400 text-sm max-w-sm">
                             <span className="text-orange-400 font-mono text-xs block mb-1 typing-effect">
                                 {'>'} Initiating Learning Protocols...
                             </span>
                             Stuck? Click any element to start a deep dive session.
                         </div>
                    </div>
                    {/* Dynamic Graphic */}
                    <div className="relative w-24 h-24 flex items-center justify-center">
                        <div className="absolute inset-0 border border-orange-500/20 rounded-full animate-[spin_10s_linear_infinite]"></div>
                        <div className="absolute inset-2 border border-orange-500/20 rounded-full animate-[spin_5s_linear_infinite_reverse]"></div>
                        <div className="text-4xl animate-bounce relative z-10">🤖</div>
                        <div className="absolute bottom-0 right-0 text-2xl animate-pulse">💡</div>
                    </div>
                </div>

            </div>

            {/* CTA BUTTON - "No Lab Theme" Fix */}
            <div className="flex justify-center mt-8 mb-12">
                <button 
                    onClick={handleEnter}
                    className="group relative px-12 py-6 bg-transparent overflow-hidden rounded-2xl transition-all hover:scale-105 active:scale-95"
                >
                    {/* Tech Borders */}
                    <div className="absolute inset-0 border-2 border-cyan-500/50 rounded-2xl clip-path-tech"></div>
                    <div className="absolute inset-0 bg-cyan-900/20 group-hover:bg-cyan-900/40 transition-colors"></div>
                    
                    {/* Animated Scanline */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-cyan-400 opacity-50 shadow-[0_0_20px_rgba(34,211,238,0.8)] animate-[scan_2s_ease-in-out_infinite]"></div>

                    <div className="relative z-10 flex flex-col items-center gap-1">
                        <span className="text-2xl font-bold font-[Rajdhani] uppercase tracking-[0.2em] text-white text-shadow-glow group-hover:text-cyan-200 transition-colors">
                            Enter Laboratory
                        </span>
                        <span className="text-[10px] font-mono text-cyan-500/80 uppercase tracking-widest">
                            Authorization: Granted
                        </span>
                    </div>

                    {/* Corner Accents */}
                    <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-cyan-400"></div>
                    <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-cyan-400"></div>
                    <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-cyan-400"></div>
                    <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-cyan-400"></div>
                </button>
            </div>

        </div>
      </div>

      <style>{`
        .text-shadow-glow {
            text-shadow: 0 0 10px rgba(34,211,238,0.5);
        }
        @keyframes scan {
            0% { top: 0%; opacity: 0; }
            10% { opacity: 1; }
            90% { opacity: 1; }
            100% { top: 100%; opacity: 0; }
        }
        @keyframes shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(200%); }
        }
        .typing-effect::after {
            content: '|';
            animation: blink 1s infinite;
        }
        @keyframes blink {
            0%, 100% { opacity: 1; }
            50% { opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default IntroScreen;