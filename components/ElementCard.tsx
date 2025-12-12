import React from 'react';
import { Topic, Category, CATEGORY_STYLES, CATEGORY_HOVER_STYLES } from '../types';

interface ElementCardProps {
  topic: Topic;
  onClick: (topic: Topic) => void;
  onSelect?: (topic: Topic) => void;
  isSelected?: boolean;
}

const ElementCard: React.FC<ElementCardProps> = ({ topic, onClick, onSelect, isSelected }) => {
  const category = topic.category as Category;
  const colorClasses = CATEGORY_STYLES[category] || 'text-gray-400 border-gray-500';
  const hoverBg = CATEGORY_HOVER_STYLES[category] || 'hover:bg-gray-800';

  // Added 'hover-neon-pulse' to baseClasses
  const baseClasses = `relative flex flex-col justify-between p-3 md:p-4 aspect-square border-2 backdrop-blur-sm cursor-pointer transition-all duration-300 transform group overflow-hidden hover-neon-pulse ${isSelected ? 'ring-2 ring-white scale-95 opacity-100 bg-gray-800' : 'bg-[#0f0e17]/80 hover:-translate-y-1'}`;

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData("topicId", topic.symbol);
    e.dataTransfer.effectAllowed = "copy";
  };

  return (
    <div 
      className={`${baseClasses} ${colorClasses} ${hoverBg}`}
      onClick={() => onClick(topic)}
      draggable="true"
      onDragStart={handleDragStart}
      role="button"
      tabIndex={0}
    >
      {/* Nano Banana Procedural Texture Overlay for Gemini */}
      {category === Category.GEMINI && (
         <div className="absolute inset-0 opacity-20 pointer-events-none bg-[conic-gradient(from_0deg_at_50%_50%,transparent_0deg,rgba(236,72,153,0.3)_60deg,transparent_120deg,rgba(168,85,247,0.3)_180deg,transparent_240deg,rgba(236,72,153,0.3)_300deg,transparent_360deg)] mix-blend-screen"></div>
      )}

      <div className="flex justify-between items-start relative z-10">
         <span className="text-xs font-mono opacity-70 group-hover:opacity-100 uppercase tracking-tighter">
            {category.slice(0, 3)}
         </span>
         
         {/* Selection Indicator or Decoration */}
         {onSelect ? (
            <div 
                className={`w-4 h-4 rounded-full border border-current flex items-center justify-center transition-all ${isSelected ? 'bg-current text-black' : 'hover:bg-white/10'}`}
                onClick={(e) => {
                    e.stopPropagation();
                    onSelect(topic);
                }}
            >
                {isSelected && <span className="text-[10px] font-bold">✓</span>}
            </div>
         ) : (
            <div className="w-1.5 h-1.5 rounded-full bg-current shadow-[0_0_5px_currentColor]"></div>
         )}
      </div>

      <div className="flex flex-col items-center justify-center flex-grow relative z-10">
        <h2 className={`text-4xl md:text-5xl font-bold font-mono tracking-tighter drop-shadow-lg`}>
          {topic.symbol}
        </h2>
      </div>

      <div className="mt-2 text-center relative z-10">
         <p className="text-[10px] md:text-xs font-bold tracking-wider uppercase truncate w-full">
           {topic.element}
         </p>
         <p className="text-[9px] opacity-60 hidden md:block truncate mt-1 w-full px-1">
           {topic.description}
         </p>
      </div>
      
      {/* Corner Accent */}
      <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-current opacity-50 group-hover:opacity-100 relative z-10"></div>
    </div>
  );
};

export default ElementCard;