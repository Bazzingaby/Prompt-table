import React from 'react';
import { Tier2Topic } from '../types';

interface MarqueeProps {
  topics: Tier2Topic[];
  direction?: 'left' | 'right';
}

const Marquee: React.FC<MarqueeProps> = ({ topics, direction = 'left' }) => {
  // Duplicate list to create seamless loop
  const displayList = [...topics, ...topics, ...topics];

  return (
    <div className="relative flex overflow-hidden w-full h-8 bg-[#0a0a12] border-y border-gray-800 items-center">
      <div 
        className="animate-marquee flex gap-10 whitespace-nowrap px-4"
        style={{ animationDirection: direction === 'right' ? 'reverse' : 'normal', animationDuration: '60s' }}
      >
        {displayList.map((t, i) => (
          <div key={i} className="flex items-center gap-2 font-mono text-xs tracking-wider">
            <span className="text-gray-400 font-bold">{t.name}</span>
            <div className={`flex items-center gap-1 ${t.sentiment === 'up' ? 'text-green-500' : t.sentiment === 'down' ? 'text-red-500' : 'text-gray-500'}`}>
               {t.sentiment === 'up' && '▲'}
               {t.sentiment === 'down' && '▼'}
               {t.sentiment === 'neutral' && '•'}
               <span>{t.trend}%</span>
            </div>
          </div>
        ))}
      </div>
      
      {/* Gradients */}
      <div className="absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-[#050510] to-transparent z-10 pointer-events-none"></div>
      <div className="absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-[#050510] to-transparent z-10 pointer-events-none"></div>
    </div>
  );
};

export default Marquee;