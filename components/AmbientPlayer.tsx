
import React, { useState } from 'react';
import { ambientEngine } from '../utils/audioEngine';

const AmbientPlayer: React.FC = () => {
  const [isAudioEnabled, setIsAudioEnabled] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const toggleAudio = async () => {
    if (!isAudioEnabled) {
      await ambientEngine.enableAudio();
      ambientEngine.mute(false);
    } else {
      ambientEngine.mute(true);
    }
    setIsAudioEnabled(!isAudioEnabled);
  };

  return (
    <div 
        className={`fixed top-4 right-4 z-50 flex items-center gap-4 transition-all duration-500 ease-out ${isHovered || isAudioEnabled ? 'opacity-100 translate-y-0' : 'opacity-60 -translate-y-2'}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-center gap-3 bg-black/40 backdrop-blur-md rounded-full p-1 border border-gray-800">
        <button
            onClick={toggleAudio}
            className={`relative flex items-center justify-center gap-2 px-3 h-8 rounded-full transition-all duration-300 ${
            isAudioEnabled 
                ? 'bg-cyan-900/50 text-cyan-400 border border-cyan-500/30 shadow-[0_0_15px_rgba(34,211,238,0.2)]' 
                : 'bg-transparent text-gray-400 hover:text-white'
            }`}
        >
            <span className="text-[10px] font-bold uppercase tracking-wider">
                {isAudioEnabled ? 'SFX ON' : 'SFX OFF'}
            </span>
            {isAudioEnabled ? (
               <div className="flex gap-0.5 items-center h-3">
                   <div className="w-0.5 h-2 bg-cyan-400 animate-pulse"></div>
                   <div className="w-0.5 h-3 bg-cyan-400 animate-pulse delay-75"></div>
                   <div className="w-0.5 h-1.5 bg-cyan-400 animate-pulse delay-150"></div>
               </div>
            ) : (
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                </svg>
            )}
        </button>
      </div>
    </div>
  );
};

export default AmbientPlayer;
