
import React, { useState, useEffect } from 'react';
import { TOPICS, TIER_2_TOPICS, MEDIA_TOPICS } from './data';
import { Topic, Category } from './types';
import ElementCard from './components/ElementCard';
import Modal from './components/Modal';
import Marquee from './components/Marquee';
import PromptBuilder from './components/PromptBuilder';
import AmbientPlayer from './components/AmbientPlayer';
import IntroScreen from './components/IntroScreen';

const App: React.FC = () => {
  const [showIntro, setShowIntro] = useState(true);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [builderTopics, setBuilderTopics] = useState<Topic[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('ALL');
  const [isBuilderExpanded, setIsBuilderExpanded] = useState(false);

  const categories = Object.values(Category).filter(c => c !== Category.VIDEO && c !== Category.AUDIO && c !== Category.VOICE);
  
  const mainTopics = TOPICS.filter(t => t.category !== Category.COMMAND);
  const commandTopics = TOPICS.filter(t => t.category === Category.COMMAND);

  const filteredTopics = activeCategory === 'ALL' 
    ? mainTopics 
    : mainTopics.filter(t => t.category === activeCategory);

  const toggleBuilderTopic = (topic: Topic) => {
    if (builderTopics.find(t => t.symbol === topic.symbol)) {
        setBuilderTopics(builderTopics.filter(t => t.symbol !== topic.symbol));
    } else {
        setBuilderTopics([...builderTopics, topic]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const symbol = e.dataTransfer.getData("topicId");
    const allTopics = [...TOPICS, ...MEDIA_TOPICS];
    const topic = allTopics.find(t => t.symbol === symbol);
    if (topic && !builderTopics.find(t => t.symbol === symbol)) {
        setBuilderTopics([...builderTopics, topic]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => e.preventDefault();

  return (
    <>
    {showIntro && <IntroScreen onEnter={() => setShowIntro(false)} />}
    
    <div 
        className={`min-h-screen text-white pb-64 md:pb-40 relative flex flex-col transition-opacity duration-1000 ${showIntro ? 'opacity-0 h-screen overflow-hidden' : 'opacity-100'}`}
        onDrop={handleDrop} 
        onDragOver={handleDragOver}
    >
      
      {/* --- AUDIO CONTROLLER --- */}
      <AmbientPlayer />

      {/* --- STOCK TICKER HEADER --- */}
      <div className="sticky top-0 z-30 shadow-2xl shadow-black">
        <Marquee topics={TIER_2_TOPICS} direction="left" />
      </div>

      <header className="pt-8 pb-4 text-center px-4 relative z-10">
        <h1 className="text-4xl md:text-6xl font-bold font-[Rajdhani] mb-1 neon-text-cyan tracking-tighter uppercase">
          Periodic Table
        </h1>
        <p className="text-gray-500 font-mono text-xs max-w-lg mx-auto mb-6">
          MARKET DATA // VERSION 3.2 // BUILDER ACTIVE
        </p>

        {/* --- CATEGORY FILTER BAR --- */}
        <div className="flex flex-wrap justify-center gap-2 max-w-4xl mx-auto mb-4">
            <button 
                onClick={() => setActiveCategory('ALL')}
                className={`px-3 py-1 text-[10px] md:text-xs font-bold uppercase tracking-wider border rounded transition-all ${activeCategory === 'ALL' ? 'bg-white text-black border-white' : 'border-gray-700 text-gray-500 hover:border-gray-500'}`}
            >
                ALL MARKET
            </button>
            {categories.filter(c => c !== Category.COMMAND).map((cat) => (
                <button 
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-3 py-1 text-[10px] md:text-xs font-bold uppercase tracking-wider border rounded transition-all ${activeCategory === cat ? 'bg-gray-800 text-white border-white' : 'border-gray-800 text-gray-600 hover:border-gray-600'}`}
                >
                    {cat}
                </button>
            ))}
        </div>
      </header>

      {/* --- MAIN GRID --- */}
      <main className="container mx-auto px-4 md:px-8 max-w-7xl relative z-10 mb-8 flex-grow">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {filteredTopics.map((topic, index) => (
            <ElementCard 
              key={index} 
              topic={topic} 
              onClick={setSelectedTopic}
              onSelect={toggleBuilderTopic}
              isSelected={!!builderTopics.find(t => t.symbol === topic.symbol)}
            />
          ))}
        </div>
      </main>

      {/* --- MEDIA SERIES (Detached Row) --- */}
      <section className="container mx-auto px-4 md:px-8 max-w-2xl relative z-10 mb-12">
        <div className="flex items-center gap-4 mb-4 justify-center">
            <div className="h-px w-12 bg-gray-700"></div>
            <h3 className="text-gray-500 font-bold font-mono tracking-widest text-[10px] uppercase">Media Generation Series</h3>
            <div className="h-px w-12 bg-gray-700"></div>
        </div>
        
        <div className="grid grid-cols-3 gap-6 md:gap-12 px-4 md:px-12">
            {MEDIA_TOPICS.map((topic, index) => (
                <ElementCard 
                    key={index} 
                    topic={topic} 
                    onClick={setSelectedTopic}
                    onSelect={toggleBuilderTopic}
                    isSelected={!!builderTopics.find(t => t.symbol === topic.symbol)}
                />
            ))}
        </div>
      </section>

      {/* --- BULLETIN BOARD (COMMAND TOPICS) --- */}
      <section className="container mx-auto px-4 md:px-8 max-w-7xl relative z-10 mb-12">
        <div className="flex items-center gap-4 mb-4">
             <div className="h-px flex-grow bg-gradient-to-r from-transparent via-purple-900 to-transparent"></div>
             <h3 className="text-purple-400 font-bold font-mono tracking-widest text-sm uppercase">Bulletin Board // Commands</h3>
             <div className="h-px flex-grow bg-gradient-to-r from-transparent via-purple-900 to-transparent"></div>
        </div>
        
        <div className="flex gap-4 overflow-x-auto pb-6 custom-scrollbar px-2 snap-x">
             {commandTopics.map((topic, index) => (
                 <div key={index} className="min-w-[140px] md:min-w-[160px] snap-center">
                    <ElementCard 
                        topic={topic} 
                        onClick={setSelectedTopic}
                        onSelect={toggleBuilderTopic}
                        isSelected={!!builderTopics.find(t => t.symbol === topic.symbol)}
                    />
                 </div>
             ))}
        </div>
      </section>

      {/* --- BUILDER BAR --- */}
      <PromptBuilder 
        selectedTopics={builderTopics} 
        onRemove={toggleBuilderTopic}
        // Pass state control down
        onExpandStateChange={setIsBuilderExpanded}
      />

      {/* --- MODAL --- */}
      {selectedTopic && (
        <Modal 
          topic={selectedTopic} 
          onClose={() => setSelectedTopic(null)} 
        />
      )}
    </div>
    </>
  );
};

export default App;
